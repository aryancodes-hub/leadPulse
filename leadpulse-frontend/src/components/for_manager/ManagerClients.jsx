"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Upload, Power } from "lucide-react";
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
      {isCreateModalOpen && (
        <div className="mgr-modal-overlay">
          <div className="mgr-modal-content">
            <div className="mgr-modal-header">
              <span className="mgr-modal-title">Provision New Client</span>
              <button onClick={() => setIsCreateModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateClient}>
              <div className="mgr-modal-body">
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Client Organization Name</label>
                  <input type="text" required value={newClientName} onChange={(e) => setNewClientName(e.target.value)} className="mgr-form-input" placeholder="e.g. Acme Legal" />
                </div>
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Contact Email</label>
                  <input type="email" required value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} className="mgr-form-input" placeholder="contact@acme.com" />
                </div>
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Contact Person</label>
                  <input type="text" required value={newContactPerson} onChange={(e) => setNewContactPerson(e.target.value)} className="mgr-form-input" placeholder="e.g. Jane Doe" />
                </div>
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Temporary Password</label>
                  <input type="text" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mgr-form-input" placeholder="SecurePass123!" />
                </div>
              </div>
              <div className="mgr-modal-footer">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="mgr-btn mgr-btn-outline">Cancel</button>
                <button type="submit" className="mgr-btn mgr-btn-purple">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Details & Lead Ingestion */}
            {/* Modal: Details & Lead Ingestion */}
      {selectedClient && (
        <div className="mgr-modal-overlay">
          <div className="mgr-modal-content" style={{ maxWidth: '550px' }}>
            <div className="mgr-modal-header bg-slate-50 rounded-t-lg border-b border-slate-100">
              <span className="mgr-modal-title text-slate-800">Client Workspace</span>
              <button onClick={() => { setSelectedClient(null); setUploadStatus(""); }} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <div className="mgr-modal-body flex flex-col gap-6 p-6">
              
              {/* Profile Card */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                <div>
                  <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider mb-1">Organization</span>
                  <div className="text-xl font-black text-slate-900">{selectedClient.name}</div>
                  <div className="text-sm font-medium text-slate-500 mt-1">{selectedClient.contactEmail}</div>
                </div>
                <div className="flex flex-col items-start sm:items-end justify-center">
                  <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider mb-2">Account Status</span>
                  <span className={`mgr-badge ${selectedClient.status === "Active" ? "mgr-badge-green" : "mgr-badge-amber"} px-3 py-1 text-sm shadow-sm`}>
                    {selectedClient.status}
                  </span>
                </div>
              </div>

              {/* Upload Dropzone Card */}
              <div className="bg-white border-2 border-dashed border-purple-200 rounded-xl p-6 hover:border-purple-400 transition-colors duration-200">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                    <Upload size={20} />
                  </div>
                  <span className="font-extrabold text-lg text-purple-900">Ingest New Leads (CSV)</span>
                </div>
                
                <form onSubmit={handleCSVUpload} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">List Audience Name</label>
                    <input 
                      type="text" 
                      required 
                      value={uploadListName}
                      onChange={(e) => setUploadListName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white transition-all" 
                      placeholder="e.g. Q4 Executive Outreach"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">CSV Data File</label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-2 overflow-hidden">
                      <input
                        type="file"
                        accept=".csv"
                        required
                        onChange={(e) => setUploadFile(e.target.files[0])}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={!uploadFile || !uploadListName} className="mgr-btn mgr-btn-purple w-full justify-center py-2.5 mt-2 shadow-md">
                    Initiate Secure Import
                  </button>
                </form>

                {/* Status Indicator */}
                {uploadStatus && (
                  <div className={`mt-5 p-3 rounded-lg text-sm font-bold flex items-center justify-center ${uploadStatus.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                    {uploadStatus}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}