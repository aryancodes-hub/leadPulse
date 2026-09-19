"use client";
import { useEffect, useState } from "react";
import { Plus, UserPlus, UserMinus, X, ChevronLeft, ChevronRight, CheckCircle, Pause, Play, Trash2, Zap } from "lucide-react";
import api from "@/api/api";

export default function ManagerCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  
  // Dynamic Data States
  const [clients, setClients] = useState([]);
  const [execs, setExecs] = useState([]);
  const [leadLists, setLeadLists] = useState([]);
  const [sequences, setSequences] = useState([]);

  // Pagination & Modals
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateSequenceModalOpen, setIsCreateSequenceModalOpen] = useState(false);
  
  // Assignment Modals
  const [assignExecModalCmp, setAssignExecModalCmp] = useState(null);
  const [removeExecModalCmp, setRemoveExecModalCmp] = useState(null);
  const [selectedExecToAssign, setSelectedExecToAssign] = useState("");
  const [selectedExecToRemove, setSelectedExecToRemove] = useState("");

  // Campaign Creation Form State
  const [newCmpName, setNewCmpName] = useState("");
  const [newCmpClient, setNewCmpClient] = useState("");
  const [newCmpType, setNewCmpType] = useState("Cold Call Blitz");
  const [newCmpLeadList, setNewCmpLeadList] = useState("");
  const [newCmpSequence, setNewCmpSequence] = useState("");
    const [execSearch, setExecSearch] = useState("");
  const [selectedExecs, setSelectedExecs] = useState([]); // Array to handle multiple
  
  // Sequence Creation State
  const [newSequenceName, setNewSequenceName] = useState("");

  const limit = 10;
  const totalPages = Math.ceil(campaigns.length / limit) || 1;
  const paginatedCampaigns = campaigns.slice((page - 1) * limit, page * limit);

  const [isSelectExecModalOpen, setIsSelectExecModalOpen] = useState(false);
  const [execPage, setExecPage] = useState(1);
  const execLimit = 5;

  // 1. Initial Load: Fetch Campaigns, Clients, and Executives
  useEffect(() => {
    api.get(`/campaigns?page=${page}&limit=${limit}`)
      .then((res) => setCampaigns(res.data?.data?.campaigns || []));
      
    api.get("/clients")
      .then((res) => setClients(res.data?.data?.clients || []));
      
    api.get("/users?limit=100&unassigned=true")
      .then((res) => setExecs(res.data?.data?.users || []));
  }, [page]);

  // 2. Cascading Fetch: When Client is selected, fetch their Lead Lists and Sequences
  useEffect(() => {
    if (!newCmpClient) {
      setLeadLists([]);
      setSequences([]);
      return;
    }
    api.get(`/lead-lists?clientId=${newCmpClient}`).then(res => setLeadLists(res.data?.data || []));
    api.get(`/sequences?clientId=${newCmpClient}`).then(res => setSequences(res.data?.data || []));
  }, [newCmpClient]);

  // Handle Nested Sequence Creation
  const handleCreateSequence = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/sequences", {
        clientId: newCmpClient,
        leadListId: newCmpLeadList,
        name: newSequenceName
      });
      const newSeq = res.data?.data ?? res.data;
      
      setSequences([newSeq, ...sequences]); // Add to dropdown list
      setNewCmpSequence(newSeq.id); // Auto-select it
      setIsCreateSequenceModalOpen(false);
      setNewSequenceName("");
    } catch (error) {
      alert("Failed to create Sequence. Ensure Client and Lead List are selected.");
    }
  };

  const filteredExecs = execs.filter(ex => 
    (ex.name || ex.fullName)?.toLowerCase().includes(execSearch.toLowerCase())
  );
  const totalExecPages = Math.ceil(filteredExecs.length / execLimit) || 1;
  const paginatedFilteredExecs = filteredExecs.slice((execPage - 1) *         execLimit, execPage * execLimit);
  

  const toggleExec = (execId) => {
    if (newCmpType === "Email Sequence Drip") {
      setSelectedExecs([execId]); // Enforce Max 1
    } else {
      // Enforce Multiple (Toggle on/off)
      setSelectedExecs(prev => prev.includes(execId) ? prev.filter(id => id !== execId) : [...prev, execId]);
    }
  };
  // Handle Orchestrated Campaign Creation
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (newCmpSequence === "CREATE_NEW" || !newCmpSequence) {
      return alert("Please select a valid sequence.");
    }

    try {
      // Step 1: Create the Campaign
      const cmpRes = await api.post("/campaigns", { 
        name: newCmpName,
        type: newCmpType === "Cold Call Blitz" ? "call" : "email", 
        clientId: newCmpClient,
        leadListId: newCmpLeadList,
        sequenceId: newCmpSequence
      });
      const createdCmp = cmpRes.data?.data ?? cmpRes.data;

      // Step 2: Auto-chain Executive Assignments (Handles Multiple)
      if (selectedExecs.length > 0) {
        await Promise.all(selectedExecs.map(execId => 
          api.post(`/campaigns/${createdCmp.id}/executives`, { executiveId: execId })
        ));
      }

      // Step 3: Refresh the Campaign list to get fully joined data
      const refreshRes = await api.get(`/campaigns?page=${page}&limit=${limit}`);
      setCampaigns(refreshRes.data?.data?.campaigns || []);
      
      // Reset Form
      setIsCreateModalOpen(false);
      setNewCmpName("");
      setNewCmpClient("");
      setNewCmpLeadList("");
      setNewCmpSequence("");
      setSelectedExecs([]);
    } catch (error) {
      alert("Failed to create campaign. Check console.");
      console.error(error);
    }
  };

  // Endpoint #32: POST /api/v1/campaigns/:id/approve
  const handleApproveCampaign = async (cmpId) => {
    try {
      await api.post(`/campaigns/${cmpId}/approve`);
      setCampaigns((prev) => prev.map((c) => (c.id === cmpId ? { ...c, status: "Active" } : c)));
    } catch (e) { alert("Approval failed"); }
  };

  // Endpoint #31: PATCH /api/v1/campaigns/:id/status
  const handleToggleStatus = async (cmpId, currentStatus) => {
    const nextStatus = currentStatus === "Active" ? "Paused" : "Active";
    try {
      await api.patch(`/campaigns/${cmpId}/status`, { status: nextStatus.toLowerCase() });
      setCampaigns((prev) => prev.map((c) => (c.id === cmpId ? { ...c, status: nextStatus } : c)));
    } catch (e) { alert("Status toggle failed"); }
  };

  // Endpoint #30: DELETE /api/v1/campaigns/:id
  const handleDeleteCampaign = async (cmpId) => {
    if (!confirm("Are you sure you want to delete this draft campaign?")) return;
    try {
      await api.delete(`/campaigns/${cmpId}`);
      setCampaigns((prev) => prev.filter((c) => c.id !== cmpId));
    } catch (e) { alert("Delete failed"); }
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
    try {
      await api.post(`/campaigns/${assignExecModalCmp.id}/executives`, { executiveId: selectedExecToAssign });
      const refreshRes = await api.get(`/campaigns?page=${page}&limit=${limit}`);
      setCampaigns(refreshRes.data?.data?.campaigns || []);
      setAssignExecModalCmp(null);
    } catch (e) { alert("Failed to add executive"); }
  };

  // Endpoint #35: DELETE /api/v1/campaigns/:id/executives/:execId
  const handleRemoveExecFromCampaign = async (e) => {
    e.preventDefault();
    try {
      await api.delete(`/campaigns/${removeExecModalCmp.id}/executives/${selectedExecToRemove}`);
      const refreshRes = await api.get(`/campaigns?page=${page}&limit=${limit}`);
      setCampaigns(refreshRes.data?.data?.campaigns || []);
      setRemoveExecModalCmp(null);
    } catch (e) { alert("Failed to remove executive"); }
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
                <td className="font-mono text-xs font-bold text-slate-500">{cmp.id.substring(0, 8)}...</td>
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
                      <span key={ex.id} className="mgr-badge mgr-badge-purple">{ex.name || ex.fullName}</span>
                    ))}
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div className="flex justify-end items-center gap-1.5 flex-wrap">
                    {cmp.status === "Draft" && (
                      <button onClick={() => handleApproveCampaign(cmp.id)} className="mgr-btn mgr-btn-purple text-xs py-1"><CheckCircle size={12} /> Approve</button>
                    )}
                    {cmp.status !== "Draft" && (
                      <button onClick={() => handleToggleStatus(cmp.id, cmp.status)} className="mgr-btn mgr-btn-outline text-xs py-1">
                        {cmp.status === "Active" ? <Pause size={12} /> : <Play size={12} />}
                        {cmp.status === "Active" ? "Pause" : "Resume"}
                      </button>
                    )}
                    <button onClick={() => handleRoundRobinAssign(cmp.id)} className="mgr-btn mgr-btn-outline text-xs py-1" title="Distribute Leads"><Zap size={12} /> Leads</button>
                    <button onClick={() => {
                        setAssignExecModalCmp(cmp);
                        if(execs.length > 0) setSelectedExecToAssign(execs[0].id);
                      }} className="mgr-btn mgr-btn-outline text-xs py-1"><UserPlus size={12} /></button>
                    <button
                      onClick={() => {
                        setRemoveExecModalCmp(cmp);
                        if (cmp.executives.length > 0) setSelectedExecToRemove(cmp.executives[0].id);
                      }}
                      className="mgr-btn mgr-btn-red text-xs py-1"
                    >
                      <UserMinus size={12} />
                    </button>
                    {cmp.status === "Draft" && (
                      <button onClick={() => handleDeleteCampaign(cmp.id)} className="mgr-btn mgr-btn-red text-xs py-1"><Trash2 size={12} /></button>
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
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="mgr-btn mgr-btn-outline"><ChevronLeft size={14} /> Prev</button>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="mgr-btn mgr-btn-outline">Next <ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* Primary Modal: Create Campaign */}
      {isCreateModalOpen && (
        <div className="mgr-modal-overlay">
          <div className="mgr-modal-content" style={{ display: isCreateSequenceModalOpen || isSelectExecModalOpen ? 'none' : 'block' }}>
            <div className="mgr-modal-header">
              <span className="mgr-modal-title">Create Campaign Blueprint</span>
              <button onClick={() => setIsCreateModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateCampaign}>
              <div className="mgr-modal-body">
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Campaign Name</label>
                  <input type="text" required value={newCmpName} onChange={(e) => setNewCmpName(e.target.value)} className="mgr-form-input" placeholder="e.g. Q4 Outreach" />
                </div>
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Client Organization</label>
                  <select required value={newCmpClient} onChange={(e) => setNewCmpClient(e.target.value)} className="mgr-form-select">
                    <option value="">Select a Client...</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name || c.fullName}</option>)}
                  </select>
                </div>
                
                {/* Dynamically Populated via Client ID */}
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Lead List (Audience)</label>
                  <select required disabled={!newCmpClient} value={newCmpLeadList} onChange={(e) => setNewCmpLeadList(e.target.value)} className="mgr-form-select">
                    <option value="">{newCmpClient ? "Select a Lead List..." : "Select a Client first"}</option>
                    {leadLists.map((ll) => <option key={ll.id} value={ll.id}>{ll.name}</option>)}
                  </select>
                </div>
                
                {/* Nested Modal Trigger */}
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Campaign Sequence</label>
                  <select 
                    required 
                    disabled={!newCmpClient || !newCmpLeadList} 
                    value={newCmpSequence} 
                    onChange={(e) => {
                      if (e.target.value === "CREATE_NEW") setIsCreateSequenceModalOpen(true);
                      else setNewCmpSequence(e.target.value);
                    }} 
                    className="mgr-form-select"
                  >
                    <option value="">{newCmpClient && newCmpLeadList ? "Select a Sequence..." : "Select Client & Lead List first"}</option>
                    {sequences.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    {newCmpClient && newCmpLeadList && <option value="CREATE_NEW" className="font-bold text-purple-600">➕ Create New Sequence...</option>}
                  </select>
                </div>

                <div className="mgr-form-group">
                  <label className="mgr-form-label">Campaign Strategy Type</label>
                  <select value={newCmpType} onChange={(e) => setNewCmpType(e.target.value)} className="mgr-form-select">
                    <option value="Cold Call Blitz">Call</option>
                    <option value="Email Sequence Drip">Email</option>
                  </select>
                </div>
                <div className="mgr-form-group">
                  <label className="mgr-form-label">
                    Assign Executive(s) {newCmpType === "Email Sequence Drip" ? "(Max 1)" : "(Multiple Allowed)"}
                  </label>
                  
                  <button 
                    type="button"
                    onClick={() => setIsSelectExecModalOpen(true)}
                    className="mgr-btn mgr-btn-outline w-full justify-center"
                  >
                    <UserPlus size={16} className="mr-2" />
                    {selectedExecs.length > 0 
                      ? `Manage Selected (${selectedExecs.length})` 
                      : "Open Executive Selection..."}
                  </button>

                  {/* Display selected names as badges in the parent form */}
                  {selectedExecs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 p-2 border border-slate-100 rounded bg-slate-50">
                      {selectedExecs.map(id => {
                        const ex = execs.find(e => e.id === id);
                        return (
                          <span key={id} className="mgr-badge mgr-badge-purple flex items-center gap-1">
                            {ex?.name || ex?.fullName}
                            <button type="button" onClick={() => toggleExec(id)}><X size={12} /></button>
                          </span>
                        );
                      })}
                    </div>
                  )}
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

      {/* Nested Modal: Create Sequence */}
      {isCreateSequenceModalOpen && (
        <div className="mgr-modal-overlay">
          <div className="mgr-modal-content border-2 border-purple-500 shadow-xl">
            <div className="mgr-modal-header bg-purple-50 rounded-t-lg">
              <span className="mgr-modal-title text-purple-900">Create New Sequence</span>
              <button onClick={() => { setIsCreateSequenceModalOpen(false); setNewCmpSequence(""); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateSequence}>
              <div className="mgr-modal-body">
                <div className="text-xs text-slate-500 mb-2 italic">
                  Inheriting Client and Lead List from parent campaign setup...
                </div>
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Sequence Name</label>
                  <input type="text" required value={newSequenceName} onChange={(e) => setNewSequenceName(e.target.value)} className="mgr-form-input" placeholder="e.g. Q4 Aggressive Follow-up" />
                </div>
              </div>
              <div className="mgr-modal-footer">
                <button type="button" onClick={() => { setIsCreateSequenceModalOpen(false); setNewCmpSequence(""); }} className="mgr-btn mgr-btn-outline">Back</button>
                <button type="submit" className="mgr-btn mgr-btn-purple">Save Sequence</button>
              </div>
            </form>
          </div>
        </div>
      )}
            {/* Nested Modal: Select Executives Table */}
      {isSelectExecModalOpen && (
        <div className="mgr-modal-overlay">
          <div className="mgr-modal-content border-2 border-purple-500 shadow-xl" style={{ maxWidth: '650px' }}>
            <div className="mgr-modal-header bg-purple-50 rounded-t-lg">
              <span className="mgr-modal-title text-purple-900">
                Select {newCmpType === "Email Sequence Drip" ? "Executive" : "Executives"}
              </span>
              <button onClick={() => setIsSelectExecModalOpen(false)}><X size={18} /></button>
            </div>
            
            <div className="mgr-modal-body">
              <input 
                type="text" 
                placeholder="Search by executive name..." 
                value={execSearch} 
                onChange={(e) => { setExecSearch(e.target.value); setExecPage(1); }} 
                className="mgr-form-input mb-4" 
              />
              
              <table className="mgr-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Executive Name</th>
                    <th>Email Address</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFilteredExecs.length === 0 ? (
                    <tr><td colSpan="3" className="text-center text-slate-500 italic py-6">No available executives found.</td></tr>
                  ) : (
                    paginatedFilteredExecs.map((ex) => (
                      <tr key={ex.id} className="cursor-pointer hover:bg-slate-50" onClick={() => toggleExec(ex.id)}>
                        <td>
                          <input 
                            type={newCmpType === "Email Sequence Drip" ? "radio" : "checkbox"} 
                            checked={selectedExecs.includes(ex.id)}
                            onChange={() => toggleExec(ex.id)}
                            className="accent-purple-600 cursor-pointer"
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </td>
                        <td className="font-bold text-slate-800">{ex.name || ex.fullName}</td>
                        <td className="text-slate-600">{ex.email}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Table Pagination */}
              <div className="mgr-pagination mt-4 border-t pt-4 border-slate-100">
                <span className="mgr-pagination-info">Page {execPage} of {totalExecPages}</span>
                <div className="flex gap-2">
                  <button type="button" disabled={execPage === 1} onClick={() => setExecPage(p => p - 1)} className="mgr-btn mgr-btn-outline py-1 px-3 text-xs">
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button type="button" disabled={execPage === totalExecPages} onClick={() => setExecPage(p => p + 1)} className="mgr-btn mgr-btn-outline py-1 px-3 text-xs">
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mgr-modal-footer">
              <button type="button" onClick={() => setIsSelectExecModalOpen(false)} className="mgr-btn mgr-btn-purple">
                Done Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals for Executives Add/Remove remain practically the same but dynamically mapped */}
      {assignExecModalCmp && (
        <div className="mgr-modal-overlay">
          <div className="mgr-modal-content">
            <div className="mgr-modal-header">
              <span className="mgr-modal-title">Add Executive</span>
              <button onClick={() => setAssignExecModalCmp(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddExecToCampaign}>
              <div className="mgr-modal-body">
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Select Executive</label>
                  <select required value={selectedExecToAssign} onChange={(e) => setSelectedExecToAssign(e.target.value)} className="mgr-form-select">
                    <option value="">Choose...</option>
                    {execs.map((ex) => <option key={ex.id} value={ex.id}>{ex.name || ex.fullName}</option>)}
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

      {removeExecModalCmp && (
        <div className="mgr-modal-overlay">
          <div className="mgr-modal-content">
            <div className="mgr-modal-header">
              <span className="mgr-modal-title">Remove Executive</span>
              <button onClick={() => setRemoveExecModalCmp(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleRemoveExecFromCampaign}>
              <div className="mgr-modal-body">
                {removeExecModalCmp.executives.length === 0 ? (
                  <div className="text-xs text-slate-500 font-semibold">No active executives.</div>
                ) : (
                  <div className="mgr-form-group">
                    <label className="mgr-form-label">Select Executive</label>
                    <select value={selectedExecToRemove} onChange={(e) => setSelectedExecToRemove(e.target.value)} className="mgr-form-select">
                      {removeExecModalCmp.executives.map((ex) => <option key={ex.id} value={ex.id}>{ex.name || ex.fullName}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="mgr-modal-footer">
                <button type="button" onClick={() => setRemoveExecModalCmp(null)} className="mgr-btn mgr-btn-outline">Cancel</button>
                {removeExecModalCmp.executives.length > 0 && <button type="submit" className="mgr-btn mgr-btn-red">Revoke</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}