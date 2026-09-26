"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Upload, Power, Eye } from "lucide-react";
import ModalShell from "@/components/for_manager/modals/ModalShell";
import api from "@/api/api";
import DeepDiveView from "@/components/for_client/DeepDiveView";
import "@/app/(dashboard)/client/client.css";

export default function ManagerClients() {
   const { user } = useAuth(); 
  const [clients, setClients] = useState([]);

  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
    const [deepDiveClient, setDeepDiveClient] = useState(null);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
   const [newContactPerson, setNewContactPerson] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadListName, setUploadListName] = useState(""); // Add this line
  const [uploadStatus, setUploadStatus] = useState("");

   // Client Contacts State
  const [clientUsers, setClientUsers] = useState([]);
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPassword, setNewContactPassword] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);

  // Lead Lists State
  const [leadLists, setLeadLists] = useState([]);


  const limit = 10;
  const totalPages = Math.ceil(clients.length / limit) || 1;
  const paginatedClients = clients.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    // Endpoint #11: GET /api/v1/clients
    api.get(`/clients?page=${page}&limit=${limit}`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (data?.clients) setClients(data.clients);
      })
      .catch((err) => console.log("Using clients list mock", err));
  }, [page]);

  useEffect(() => {
    if (selectedClient) {
      api.get(`/users?role=client&clientId=${selectedClient.id}`)
        .then(res => setClientUsers(res.data?.data?.users || []))
        .catch(err => console.error("Failed to load client users"));
        fetchLeadLists();
    }
  }, [selectedClient]);

   const fetchLeadLists = () => {
    if(!selectedClient) return;
    api.get(`/lead-lists?clientId=${selectedClient.id}`)
      .then(res => setLeadLists(res.data?.data || []))
      .catch(err => console.error("Failed to load lead lists"));
  };

  useEffect(() => {
    const hasActiveJobs = leadLists.some(list => {
      const status = list.importJobs?.[0]?.status;
      return status === "Uploaded" || status === "Queued" || status === "Processing";
    });
    
    let interval;
    if (hasActiveJobs && selectedClient) {
      interval = setInterval(() => {
        fetchLeadLists();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [leadLists, selectedClient]);

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users", {
        fullName: newContactName,
        email: newContactEmail,
        password: newContactPassword,
        role: "client",
        clientId: selectedClient.id
      });
      const res = await api.get(`/users?role=client&clientId=${selectedClient.id}`);
      setClientUsers(res.data?.data?.users || []);
      setShowAddContact(false);
      setNewContactName("");
      setNewContactEmail("");
      setNewContactPassword("");
    } catch(err) {
      alert(err.response?.data?.error?.message || "Failed to add contact");
    }
  };

  const handleRemoveContact = async (userId) => {
    if(!window.confirm("Are you sure you want to remove this contact?")) return;
    try {
      await api.patch(`/users/${userId}`, { isActive: false });
      const res = await api.get(`/users?role=client&clientId=${selectedClient.id}`);
      setClientUsers(res.data?.data?.users || []);
    } catch(err) {
      alert("Failed to remove contact");
    }
  };

  // Endpoint #12: POST /api/v1/clients
      const handleCreateClient = async (e) => {
    e.preventDefault();
    
    // STRICT ENFORCEMENT: Stop everything if the user ID is missing
    if (!user || !user.id) {
      alert("Error: Manager ID is missing. Your session might be lost. Please log in again.");
      return; 
    }

    const payload = { 
      name: newClientName, 
      contactPerson: newContactPerson, 
      contactEmail: newClientEmail,
      password: newPassword,  
      managerId: user.id // Strictly the real ID
    };

    try {
      const res = await api.post("/clients", payload);
      const created = res.data?.data ?? res.data;
      
      // ONLY update the table if the backend succeeds!
      setClients([{
        id: created?.id,
        name: created?.name || newClientName,
        activeCampaigns: 0,
        contactEmail: created?.contactEmail || newClientEmail,
        status: "Active",
      }, ...clients]);

      // Reset fields and close modal on success
      setNewClientName("");
      setNewClientEmail("");
      setNewContactPerson("");
      setNewPassword("");
      setIsCreateModalOpen(false);

    } catch (error) {
      console.error("Backend Error:", error.response?.data || error);
      alert("Failed to create client. Check the console for details.");
    }
  };

  // Endpoint #14: PATCH /api/v1/clients/:id
    const handleToggleStatus = async (clientId, currentStatus) => {
    const nextStatus = currentStatus === "Active" ? "Paused" : "Active";
    try {
      // CHANGED: Send the boolean 'isActive' that the backend requires
      await api.patch(`/clients/${clientId}`, { isActive: nextStatus === "Active" });
    } catch (e) { /* optimistic fallback */ }

    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, status: nextStatus } : c))
    );
    if (selectedClient?.id === clientId) {
      setSelectedClient((prev) => ({ ...prev, status: nextStatus }));
    }
  };

  // Endpoint #15: POST /api/v1/lead-lists/upload
  const handleCSVUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedClient || !uploadListName) return;
    
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("clientId", selectedClient.id);
    formData.append("name", uploadListName); // Backend requires a name for the audience container

    setUploadStatus("Uploading CSV to S3 & initiating import job...");
    try {
      await api.post("/lead-lists/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadStatus("Upload complete! Background import service started.");
      setUploadListName(""); // reset form
      setUploadFile(null);
       fetchLeadLists();
    } catch (error) {
      console.error("Upload failed", error);
      const msg = error.response?.data?.error?.message || error.response?.data?.message || "Upload failed";
      setUploadStatus(`Error: ${msg}`);
    }
  };

   if (deepDiveClient) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setDeepDiveClient(null)} className="mgr-btn mgr-btn-outline">
            <ChevronLeft size={16} /> Back to Clients
          </button>
          <div className="font-extrabold text-lg text-slate-800">
            Deep Dive: {deepDiveClient.name}
          </div>
        </div>
        <DeepDiveView clientId={deepDiveClient.id} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="font-extrabold text-lg text-slate-800">Client Directory</div>
        <button onClick={() => setIsCreateModalOpen(true)} className="mgr-btn mgr-btn-purple">
          <Plus size={16} /> Create Client
        </button>
      </div>

      <div className="mgr-section-panel">
        <table className="mgr-data-table">
          <thead>
            <tr>
              <th>Client ID</th>
              <th>Name</th>
              <th>Active Campaigns</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Toggle Active</th>
            </tr>
          </thead>
          <tbody>
            {paginatedClients.map((client, index) => (
              <tr key={client.id} className="mgr-table-row-clickable">
                 <td onClick={() => setSelectedClient(client)} className="font-mono font-bold text-slate-500">
                  {(page - 1) * limit + index + 1}
                </td>
                <td onClick={() => setSelectedClient(client)} className="font-bold text-slate-900">{client.name}</td>
                <td onClick={() => setSelectedClient(client)}>
                  <span className="mgr-badge mgr-badge-purple">{client.activeCampaigns} Campaigns</span>
                </td>
                <td onClick={() => setSelectedClient(client)}>
                  <span className={`mgr-badge ${client.status === "Active" ? "mgr-badge-green" : "mgr-badge-amber"}`}>
                    {client.status}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
            <div className="flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeepDiveClient(client);
                      }}
                      className="mgr-btn mgr-btn-purple text-xs py-1"
                    >
                      <Eye size={12} /> Deep Dive
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(client.id, client.status);
                      }}
                      className={`mgr-btn ${client.status === "Active" ? "mgr-btn-red" : "mgr-btn-outline"} text-xs py-1`}
                    >
                      <Power size={12} /> {client.status === "Active" ? "Pause" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mgr-pagination">
          <span className="mgr-pagination-info">Showing Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="mgr-btn mgr-btn-outline">
              <ChevronLeft size={14} /> Prev
            </button>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="mgr-btn mgr-btn-outline">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create Client */}
      <ModalShell
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision New Client"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="mgr-btn mgr-btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-client-form"
              className="mgr-btn mgr-btn-purple"
            >
              Create Account
            </button>
          </>
        }
      >
        <form id="create-client-form" onSubmit={handleCreateClient}>
          <div className="lp-form-body">
            <div className="lp-form-group">
              <label className="lp-form-label">Client Organization Name</label>
              <input
                type="text"
                required
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="lp-form-input"
                placeholder="e.g. Acme Legal"
              />
            </div>
            <div className="lp-form-group">
              <label className="lp-form-label">Contact Email</label>
              <input
                type="email"
                required
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                className="lp-form-input"
                placeholder="contact@acme.com"
              />
            </div>
            <div className="lp-form-group">
              <label className="lp-form-label">Contact Person</label>
              <input
                type="text"
                required
                value={newContactPerson}
                onChange={(e) => setNewContactPerson(e.target.value)}
                className="lp-form-input"
                placeholder="e.g. Jane Doe"
              />
            </div>
            <div className="lp-form-group">
              <label className="lp-form-label">Temporary Password</label>
              <input
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="lp-form-input"
                placeholder="SecurePass123!"
              />
            </div>
          </div>
        </form>
      </ModalShell>

            {/* Modal: Client Workspace */}
      <ModalShell
        isOpen={!!selectedClient}
        onClose={() => { setSelectedClient(null); setUploadStatus(""); }}
        noHeader={true}
        maxWidth="560px"
        footer={
          <button
            onClick={() => { setSelectedClient(null); setUploadStatus(""); }}
            className="mgr-btn mgr-btn-outline"
          >
            Close
          </button>
        }
      >
        {selectedClient && (
          <>
            {/* Gradient Hero Strip */}
            <div style={{
              background: "linear-gradient(135deg, #0f766e 0%, #0284c7 55%, #6366f1 100%)",
              padding: "18px 24px",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Client initial avatar */}
                <div style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: "rgba(255,255,255,0.2)",
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 900, color: "white", flexShrink: 0,
                }}>
                  {selectedClient.name?.[0]?.toUpperCase() || "C"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: "white", lineHeight: 1.2 }}>
                      {selectedClient.name}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: selectedClient.status === "Active" ? "rgba(16,185,129,0.3)" : "rgba(251,191,36,0.3)",
                      border: `1px solid ${selectedClient.status === "Active" ? "rgba(16,185,129,0.5)" : "rgba(251,191,36,0.5)"}`,
                      color: selectedClient.status === "Active" ? "#6ee7b7" : "#fde68a",
                    }}>
                      {selectedClient.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 3, fontWeight: 500 }}>
                    {selectedClient.contactEmail}
                  </div>
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 800, color: "white",
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
                  padding: "4px 10px", borderRadius: 8, whiteSpace: "nowrap",
                }}>
                  Client Account
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Upload Card */}
              <div style={{
                background: "white", border: "2px dashed #c4b5fd",
                borderRadius: 14, padding: "20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ padding: 8, background: "#ede9fe", borderRadius: 10, display: "flex" }}>
                    <Upload size={18} color="#7c3aed" />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#4c1d95" }}>Ingest New Leads (CSV)</span>
                </div>

                <form onSubmit={handleCSVUpload} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="lp-form-group">
                    <label className="lp-form-label">List Audience Name</label>
                    <input
                      type="text"
                      required
                      value={uploadListName}
                      onChange={(e) => setUploadListName(e.target.value)}
                      className="lp-form-input"
                      placeholder="e.g. Q4 Executive Outreach"
                    />
                  </div>

                  <div className="lp-form-group">
                    <label className="lp-form-label">CSV Data File</label>
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 8 }}>
                      <input
                        type="file"
                        accept=".csv"
                        required
                        onChange={(e) => setUploadFile(e.target.files[0])}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!uploadFile || !uploadListName}
                    className="mgr-btn mgr-btn-purple"
                    style={{ justifyContent: "center", width: "100%", padding: "10px 0", marginTop: 4, boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}
                  >
                    Initiate Secure Import
                  </button>
                </form>

                {uploadStatus && (
                  <div style={{
                    marginTop: 14, padding: "10px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: uploadStatus.startsWith("Error") ? "#fef2f2" : "#f0fdf4",
                    color: uploadStatus.startsWith("Error") ? "#dc2626" : "#16a34a",
                    border: `1px solid ${uploadStatus.startsWith("Error") ? "#fecaca" : "#bbf7d0"}`,
                  }}>
                    {uploadStatus}
                  </div>
                )}
              </div>

                   {/* Lead Lists & Import Jobs */}
              <div style={{
                background: "white", border: "1px solid #e2e8f0",
                borderRadius: 14, padding: "20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ padding: 8, background: "#f1f5f9", borderRadius: 10, display: "flex" }}>
                    <Upload size={18} color="#475569" />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>Lead Lists & Import History</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 350, overflowY: "auto" }}>
                  {leadLists.map(list => {
                    const job = list.importJobs?.[0];
                    const seqNames = list.sequences?.map(s => s.name).join(", ") || "No sequences attached";
                    return (
                      <div key={list.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px", border: "1px solid #e2e8f0", borderRadius: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{list.name}</div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontWeight: 600 }}>Sequences: {seqNames}</div>
                          </div>
                          {job && (
                            <div style={{ textAlign: "right" }}>
                              <span style={{ 
                                fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 12, 
                                background: job.status === "Completed" ? "#dcfce7" : (job.status === "Failed" ? "#fef2f2" : "#fef9c3"),
                                color: job.status === "Completed" ? "#166534" : (job.status === "Failed" ? "#991b1b" : "#854d0e")
                              }}>
                                {job.status.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {job && (
                          <div style={{ marginTop: 8, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11, color: "#475569", fontWeight: 600 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span>Total Leads: {job.totalRows || 0}</span>
                              <span>{Math.round(job.progressPercentage || 0)}% Complete</span>
                            </div>
                            <div style={{ width: "100%", height: 6, background: "#e2e8f0", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                              <div style={{ width: `${job.progressPercentage || 0}%`, height: "100%", background: job.status === "Failed" ? "#ef4444" : "#10b981", transition: "width 0.3s" }} />
                            </div>
                            <div style={{ display: "flex", gap: 16 }}>
                              <span style={{ color: "#166534" }}>{job.successfulRows || 0} Processed</span>
                              {job.failedRows > 0 && <span style={{ color: "#991b1b" }}>{job.failedRows} Failed</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {leadLists.length === 0 && (
                    <div style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                      No lead lists imported yet. Use the uploader above to create one!
                    </div>
                  )}
                </div>
              </div>

              {/* Client Contacts */}
              <div style={{
                background: "white", border: "1px solid #e2e8f0",
                borderRadius: 14, padding: "20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ padding: 8, background: "#f1f5f9", borderRadius: 10, display: "flex" }}>
                      <Eye size={18} color="#475569" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>Client Access Accounts</span>
                  </div>
                  <button onClick={() => setShowAddContact(!showAddContact)} className="mgr-btn mgr-btn-outline text-xs">
                    <Plus size={14} /> Add User
                  </button>
                </div>

                {showAddContact && (
                  <form onSubmit={handleAddContact} style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20, padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <div className="lp-form-group">
                      <label className="lp-form-label">Full Name</label>
                      <input type="text" required value={newContactName} onChange={e => setNewContactName(e.target.value)} className="lp-form-input" />
                    </div>
                    <div className="lp-form-group">
                      <label className="lp-form-label">Email Address</label>
                      <input type="email" required value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)} className="lp-form-input" />
                    </div>
                    <div className="lp-form-group">
                      <label className="lp-form-label">Temporary Password</label>
                      <input type="text" required value={newContactPassword} onChange={e => setNewContactPassword(e.target.value)} className="lp-form-input" />
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      <button type="submit" className="mgr-btn mgr-btn-purple flex-1 justify-center">Create User</button>
                      <button type="button" onClick={() => setShowAddContact(false)} className="mgr-btn mgr-btn-outline">Cancel</button>
                    </div>
                  </form>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                  {clientUsers.map(u => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 10, opacity: u.status === "Active" ? 1 : 0.5 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{u.email}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: u.status === "Active" ? "#dcfce7" : "#f1f5f9", color: u.status === "Active" ? "#166534" : "#475569" }}>{u.status}</span>
                        {u.status === "Active" && (
                          <button onClick={() => handleRemoveContact(u.id)} className="text-red-500 hover:text-red-700" title="Revoke Access">
                            <Power size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {clientUsers.length === 0 && (
                    <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: 12, fontWeight: 600 }}>No users found</div>
                  )}
                </div>
              </div>


            </div>
          </>
        )}
      </ModalShell>
    </div>
  );
}