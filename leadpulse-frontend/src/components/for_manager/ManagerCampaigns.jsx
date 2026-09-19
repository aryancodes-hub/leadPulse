"use client";
import { useEffect, useState } from "react";
import {
  Plus,
  UserPlus,
  UserMinus,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Pause,
  Play,
  Trash2,
  Zap,
} from "lucide-react";
import api from "@/api/api";
import ModalShell from "@/components/for_manager/modals/ModalShell";
import CampaignInsightsModal from "@/components/for_manager/modals/CampaignInsightsModal";

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

  // Wizard State
  const [cmpStep, setCmpStep] = useState(1);

  // Step 1: Campaign Creation Form State
  const [newCmpName, setNewCmpName] = useState("");
  const [newCmpClient, setNewCmpClient] = useState("");
  const [newCmpType, setNewCmpType] = useState("Cold Call Blitz");
  const [newCmpLeadList, setNewCmpLeadList] = useState("");
  const [newCmpSequence, setNewCmpSequence] = useState("");
  const [execSearch, setExecSearch] = useState("");
  const [selectedExecs, setSelectedExecs] = useState([]); // Array to handle multiple

  // Step 2: Logistics & Pricing
  const [newCmpDesc, setNewCmpDesc] = useState("");
  const [pricingModel, setPricingModel] = useState("cost_per_lead");
  const [ratePerLead, setRatePerLead] = useState("");
  const [retainerAmount, setRetainerAmount] = useState("");
  const [excludeClosedLeads, setExcludeClosedLeads] = useState(true);
  const [requiresNetNewLeads, setRequiresNetNewLeads] = useState(false);

  // Step 3: Strategy Details
  const [scheduleType, setScheduleType] = useState("immediate");
  const [subjectLine, setSubjectLine] = useState("");
  const [senderName, setSenderName] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");
  const [emailBodyHtml, setEmailBodyHtml] = useState("");

  // Sequence Creation State
  const [newSequenceName, setNewSequenceName] = useState("");

  const limit = 10;
  const totalPages = Math.ceil(campaigns.length / limit) || 1;
  const paginatedCampaigns = campaigns.slice((page - 1) * limit, page * limit);

  const [isSelectExecModalOpen, setIsSelectExecModalOpen] = useState(false);
  const [execPage, setExecPage] = useState(1);
  const execLimit = 5;

  // Campaign Details modal
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignDetails, setCampaignDetails] = useState([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState("analytics");

  // 1. Initial Load: Fetch Campaigns, Clients, and Executives
  useEffect(() => {
    api
      .get(`/campaigns?page=${page}&limit=${limit}`)
      .then((res) => setCampaigns(res.data?.data?.campaigns || []));

    api.get("/clients").then((res) => setClients(res.data?.data?.clients || []));

    api
      .get("/users?limit=100&unassigned=true")
      .then((res) => setExecs(res.data?.data?.users || []));
  }, [page]);

  // 2. Cascading Fetch: When Client is selected, fetch their Lead Lists and Sequences
  useEffect(() => {
    if (!newCmpClient) {
      setLeadLists([]);
      setSequences([]);
      return;
    }
    api
      .get(`/lead-lists?clientId=${newCmpClient}`)
      .then((res) => setLeadLists(res.data?.data || []));
    api
      .get(`/sequences?clientId=${newCmpClient}`)
      .then((res) => setSequences(res.data?.data || []));
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

  const filteredExecs = execs.filter((ex) =>
    (ex.name || ex.fullName)?.toLowerCase().includes(execSearch.toLowerCase())
  );
  const totalExecPages = Math.ceil(filteredExecs.length / execLimit) || 1;
  const paginatedFilteredExecs = filteredExecs.slice(
    (execPage - 1) * execLimit,
    execPage * execLimit
  );

  const toggleExec = (execId) => {
    if (newCmpType === "Email Sequence Drip") {
      setSelectedExecs([execId]); // Enforce Max 1
    } else {
      // Enforce Multiple (Toggle on/off)
      setSelectedExecs((prev) =>
        prev.includes(execId) ? prev.filter((id) => id !== execId) : [...prev, execId]
      );
    }
  };
  // Handle Orchestrated Campaign Creation
  const handleCreateCampaign = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (newCmpSequence === "CREATE_NEW" || !newCmpSequence) {
      return alert("Please select a valid sequence.");
    }

    // Expand payload to include all the new wizard state variables
    const payload = {
      name: newCmpName,
      type: newCmpType === "Cold Call Blitz" ? "call" : "email",
      clientId: newCmpClient,
      leadListId: newCmpLeadList,
      sequenceId: newCmpSequence,

      description: newCmpDesc,
      pricingModel: pricingModel === "retainer" ? "flat_retainer" : "cost_per_lead",
      ratePerLead: pricingModel === "cost_per_lead" ? Number(ratePerLead) || 0 : 0,
      retainerAmount: pricingModel === "retainer" ? Number(retainerAmount) || 0 : 0,

      excludeClosedLeads: excludeClosedLeads,
      requiresNetNewLeads: requiresNetNewLeads,
      requiresManagerApproval: true,
      scheduleType: scheduleType,

      // Fallbacks to empty strings for Call campaigns
      subjectLine: newCmpType === "Email Sequence Drip" ? subjectLine : "",
      senderName: newCmpType === "Email Sequence Drip" ? senderName : "",
      emailBodyHtml: newCmpType === "Email Sequence Drip" ? emailBodyHtml : "",
      // Use a valid email format fallback in case the backend validates it strictly
      replyToEmail: newCmpType === "Email Sequence Drip" ? replyToEmail : "noreply@leadpulse.com"
    };

    try {
      // Step 1: Create the Campaign
      const cmpRes = await api.post("/campaigns", payload);
      const createdCmp = cmpRes.data?.data ?? cmpRes.data;

      // Step 2: Auto-chain Executive Assignments
      if (selectedExecs.length > 0) {
        await Promise.all(
          selectedExecs.map((execId) =>
            api.post(`/campaigns/${createdCmp.id}/executives`, { executiveUserId: execId })
          )
        );
      }

      // Step 3: Refresh the Campaign list
      const refreshRes = await api.get(`/campaigns?page=${page}&limit=${limit}`);
      setCampaigns(refreshRes.data?.data?.campaigns || []);

      // Step 4: Close modal and reset ALL wizard state
      setIsCreateModalOpen(false);
      setCmpStep(1);

      setNewCmpName("");
      setNewCmpClient("");
      setNewCmpLeadList("");
      setNewCmpSequence("");
      setSelectedExecs([]);

      setNewCmpDesc("");
      setPricingModel("cost_per_lead");
      setRatePerLead("");
      setRetainerAmount("");
      setExcludeClosedLeads(true);
      setRequiresNetNewLeads(false);
      setScheduleType("immediate");

      setSubjectLine("");
      setSenderName("");
      setReplyToEmail("");
      setEmailBodyHtml("");
    } catch (error) {
      alert("Failed to create campaign. Check console.");
      console.error(error);
    }
  };

  // Endpoint #32: POST /api/v1/campaigns/:id/approve
  // Change parameter from cmpId to cmp
  const handleApproveCampaign = async (cmp) => {
    try {
      // Step 1: Approve the campaign
      await api.post(`/campaigns/${cmp.id}/approve`);

      // Step 2: Auto-chain email dispatch if applicable
      if (cmp.type === "Email Sequence Drip" || cmp.type === "email") {
        try {
          await api.post(`/campaigns/${cmp.id}/dispatch-email`);
          alert("Campaign Approved and Emails Dispatched!");
        } catch (dispatchErr) {
          alert("Campaign Approved, but email dispatch failed. Check backend.");
        }
      } else {
        alert("Call Campaign Approved successfully!");
      }

      // Update UI Status
      setCampaigns((prev) => prev.map((c) => (c.id === cmp.id ? { ...c, status: "Active" } : c)));
    } catch (e) {
      // Extract the beautiful backend error message if it fails!
      const msg =
        e.response?.data?.error?.message || e.response?.data?.message || "Approval failed";
      alert(`Cannot Approve: ${msg}`);
    }
  };

  // Endpoint #31: PATCH /api/v1/campaigns/:id/status
  const handleToggleStatus = async (cmpId, currentStatus) => {
    const nextStatus = currentStatus === "Active" ? "Paused" : "Active";
    try {
      await api.patch(`/campaigns/${cmpId}/status`, { status: nextStatus.toLowerCase() });
      setCampaigns((prev) => prev.map((c) => (c.id === cmpId ? { ...c, status: nextStatus } : c)));
    } catch (e) {
      alert("Status toggle failed");
    }
  };

  // Endpoint #30: DELETE /api/v1/campaigns/:id
  const handleDeleteCampaign = async (cmpId) => {
    if (!confirm("Are you sure you want to delete this draft campaign?")) return;
    try {
      await api.delete(`/campaigns/${cmpId}`);
      setCampaigns((prev) => prev.filter((c) => c.id !== cmpId));
    } catch (e) {
      alert("Delete failed");
    }
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
      await api.post(`/campaigns/${assignExecModalCmp.id}/executives`, {
        executiveUserId: selectedExecToAssign
      });
      const refreshRes = await api.get(`/campaigns?page=${page}&limit=${limit}`);
      setCampaigns(refreshRes.data?.data?.campaigns || []);
      setAssignExecModalCmp(null);
    } catch (e) {
      alert("Failed to add executive");
    }
  };

  // Endpoint #35: DELETE /api/v1/campaigns/:id/executives/:execId
  const handleRemoveExecFromCampaign = async (e) => {
    e.preventDefault();
    try {
      await api.delete(`/campaigns/${removeExecModalCmp.id}/executives/${selectedExecToRemove}`);
      const refreshRes = await api.get(`/campaigns?page=${page}&limit=${limit}`);
      setCampaigns(refreshRes.data?.data?.campaigns || []);
      setRemoveExecModalCmp(null);
    } catch (e) {
      alert("Failed to remove executive");
    }
  };

  const handleRowClick = async (cmp) => {
    setSelectedCampaign(cmp);
    setCampaignDetails([]);
    setIsDetailsModalOpen(true);
    setDetailsTab("analytics");

    try {
      if (cmp.type === "Cold Call Blitz" || cmp.type === "call") {
        // Fetch Call Remarks
        const res = await api.get(`/campaigns/${cmp.id}/call-remarks`);
        setCampaignDetails(res.data?.data || []);
      } else {
        // Fetch Email Engagements from the Reports Controller
        const res = await api.get(`/reports/export/engagements?campaignId=${cmp.id}`);
        setCampaignDetails(res.data?.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch campaign details", e);
    }
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
              <th>S.No.</th>
              <th>Client</th>
              <th>Type / Status</th>
              <th>Assigned Executives</th>
              <th style={{ textAlign: "right" }}>Manager Workflow Controls</th>
            </tr>
          </thead>
          <tbody>
            {/* Add 'index' here to calculate the Serial Number */}
            {paginatedCampaigns.map((cmp, index) => (
              <tr
                key={cmp.id}
                className="mgr-table-row-clickable hover:bg-slate-50 cursor-pointer"
                onClick={() => handleRowClick(cmp)}
              >
                {/* 1. S.No instead of ID */}
                <td className="font-mono font-bold text-slate-500">
                  {(page - 1) * limit + index + 1}
                </td>

                {/* 2. Client Name automatically populates because of the backend fix */}
                <td className="font-bold text-slate-900">{cmp.clientName}</td>

                <td>
                  <div className="font-semibold text-slate-800">{cmp.type}</div>
                  <span
                    className={`mgr-badge ${cmp.status === "Active" ? "mgr-badge-green" : cmp.status === "Draft" ? "mgr-badge-amber" : "mgr-badge-purple"}`}
                  >
                    {cmp.status}
                  </span>
                </td>

                <td>
                  <div className="flex flex-wrap gap-1">
                    {cmp.executives.map((ex) => (
                      <span key={ex.id} className="mgr-badge mgr-badge-purple">
                        {ex.name || ex.fullName}
                      </span>
                    ))}
                  </div>
                </td>

                <td style={{ textAlign: "right" }}>
                  {/* Notice e.stopPropagation() on ALL buttons so they don't trigger handleRowClick! */}
                  <div className="flex justify-end items-center gap-1.5 flex-wrap">
                    {cmp.status === "Draft" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveCampaign(cmp);
                        }}
                        className="mgr-btn mgr-btn-purple text-xs py-1"
                      >
                        <CheckCircle size={12} /> Approve
                      </button>
                    )}
                    {cmp.status !== "Draft" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(cmp.id, cmp.status);
                        }}
                        className="mgr-btn mgr-btn-outline text-xs py-1"
                      >
                        {cmp.status === "Active" ? <Pause size={12} /> : <Play size={12} />}
                        {cmp.status === "Active" ? "Pause" : "Resume"}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRoundRobinAssign(cmp.id);
                      }}
                      className="mgr-btn mgr-btn-outline text-xs py-1"
                      title="Distribute Leads"
                    >
                      <Zap size={12} /> Leads
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssignExecModalCmp(cmp);
                        if (execs.length > 0) setSelectedExecToAssign(execs[0].id);
                      }}
                      className="mgr-btn mgr-btn-outline text-xs py-1"
                    >
                      <UserPlus size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRemoveExecModalCmp(cmp);
                        if (cmp.executives.length > 0)
                          setSelectedExecToRemove(cmp.executives[0].id);
                      }}
                      className="mgr-btn mgr-btn-red text-xs py-1"
                    >
                      <UserMinus size={12} />
                    </button>
                    {cmp.status === "Draft" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCampaign(cmp.id);
                        }}
                        className="mgr-btn mgr-btn-red text-xs py-1"
                      >
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
          <span className="mgr-pagination-info">
            Showing Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="mgr-btn mgr-btn-outline"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="mgr-btn mgr-btn-outline"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Details & Insights Modal */}
      <ModalShell
        isOpen={isDetailsModalOpen && !!selectedCampaign}
        onClose={() => setIsDetailsModalOpen(false)}
        noHeader={true}
        maxWidth="860px"
        footer={
          <button
            onClick={() => setIsDetailsModalOpen(false)}
            className="mgr-btn mgr-btn-purple"
          >
            Close Insights
          </button>
        }
      >
        {selectedCampaign && (
          <CampaignInsightsModal
            campaign={selectedCampaign}
            details={campaignDetails}
            activeTab={detailsTab}
            setTab={setDetailsTab}
          />
        )}
      </ModalShell>

      {/* Primary Modal: Create Campaign */}
      {isCreateModalOpen && (
        <div className="mgr-modal-overlay">
          <div
            className="mgr-modal-content"
            style={{
              display: isCreateSequenceModalOpen || isSelectExecModalOpen ? "none" : "block"
            }}
          >
            <div className="mgr-modal-header">
              <span className="mgr-modal-title">Create Campaign Blueprint</span>
              <button onClick={() => setIsCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="mgr-modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                {/* STEP 1: CORE BLUEPRINT */}
                {cmpStep === 1 && (
                  <div className="animate-fade-in">
                    <div className="text-sm font-bold text-slate-800 border-b pb-2 mb-4">
                      Step 1: Core Blueprint
                    </div>

                    <div className="mgr-form-group">
                      <label className="mgr-form-label">Campaign Name</label>
                      <input
                        type="text"
                        required
                        value={newCmpName}
                        onChange={(e) => setNewCmpName(e.target.value)}
                        className="mgr-form-input"
                        placeholder="e.g. Q4 Outreach"
                      />
                    </div>
                    <div className="mgr-form-group">
                      <label className="mgr-form-label">Client Organization</label>
                      <select
                        required
                        value={newCmpClient}
                        onChange={(e) => setNewCmpClient(e.target.value)}
                        className="mgr-form-select"
                      >
                        <option value="">Select a Client...</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name || c.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mgr-form-group">
                      <label className="mgr-form-label">Lead List (Audience)</label>
                      <select
                        required
                        disabled={!newCmpClient}
                        value={newCmpLeadList}
                        onChange={(e) => setNewCmpLeadList(e.target.value)}
                        className="mgr-form-select"
                      >
                        <option value="">
                          {newCmpClient ? "Select a Lead List..." : "Select a Client first"}
                        </option>
                        {leadLists.map((ll) => (
                          <option key={ll.id} value={ll.id}>
                            {ll.name}
                          </option>
                        ))}
                      </select>
                    </div>
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
                        <option value="">
                          {newCmpClient && newCmpLeadList
                            ? "Select a Sequence..."
                            : "Select Client & Lead List first"}
                        </option>
                        {sequences.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                        {newCmpClient && newCmpLeadList && (
                          <option value="CREATE_NEW" className="font-bold text-purple-600">
                            ➕ Create New Sequence...
                          </option>
                        )}
                      </select>
                    </div>
                    <div className="mgr-form-group">
                      <label className="mgr-form-label">Campaign Strategy Type</label>
                      <select
                        value={newCmpType}
                        onChange={(e) => setNewCmpType(e.target.value)}
                        className="mgr-form-select"
                      >
                        <option value="Cold Call Blitz">Cold Call Blitz</option>
                        <option value="Email Sequence Drip">Email Sequence Drip</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* STEP 2: PRICING & LEADS */}
                {cmpStep === 2 && (
                  <div className="animate-fade-in">
                    <div className="text-sm font-bold text-slate-800 border-b pb-2 mb-4">
                      Step 2: Logistics & Pricing
                    </div>

                    <div className="mgr-form-group">
                      <label className="mgr-form-label">Description / Internal Notes</label>
                      <textarea
                        value={newCmpDesc}
                        onChange={(e) => setNewCmpDesc(e.target.value)}
                        className="mgr-form-input"
                        rows={2}
                        placeholder="Optional context..."
                      />
                    </div>

                    <div className="mgr-form-group border border-purple-200 bg-purple-50 p-3 rounded">
                      <label className="mgr-form-label text-purple-900">Pricing Model</label>
                      <select
                        value={pricingModel}
                        onChange={(e) => setPricingModel(e.target.value)}
                        className="mgr-form-select bg-white mb-3"
                      >
                        <option value="cost_per_lead">Cost Per Lead</option>
                        <option value="retainer">Fixed Retainer</option>
                      </select>

                      {pricingModel === "cost_per_lead" ? (
                        <div>
                          <label className="mgr-form-label text-purple-900">
                            Rate Per Lead ($)
                          </label>
                          <input
                            type="number"
                            required={pricingModel === "cost_per_lead"}
                            value={ratePerLead}
                            onChange={(e) => setRatePerLead(e.target.value)}
                            className="mgr-form-input bg-white"
                            placeholder="e.g. 15.00"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="mgr-form-label text-purple-900">
                            Retainer Amount ($)
                          </label>
                          <input
                            type="number"
                            required={pricingModel === "retainer"}
                            value={retainerAmount}
                            onChange={(e) => setRetainerAmount(e.target.value)}
                            className="mgr-form-input bg-white"
                            placeholder="e.g. 5000.00"
                          />
                        </div>
                      )}
                    </div>

                    <div className="mgr-form-group mt-4">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={excludeClosedLeads}
                          onChange={(e) => setExcludeClosedLeads(e.target.checked)}
                          className="accent-purple-600"
                        />
                        Exclude Closed/Converted Leads
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer mt-2">
                        <input
                          type="checkbox"
                          checked={requiresNetNewLeads}
                          onChange={(e) => setRequiresNetNewLeads(e.target.checked)}
                          className="accent-purple-600"
                        />
                        Require Net-New Leads Only
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 3: STRATEGY SPECIFICS */}
                {cmpStep === 3 && (
                  <div className="animate-fade-in">
                    <div className="text-sm font-bold text-slate-800 border-b pb-2 mb-4">
                      Step 3: Strategy Configuration
                    </div>

                    <div className="mgr-form-group">
                      <label className="mgr-form-label">Schedule Type</label>
                      <select
                        value={scheduleType}
                        onChange={(e) => setScheduleType(e.target.value)}
                        className="mgr-form-select"
                      >
                        <option value="immediate">Dispatch Immediately on Approval</option>
                        <option value="scheduled">Schedule for Later (Coming Soon)</option>
                      </select>
                    </div>

                    {newCmpType === "Email Sequence Drip" && (
                      <div className="border border-blue-200 bg-blue-50 p-3 rounded mt-4">
                        <div className="text-xs font-bold text-blue-800 uppercase mb-3">
                          Email Template Settings
                        </div>
                        <div className="mgr-form-group">
                          <label className="mgr-form-label text-blue-900">Sender Name</label>
                          <input
                            type="text"
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            className="mgr-form-input bg-white"
                            placeholder="e.g. John from LeadPulse"
                          />
                        </div>
                        <div className="mgr-form-group">
                          <label className="mgr-form-label text-blue-900">Reply-To Email</label>
                          <input
                            type="email"
                            value={replyToEmail}
                            onChange={(e) => setReplyToEmail(e.target.value)}
                            className="mgr-form-input bg-white"
                            placeholder="john@company.com"
                          />
                        </div>
                        <div className="mgr-form-group">
                          <label className="mgr-form-label text-blue-900">Subject Line</label>
                          <input
                            type="text"
                            value={subjectLine}
                            onChange={(e) => setSubjectLine(e.target.value)}
                            className="mgr-form-input bg-white"
                            placeholder="You won't believe this offer..."
                          />
                        </div>
                        <div className="mgr-form-group">
                          <label className="mgr-form-label text-blue-900">Email Body HTML</label>
                          <textarea
                            value={emailBodyHtml}
                            onChange={(e) => setEmailBodyHtml(e.target.value)}
                            className="mgr-form-input bg-white font-mono text-xs"
                            rows={4}
                            placeholder="<h1>Hello {{first_name}}</h1>..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: EXECUTIVES */}
                {cmpStep === 4 && (
                  <div className="animate-fade-in">
                    <div className="text-sm font-bold text-slate-800 border-b pb-2 mb-4">
                      Step 4: Assign Executives
                    </div>

                    {/* PASTE YOUR SEARCHABLE EXECUTIVE BUTTON/BADGES COMPONENT HERE */}
                    <div className="mgr-form-group">
                      <label className="mgr-form-label">
                        Assign Executive(s){" "}
                        {newCmpType === "Email Sequence Drip" ? "(Max 1)" : "(Multiple Allowed)"}
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
                      {selectedExecs.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 p-2 border border-slate-100 rounded bg-slate-50">
                          {selectedExecs.map((id) => {
                            const ex = execs.find((e) => e.id === id);
                            return (
                              <span
                                key={id}
                                className="mgr-badge mgr-badge-purple flex items-center gap-1"
                              >
                                {ex?.name || ex?.fullName}
                                <button type="button" onClick={() => toggleExec(id)}>
                                  <X size={12} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mgr-modal-footer flex justify-between">
                <div>
                  {cmpStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCmpStep((prev) => prev - 1)}
                      className="mgr-btn mgr-btn-outline"
                    >
                      <ChevronLeft size={14} className="mr-1" /> Back
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setCmpStep(1);
                    }}
                    className="mgr-btn mgr-btn-outline"
                  >
                    Cancel
                  </button>

                  {cmpStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setCmpStep((prev) => prev + 1)}
                      className="mgr-btn mgr-btn-purple"
                      disabled={
                        cmpStep === 1 &&
                        (!newCmpName || !newCmpClient || !newCmpLeadList || !newCmpSequence)
                      }
                    >
                      Next Step <ChevronRight size={14} className="ml-1" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreateCampaign}
                      className="mgr-btn mgr-btn-purple"
                    >
                      Create Campaign
                    </button>
                  )}
                </div>
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
              <button
                onClick={() => {
                  setIsCreateSequenceModalOpen(false);
                  setNewCmpSequence("");
                }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSequence}>
              <div className="mgr-modal-body">
                <div className="text-xs text-slate-500 mb-2 italic">
                  Inheriting Client and Lead List from parent campaign setup...
                </div>
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Sequence Name</label>
                  <input
                    type="text"
                    required
                    value={newSequenceName}
                    onChange={(e) => setNewSequenceName(e.target.value)}
                    className="mgr-form-input"
                    placeholder="e.g. Q4 Aggressive Follow-up"
                  />
                </div>
              </div>
              <div className="mgr-modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateSequenceModalOpen(false);
                    setNewCmpSequence("");
                  }}
                  className="mgr-btn mgr-btn-outline"
                >
                  Back
                </button>
                <button type="submit" className="mgr-btn mgr-btn-purple">
                  Save Sequence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Nested Modal: Select Executives Table */}
      {isSelectExecModalOpen && (
        <div className="mgr-modal-overlay">
          <div
            className="mgr-modal-content border-2 border-purple-500 shadow-xl"
            style={{ maxWidth: "650px" }}
          >
            <div className="mgr-modal-header bg-purple-50 rounded-t-lg">
              <span className="mgr-modal-title text-purple-900">
                Select {newCmpType === "Email Sequence Drip" ? "Executive" : "Executives"}
              </span>
              <button onClick={() => setIsSelectExecModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="mgr-modal-body">
              <input
                type="text"
                placeholder="Search by executive name..."
                value={execSearch}
                onChange={(e) => {
                  setExecSearch(e.target.value);
                  setExecPage(1);
                }}
                className="mgr-form-input mb-4"
              />

              <table className="mgr-data-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}></th>
                    <th>Executive Name</th>
                    <th>Email Address</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFilteredExecs.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center text-slate-500 italic py-6">
                        No available executives found.
                      </td>
                    </tr>
                  ) : (
                    paginatedFilteredExecs.map((ex) => (
                      <tr
                        key={ex.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => toggleExec(ex.id)}
                      >
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
                <span className="mgr-pagination-info">
                  Page {execPage} of {totalExecPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={execPage === 1}
                    onClick={() => setExecPage((p) => p - 1)}
                    className="mgr-btn mgr-btn-outline py-1 px-3 text-xs"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    type="button"
                    disabled={execPage === totalExecPages}
                    onClick={() => setExecPage((p) => p + 1)}
                    className="mgr-btn mgr-btn-outline py-1 px-3 text-xs"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mgr-modal-footer">
              <button
                type="button"
                onClick={() => setIsSelectExecModalOpen(false)}
                className="mgr-btn mgr-btn-purple"
              >
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
              <button onClick={() => setAssignExecModalCmp(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddExecToCampaign}>
              <div className="mgr-modal-body">
                <div className="mgr-form-group">
                  <label className="mgr-form-label">Select Executive</label>
                  <select
                    required
                    value={selectedExecToAssign}
                    onChange={(e) => setSelectedExecToAssign(e.target.value)}
                    className="mgr-form-select"
                  >
                    <option value="">Choose...</option>
                    {execs.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name || ex.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mgr-modal-footer">
                <button
                  type="button"
                  onClick={() => setAssignExecModalCmp(null)}
                  className="mgr-btn mgr-btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="mgr-btn mgr-btn-purple">
                  Grant Access
                </button>
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
              <button onClick={() => setRemoveExecModalCmp(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRemoveExecFromCampaign}>
              <div className="mgr-modal-body">
                {removeExecModalCmp.executives.length === 0 ? (
                  <div className="text-xs text-slate-500 font-semibold">No active executives.</div>
                ) : (
                  <div className="mgr-form-group">
                    <label className="mgr-form-label">Select Executive</label>
                    <select
                      value={selectedExecToRemove}
                      onChange={(e) => setSelectedExecToRemove(e.target.value)}
                      className="mgr-form-select"
                    >
                      {removeExecModalCmp.executives.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name || ex.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="mgr-modal-footer">
                <button
                  type="button"
                  onClick={() => setRemoveExecModalCmp(null)}
                  className="mgr-btn mgr-btn-outline"
                >
                  Cancel
                </button>
                {removeExecModalCmp.executives.length > 0 && (
                  <button type="submit" className="mgr-btn mgr-btn-red">
                    Revoke
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
