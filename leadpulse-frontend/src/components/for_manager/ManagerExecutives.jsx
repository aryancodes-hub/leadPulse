"use client";
import { useEffect, useState } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Power } from "lucide-react";
import api from "@/api/api";

export default function ManagerExecutives() {
  const [executives, setExecutives] = useState([
    { id: "EX-201", name: "Jordan Ellis", assignedCampaign: "Fall Outreach Blitz", email: "jordan@team.com", status: "Active" },
    { id: "EX-202", name: "Sam Patel", assignedCampaign: "Q4 Renewal Drip", email: "sam@team.com", status: "Active" },
    { id: "EX-203", name: "Alex Torres", assignedCampaign: "Unassigned", email: "alex@team.com", status: "Inactive" },
  ]);

  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedExec, setSelectedExec] = useState(null);
  const [execName, setExecName] = useState("");
  const [execEmail, setExecEmail] = useState("");
  const limit = 10;
  const totalPages = Math.ceil(executives.length / limit) || 1;
  const paginatedExecs = executives.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    // Endpoint #7: GET /api/v1/users
    api.get(`/users?page=${page}&limit=${limit}`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (data?.users) setExecutives(data.users);
      })
      .catch((err) => console.log("Using callers mock list", err));
  }, [page]);

  // Endpoint #8: POST /api/v1/users
  const handleCreateExec = async (e) => {
    e.preventDefault();
    const payload = { name: execName, email: execEmail, role: "Executive" };
    try {
      const res = await api.post("/users", payload);
      const created = res.data?.data ?? res.data;
      setExecutives([{
        id: created?.id || `EX-${Math.floor(200 + Math.random() * 800)}`,
        name: execName,
        assignedCampaign: "Unassigned",
        email: execEmail,
        status: "Active",
      }, ...executives]);
    } catch {
      setExecutives([{ id: `EX-${Date.now()}`, name: execName, assignedCampaign: "Unassigned", email: execEmail, status: "Active" }, ...executives]);
    }
    setExecName("");
    setExecEmail("");
    setIsCreateModalOpen(false);
  };

  // Endpoint #10: PATCH /api/v1/users/:id
  const handleToggleUserActive = async (execId, currentStatus) => {
    const nextStatus = currentStatus === "Active" ? "Inactive" : "Active";
    try {
      await api.patch(`/users/${execId}`, { status: nextStatus });
    } catch (e) { /* optimistic fallback */ }

    setExecutives((prev) =>
      prev.map((ex) => (ex.id === execId ? { ...ex, status: nextStatus } : ex))
    );
    if (selectedExec?.id === execId) {
      setSelectedExec((prev) => ({ ...prev, status: nextStatus }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="font-extrabold text-lg text-slate-800">Executive Calling Roster</div>
        <button onClick={() => setIsCreateModalOpen(true)} className="mgr-btn mgr-btn-purple">
          <Plus size={16} /> Create Executive
        </button>
      </div>

      <div className="mgr-section-panel">
        <table className="mgr-data-table">
          <thead>
            <tr>
              <th>Executive ID</th>
              <th>Name</th>
              <th>Assigned Campaign (Constraint: 1:1)</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Toggle Active</th>
            </tr>
          </thead>
          <tbody>
            {paginatedExecs.map((exec) => (
              <tr key={exec.id} className="mgr-table-row-clickable">
                <td onClick={() => setSelectedExec(exec)} className="font-mono font-bold text-slate-500">{exec.id}</td>
                <td onClick={() => setSelectedExec(exec)} className="font-bold text-slate-900">{exec.name}</td>
                <td onClick={() => setSelectedExec(exec)}>
                  <span className={`mgr-badge ${exec.assignedCampaign === "Unassigned" ? "mgr-badge-amber" : "mgr-badge-purple"}`}>
                    {exec.assignedCampaign}
                  </span>
                </td>
                <td onClick={() => setSelectedExec(exec)}>
                  <span className={`mgr-badge ${exec.status === "Active" ? "mgr-badge-green" : "mgr-badge-amber"}`}>
                    {exec.status}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleUserActive(exec.id, exec.status);
                    }}
                    className={`mgr-btn ${exec.status === "Active" ? "mgr-btn-red" : "mgr-btn-outline"} text-xs py-1`}
                  >
                    <Power size={12} /> {exec.status === "Active" ? "Deactivate" : "Activate"}
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

      {/* Modal: Create Executive */}
      {isCreateModalOpen && (
        <div className="mgr-modal-overlay">
          <div className="mgr-modal-content">
            <div className="mgr-modal-header">
              <span className="mgr-modal-title">Create Executive Account</span>
              <button onClick={() => setIsCreateModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateExec}>
              <div className="mgr-modal-body">
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Full Name</label>
                  <input type="text" required value={execName} onChange={(e) => setExecName(e.target.value)} className="mgr-form-input" placeholder="e.g. Jordan Ellis" />
                </div>
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Email Address</label>
                  <input type="email" required value={execEmail} onChange={(e) => setExecEmail(e.target.value)} className="mgr-form-input" placeholder="jordan@team.com" />
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

      {/* Modal: Profile Details */}
      {selectedExec && (
        <div className="mgr-modal-overlay">
          <div className="mgr-modal-content">
            <div className="mgr-modal-header">
              <span className="mgr-modal-title">Executive Profile — {selectedExec.id}</span>
              <button onClick={() => setSelectedExec(null)}><X size={18} /></button>
            </div>
            <div className="mgr-modal-body">
              <div>
                <span className="text-xs text-slate-400 font-bold block uppercase">Agent Name</span>
                <span className="text-base font-bold text-slate-900">{selectedExec.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block uppercase">Account Email</span>
                <span className="text-sm font-semibold text-slate-700">{selectedExec.email}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block uppercase">Assigned Campaign</span>
                <span className="text-sm font-bold text-purple-600">{selectedExec.assignedCampaign}</span>
              </div>
            </div>
            <div className="mgr-modal-footer">
              <button onClick={() => setSelectedExec(null)} className="mgr-btn mgr-btn-purple">Close Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}