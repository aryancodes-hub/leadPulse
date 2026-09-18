"use client";
import { useEffect, useState } from "react";
import { Plus, UserPlus, UserMinus, X, ChevronLeft, ChevronRight, CheckCircle, Pause, Play, Trash2, Zap } from "lucide-react";
import api from "@/api/api";

const INITIAL_CLIENTS = [{ id: "CL-101", name: "Northwind Retail" }, { id: "CL-102", name: "Brightline Health" }];
const INITIAL_EXECS = [{ id: "EX-201", name: "Jordan Ellis" }, { id: "EX-202", name: "Sam Patel" }, { id: "EX-203", name: "Alex Torres" }];

export default function ManagerCampaigns() {
  const [campaigns, setCampaigns] = useState([
    { id: "CMP-301", clientName: "Northwind Retail", type: "Cold Call Blitz", status: "Draft", executives: [{ id: "EX-201", name: "Jordan Ellis" }] },
    { id: "CMP-302", clientName: "Brightline Health", type: "Email Sequence Drip", status: "Active", executives: [{ id: "EX-202", name: "Sam Patel" }] },
  ]);

  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [assignExecModalCmp, setAssignExecModalCmp] = useState(null);
  const [removeExecModalCmp, setRemoveExecModalCmp] = useState(null);
  const [newCmpClient, setNewCmpClient] = useState(INITIAL_CLIENTS[0].name);
  const [newCmpType, setNewCmpType] = useState("Cold Call Blitz");
  const [newCmpExec, setNewCmpExec] = useState(INITIAL_EXECS[0].id);
  const [selectedExecToAssign, setSelectedExecToAssign] = useState(INITIAL_EXECS[0].id);
  const [selectedExecToRemove, setSelectedExecToRemove] = useState("");
  const limit = 10;
  const totalPages = Math.ceil(campaigns.length / limit) || 1;
  const paginatedCampaigns = campaigns.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    // Endpoint #25: GET /api/v1/campaigns
    api.get(`/campaigns?page=${page}&limit=${limit}`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (data?.campaigns) setCampaigns(data.campaigns);
      })
      .catch((err) => console.log("Using campaign mock list", err));
  }, [page]);

  // Endpoint #26: POST /api/v1/campaigns
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    const execObj = INITIAL_EXECS.find((e) => e.id === newCmpExec);
    const payload = { clientName: newCmpClient, type: newCmpType, executiveIds: [newCmpExec] };

    try {
      const res = await api.post("/campaigns", payload);
      const created = res.data?.data ?? res.data;
      setCampaigns([{
        id: created?.id || `CMP-${Math.floor(300 + Math.random() * 700)}`,
        clientName: newCmpClient,
        type: newCmpType,
        status: "Draft",
        executives: [execObj],
      }, ...campaigns]);
    } catch {
      setCampaigns([{ id: `CMP-${Date.now()}`, clientName: newCmpClient, type: newCmpType, status: "Draft", executives: [execObj] }, ...campaigns]);
    }
    setIsCreateModalOpen(false);
  };

  // Endpoint #32: POST /api/v1/campaigns/:id/approve
  const handleApproveCampaign = async (cmpId) => {
    try {
      await api.post(`/campaigns/${cmpId}/approve`);
    } catch (e) { /* fallback */ }
    setCampaigns((prev) => prev.map((c) => (c.id === cmpId ? { ...c, status: "Active" } : c)));
  };

  // Endpoint #31: PATCH /api/v1/campaigns/:id/status
  const handleToggleStatus = async (cmpId, currentStatus) => {
    const nextStatus = currentStatus === "Active" ? "Paused" : "Active";
    try {
      await api.patch(`/campaigns/${cmpId}/status`, { status: nextStatus });
    } catch (e) { /* fallback */ }
    setCampaigns((prev) => prev.map((c) => (c.id === cmpId ? { ...c, status: nextStatus } : c)));
  };

  // Endpoint #30: DELETE /api/v1/campaigns/:id
  const handleDeleteCampaign = async (cmpId) => {
    if (!confirm("Are you sure you want to delete this draft campaign?")) return;
    try {
      await api.delete(`/campaigns/${cmpId}`);
    } catch (e) { /* fallback */ }
    setCampaigns((prev) => prev.filter((c) => c.id !== cmpId));
  };

  // Endpoint #36: POST /api/v1/campaigns/:id/assign-leads
  const handleRoundRobinAssign = async (cmpId) => {
    try {
      await api.post(`/campaigns/${cmpId}/assign-leads`, { strategy: "round-robin" });
      alert(`Round-robin lead assignment triggered for ${cmpId}`);
    } catch {
      alert(`Simulated round-robin lead distribution for ${cmpId}`);
    }
  };

  // Endpoint #34: POST /api/v1/campaigns/:id/executives
  const handleAddExecToCampaign = async (e) => {
    e.preventDefault();
    const execObj = INITIAL_EXECS.find((ex) => ex.id === selectedExecToAssign);
    try {
      await api.post(`/campaigns/${assignExecModalCmp.id}/executives`, {
        executiveId: selectedExecToAssign,
      });
    } catch (e) { /* fallback */ }

    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === assignExecModalCmp.id) {
          if (c.executives.some((ex) => ex.id === execObj.id)) return c;
          return { ...c, executives: [...c.executives, execObj] };
        }
        return c;
      })
    );
    setAssignExecModalCmp(null);
  };

  // Endpoint #35: DELETE /api/v1/campaigns/:id/executives/:execId
  const handleRemoveExecFromCampaign = async (e) => {
    e.preventDefault();
    try {
      await api.delete(`/campaigns/${removeExecModalCmp.id}/executives/${selectedExecToRemove}`);
    } catch (e) { /* fallback */ }

    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === removeExecModalCmp.id) {
          return { ...c, executives: c.executives.filter((ex) => ex.id !== selectedExecToRemove) };
        }
        return c;
      })
    );
    setRemoveExecModalCmp(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="font-extrabold text-lg text-slate-800">Campaign Logistics & Strategy</div>
        <button onClick={() => setIsCreateModalOpen(true)} className="mgr-btn mgr-btn-purple">
          <Plus size={16} /> Create Campaign
        </button>
      </div>

      <div className="mgr-section-panel">
        <table className="mgr-data-table">
          <thead>
            <tr>
              <th>Campaign ID</th>
              <th>Client</th>
              <th>Type / Status</th>
              <th>Assigned Executives</th>
              <th style={{ textAlign: "right" }}>Manager Workflow Controls</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCampaigns.map((cmp) => (
              <tr key={cmp.id}>
                <td className="font-mono font-bold text-slate-500">{cmp.id}</td>
                <td className="font-bold text-slate-900">{cmp.clientName}</td>
                <td>
                  <div className="font-semibold text-slate-800">{cmp.type}</div>
                  <span className={`mgr-badge ${cmp.status === "Active" ? "mgr-badge-green" : cmp.status === "Draft" ? "mgr-badge-amber" : "mgr-badge-purple"}`}>
                    {cmp.status}
                  </span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {cmp.executives.map((ex) => (
                      <span key={ex.id} className="mgr-badge mgr-badge-purple">{ex.name}</span>
                    ))}
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div className="flex justify-end items-center gap-1.5 flex-wrap">
                    {/* Approve Draft (Endpoint #32) */}
                    {cmp.status === "Draft" && (
                      <button onClick={() => handleApproveCampaign(cmp.id)} className="mgr-btn mgr-btn-purple text-xs py-1">
                        <CheckCircle size={12} /> Approve
                      </button>
                    )}

                    {/* Pause / Resume Execution (Endpoint #31) */}
                    {cmp.status !== "Draft" && (
                      <button onClick={() => handleToggleStatus(cmp.id, cmp.status)} className="mgr-btn mgr-btn-outline text-xs py-1">
                        {cmp.status === "Active" ? <Pause size={12} /> : <Play size={12} />}
                        {cmp.status === "Active" ? "Pause" : "Resume"}
                      </button>
                    )}

                    {/* Round-Robin Lead Distribution (Endpoint #36) */}
                    <button onClick={() => handleRoundRobinAssign(cmp.id)} className="mgr-btn mgr-btn-outline text-xs py-1" title="Round Robin Distribute Leads">
                      <Zap size={12} /> Leads
                    </button>

                    {/* Add Exec (Endpoint #34) */}
                    <button onClick={() => setAssignExecModalCmp(cmp)} className="mgr-btn mgr-btn-outline text-xs py-1">
                      <UserPlus size={12} />
                    </button>

                    {/* Remove Exec (Endpoint #35) */}
                    <button
                      onClick={() => {
                        setRemoveExecModalCmp(cmp);
                        if (cmp.executives.length > 0) setSelectedExecToRemove(cmp.executives[0].id);
                      }}
                      className="mgr-btn mgr-btn-red text-xs py-1"
                    >
                      <UserMinus size={12} />
                    </button>

                    {/* Delete Draft (Endpoint #30) */}
                    {cmp.status === "Draft" && (
                      <button onClick={() => handleDeleteCampaign(cmp.id)} className="mgr-btn mgr-btn-red text-xs py-1">
                        <Trash2 size={12} />
                      </button>
                    )}
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

      {/* Modal: Create Campaign */}
      {isCreateModalOpen && (
        <div className="mgr-modal-overlay">
          <div className="mgr-modal-content">
            <div className="mgr-modal-header">
              <span className="mgr-modal-title">Create Campaign Blueprint</span>
              <button onClick={() => setIsCreateModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateCampaign}>
              <div className="mgr-modal-body">
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Client Organization</label>
                  <select value={newCmpClient} onChange={(e) => setNewCmpClient(e.target.value)} className="mgr-form-select">
                    {INITIAL_CLIENTS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Campaign Strategy Type</label>
                  <select value={newCmpType} onChange={(e) => setNewCmpType(e.target.value)} className="mgr-form-select">
                    <option value="Cold Call Blitz">Cold Call Blitz</option>
                    <option value="Email Sequence Drip">Email Sequence Drip</option>
                  </select>
                </div>
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Assign Primary Executive (Mandatory)</label>
                  <select value={newCmpExec} onChange={(e) => setNewCmpExec(e.target.value)} className="mgr-form-select" required>
                    {INITIAL_EXECS.map((ex) => <option key={ex.id} value={ex.id}>{ex.name} ({ex.id})</option>)}
                  </select>
                </div>
              </div>
              <div className="mgr-modal-footer">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="mgr-btn mgr-btn-outline">Cancel</button>
                <button type="submit" className="mgr-btn mgr-btn-purple">Create Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Exec */}
      {assignExecModalCmp && (
        <div className="mgr-modal-overlay">
          <div className="mgr-modal-content">
            <div className="mgr-modal-header">
              <span className="mgr-modal-title">Add Executive to {assignExecModalCmp.id}</span>
              <button onClick={() => setAssignExecModalCmp(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddExecToCampaign}>
              <div className="mgr-modal-body">
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Select Fresh Executive</label>
                  <select value={selectedExecToAssign} onChange={(e) => setSelectedExecToAssign(e.target.value)} className="mgr-form-select">
                    {INITIAL_EXECS.map((ex) => <option key={ex.id} value={ex.id}>{ex.name} ({ex.id})</option>)}
                  </select>
                </div>
              </div>
              <div className="mgr-modal-footer">
                <button type="button" onClick={() => setAssignExecModalCmp(null)} className="mgr-btn mgr-btn-outline">Cancel</button>
                <button type="submit" className="mgr-btn mgr-btn-purple">Grant Access</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Remove Exec */}
      {removeExecModalCmp && (
        <div className="mgr-modal-overlay">
          <div className="mgr-modal-content">
            <div className="mgr-modal-header">
              <span className="mgr-modal-title">Remove Executive from {removeExecModalCmp.id}</span>
              <button onClick={() => setRemoveExecModalCmp(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleRemoveExecFromCampaign}>
              <div className="mgr-modal-body">
                {removeExecModalCmp.executives.length === 0 ? (
                  <div className="text-xs text-slate-500 font-semibold">No active assigned executives.</div>
                ) : (
                  <div className="mgr-form-group">
                    <label className="mgr-form-label">Select Executive to Revoke</label>
                    <select value={selectedExecToRemove} onChange={(e) => setSelectedExecToRemove(e.target.value)} className="mgr-form-select">
                      {removeExecModalCmp.executives.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="mgr-modal-footer">
                <button type="button" onClick={() => setRemoveExecModalCmp(null)} className="mgr-btn mgr-btn-outline">Cancel</button>
                {removeExecModalCmp.executives.length > 0 && <button type="submit" className="mgr-btn mgr-btn-red">Revoke Access</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}