"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Upload, Power } from "lucide-react";
import ModalShell from "@/components/for_manager/modals/ModalShell";
import api from "@/api/api";

export default function ManagerClients() {
   const { user } = useAuth(); 
  const [clients, setClients] = useState([]);

  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
   const [newContactPerson, setNewContactPerson] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadListName, setUploadListName] = useState(""); // Add this line
  const [uploadStatus, setUploadStatus] = useState("");
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
    } catch (error) {
      console.error("Upload failed", error);
      const msg = error.response?.data?.error?.message || error.response?.data?.message || "Upload failed";
      setUploadStatus(`Error: ${msg}`);
    }
  };

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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(client.id, client.status);
                    }}
                    className={`mgr-btn ${client.status === "Active" ? "mgr-btn-red" : "mgr-btn-outline"} text-xs py-1`}
                  >
                    <Power size={12} /> {client.status === "Active" ? "Pause" : "Activate"}
                  </button>
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

            </div>
          </>
        )}
      </ModalShell>
    </div>
  );
}