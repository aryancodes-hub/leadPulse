"use client";

import { useEffect, useState } from "react";
import {
  User,
  Edit3,
  Clock,
  SkipForward,
  Send,
  CheckCircle2,
  FileText,
  History
} from "lucide-react";
import { getNextQueueLead, skipQueueLead } from "@/lib/campaigns";
import { createCallRemark } from "@/lib/calls";

export default function ExecutiveQueueView({ activeCampaign, perfData, refreshData }) {
  const campaignId = activeCampaign?.id || "CMP-CALL-01";
  const campaignName = activeCampaign?.name || "TechCorp Outreach";
  const categoryTag = activeCampaign?.categoryTag || "B2B SaaS Enterprise";

  const [currentLead, setCurrentLead] = useState(null);

  // Real Progress tracking synced with PostgreSQL
  const completedCount = perfData?.totalCalls || 0;
  const totalLeads = (perfData?.totalCalls || 0) + (perfData?.pendingQueueSize || 0);

  // Form State: Reverted back to CallRemarks ENUM
  const [form, setForm] = useState({
    callOutcome: "",
    callDuration: "5",
    followUpDate: "",
    leadStatusUpdate: "Qualified",
    notes: ""
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  async function loadNextLead() {
    try {
      const nextLeadData = await getNextQueueLead(campaignId);
      if (nextLeadData && nextLeadData.clientLead) {
        const master = nextLeadData.clientLead.masterContact;
        setCurrentLead({
          id: nextLeadData.clientLeadId,
          name: `${master.firstName} ${master.lastName}`,
          firstName: master.firstName,
          lastName: master.lastName,
          phone: master.phone,
          email: master.email,
          company: master.company,
          title: master.jobTitle || "-",
          industry: master.industry || "",
          status: nextLeadData.status,
          pastRemarks: "No recent remarks",
          historyNotes: []
        });
        return;
      }
    } catch (err) {
      console.error(err);
    }

    setCurrentLead(null);
  }

  useEffect(() => {
    loadNextLead();
  }, [campaignId]);

  const handleSkipLead = async () => {
    if (!currentLead) return;
    setIsSkipping(true);
    setFormError("");

    try {
      await skipQueueLead(campaignId, currentLead.id);
    } catch (err) {}

    setFeedbackMsg(`Skipped lead ${currentLead.name}`);
    setTimeout(() => setFeedbackMsg(""), 2000);

    await loadNextLead();
    setForm({
      callOutcome: "",
      callDuration: "5",
      followUpDate: "",
      leadStatusUpdate: "Qualified",
      notes: ""
    });
    setIsSkipping(false);
  };

  const handleSubmitAndNext = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.callOutcome || form.callOutcome === "Select Outcome") {
      setFormError("Please select a Call Outcome to submit remarks.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      campaignId,
      clientLeadId: currentLead?.id,
      callOutcome: form.callOutcome,
      callDurationMinutes: Number(form.callDuration) || 0,
      followUpDate: form.followUpDate ? new Date(form.followUpDate).toISOString() : undefined,
      leadStatusUpdate: form.leadStatusUpdate,
      notes: form.notes
    };

    try {
      await createCallRemark(payload);

      // Instantly trigger a re-fetch for the progress bar!
      if (refreshData) refreshData();

      setFeedbackMsg(
        form.callOutcome === "Callback Requested"
          ? `Callback scheduled for ${currentLead?.name}! Added to Callbacks tab.`
          : `Remarks recorded for ${currentLead?.name}! Loading next lead...`
      );
      setTimeout(() => setFeedbackMsg(""), 3000);

      setForm({
        callOutcome: "",
        callDuration: "5",
        followUpDate: "",
        leadStatusUpdate: "Qualified",
        notes: ""
      });

      await loadNextLead();
    } catch (err) {
      console.error(err);
      // Let the user know it failed instead of silently ignoring it!
      setFormError("Failed to save. Please check the backend logs or form data.");
    }

    setIsSubmitting(false);
  };

  const progressPercent = totalLeads > 0 ? Math.round((completedCount / totalLeads) * 100) : 0;

  const handledate = (e) => {
    const picked = e.target.value;
    const today = new Date().toISOString().split("T")[0];

    const maxDateObj = new Date();
    maxDateObj.setMonth(maxDateObj.getMonth() + 2);
    const maxDate = maxDateObj.toISOString().split("T")[0];

    if (picked && picked < today) {
      setFormError("Follow-up date cannot be in the past. Please select today or a future date.");
      setForm({ ...form, followUpDate: "" });
      return;
    }

    if (picked && picked > maxDate) {
      setFormError("Follow-up date cannot be more than 2 months from today.");
      setForm({ ...form, followUpDate: "" });
      return;
    }

    setFormError("");
    setForm({ ...form, followUpDate: picked });
  };

  return (
    <div className="exec-queue-container">
      {feedbackMsg && (
        <div className="exec-alert-toast">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <div
        style={{
          background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)",
          border: "1px solid #bfdbfe",
          borderRadius: 14,
          padding: "14px 20px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap"
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div
            style={{
              padding: 8,
              background: "#dbeafe",
              borderRadius: 10,
              display: "flex",
              flexShrink: 0
            }}
          >
            <FileText size={16} color="#1d4ed8" />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#1d4ed8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 4
              }}
            >
              Campaign Script Cues • {campaignName}
            </div>
            <p style={{ fontSize: 12, color: "#334155", lineHeight: 1.6, margin: 0 }}>
              <strong>Key Talking Point:</strong> &ldquo;We help mid-market teams cut sales cycle
              times by 35% through multi-channel cadences. Are you currently using an automated
              outbound stack for your reps?&rdquo;
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            background: "#1d4ed8",
            color: "white",
            padding: "3px 10px",
            borderRadius: 20,
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          {categoryTag}
        </span>
      </div>

      {!currentLead ? (
        <div
          style={{
            marginTop: 24,
            textAlign: "center",
            padding: "48px 24px",
            background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
            borderRadius: 16,
            border: "1px solid #bbf7d0"
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#14532d", marginBottom: 6 }}>
            Queue Complete!
          </div>
          <div style={{ fontSize: 13, color: "#166534", fontWeight: 500 }}>
            All leads have been worked. Great job today.
          </div>
        </div>
      ) : (
        <div className="exec-split-workspace mt-4">
          <div className="exec-workspace-card">
            <div className="exec-workspace-header">
              <div className="exec-badge-round-blue">
                <User size={20} />
              </div>
              <div className="flex-1">
                <h3 className="exec-workspace-title">LEAD CARD WORKSPACE</h3>
              </div>
              {currentLead?.industry && (
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                  {currentLead.industry}
                </span>
              )}
            </div>

            <div className="exec-lead-details">
              <div className="exec-detail-row">
                <span className="exec-detail-label">Name:</span>
                <span className="exec-detail-val font-extrabold text-slate-900 text-base">
                  {currentLead?.name}
                </span>
              </div>
              <div className="exec-detail-row">
                <span className="exec-detail-label">Phone:</span>
                <span className="exec-detail-val font-mono font-bold text-blue-600 text-base">
                  {currentLead?.phone}
                </span>
              </div>
              <div className="exec-detail-row">
                <span className="exec-detail-label">Email:</span>
                <span className="exec-detail-val text-slate-700 text-xs font-medium">
                  {currentLead?.email}
                </span>
              </div>
              <div className="exec-detail-row">
                <span className="exec-detail-label">Company:</span>
                <span className="exec-detail-val text-slate-800 font-semibold">
                  {currentLead?.company}
                </span>
              </div>
              <div className="exec-detail-row">
                <span className="exec-detail-label">Title:</span>
                <span className="exec-detail-val text-slate-700">{currentLead?.title}</span>
              </div>
              <div className="exec-detail-row">
                <span className="exec-detail-label">Status:</span>
                <div className="exec-detail-val">
                  <span className="exec-status-pill">{currentLead?.status}</span>
                </div>
              </div>
              <div className="exec-detail-row items-start">
                <span className="exec-detail-label pt-2">Past Remarks:</span>
                <div className="exec-detail-val flex-1">
                  <div className="exec-past-remarks-box">
                    &ldquo;{currentLead?.pastRemarks}&rdquo;
                  </div>
                </div>
              </div>

              {currentLead?.historyNotes && currentLead.historyNotes.length > 0 && (
                <div className="border-t border-slate-100 pt-3 mt-1">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-2">
                    <History size={13} />
                    <span>Lead Touchpoint History</span>
                  </div>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto">
                    {currentLead.historyNotes.map((h, i) => (
                      <div key={i} className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded">
                        <span className="font-bold text-slate-800">{h.date}</span> ({h.caller}):{" "}
                        {h.note}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="exec-workspace-actions">
              <button
                type="button"
                onClick={handleSkipLead}
                disabled={isSkipping}
                className="exec-btn-skip-lead"
              >
                <SkipForward size={16} />
                <span>{isSkipping ? "SKIPPING..." : "SKIP LEAD"}</span>
              </button>
            </div>
          </div>

          <div className="exec-workspace-card">
            <div className="exec-workspace-header">
              <div className="exec-badge-round-purple">
                <Edit3 size={18} />
              </div>
              <h3 className="exec-workspace-title">CALL REMARK ENTRY FORM</h3>
            </div>

            <form onSubmit={handleSubmitAndNext} className="exec-form-body">
              {formError && <div className="exec-form-error-alert">{formError}</div>}

              <div className="exec-form-group">
                <label className="exec-form-label">
                  Call Outcome: <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.callOutcome}
                  onChange={(e) => {
                    const newOutcome = e.target.value;
                    setForm({
                      ...form,
                      callOutcome: newOutcome,
                      followUpDate: newOutcome === "Callback Requested" ? form.followUpDate : ""
                    });
                    if (formError) setFormError("");
                  }}
                  className="exec-select-input"
                  required
                >
                  <option value="">Select Outcome</option>
                  <option value="Answered">Answered</option>
                  <option value="Not_Answered">Not Answered</option>
                  <option value="Busy">Busy</option>
                  <option value="Wrong_Number">Wrong Number</option>
                  <option value="Left_Voicemail">Left Voicemail</option>
                  <option value="Callback Requested">Callback Requested</option>
                  <option value="Not_Interested">Not Interested</option>
                  <option value="Converted">Converted</option>
                </select>
              </div>

              {form.callOutcome === "Callback Requested" && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#eef2ff",
                    border: "1px solid #c7d2fe",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "#1e1b4b",
                    fontWeight: 600
                  }}
                >
                  Fill the follow-up date below to schedule this callback.
                </div>
              )}

              <div className="exec-form-group">
                <label className="exec-form-label">Call Duration:</label>
                <div className="exec-input-addon-wrap">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={form.callDuration}
                    onChange={(e) => setForm({ ...form, callDuration: e.target.value })}
                    className="exec-text-input"
                  />
                  <span className="exec-addon-suffix">mins</span>
                </div>
              </div>

              {form.callOutcome === "Callback Requested" && (
                <div className="exec-form-group">
                  <label className="exec-form-label">Follow-Up Date:</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={form.followUpDate}
                      min={new Date().toISOString().split("T")[0]}
                      max={(() => {
                        const d = new Date();
                        d.setMonth(d.getMonth() + 2);
                        return d.toISOString().split("T")[0];
                      })()}
                      onChange={handledate}
                      className="exec-text-input pr-10"
                    />
                  </div>
                </div>
              )}
              <div className="exec-form-group">
                <label className="exec-form-label">Lead Status Update:</label>
                <select
                  value={form.leadStatusUpdate}
                  onChange={(e) => setForm({ ...form, leadStatusUpdate: e.target.value })}
                  className="exec-select-input"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Converted">Converted</option>
                  <option value="Dead">Dead</option>
                </select>
              </div>

              <div className="exec-form-group">
                <label className="exec-form-label">Notes / Remarks:</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="exec-textarea-input"
                  placeholder="Enter detailed notes about the call..."
                />
              </div>

              <div className="exec-form-submit-row">
                <button type="submit" disabled={isSubmitting} className="exec-btn-submit-next">
                  <Send size={16} />
                  <span>{isSubmitting ? "SAVING & LOADING NEXT..." : "SUBMIT & NEXT LEAD"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="exec-queue-progress-card mt-6">
        <div className="exec-progress-header">
          <div className="flex items-center gap-2 text-slate-800">
            <Clock size={18} className="text-blue-600" />
            <h4 className="exec-progress-title">QUEUE PROGRESS</h4>
          </div>
          <span className="exec-progress-stats font-semibold text-slate-700">
            <strong>
              {completedCount} / {totalLeads}
            </strong>{" "}
            Leads Completed ({progressPercent}%)
          </span>
        </div>
        <div className="exec-progress-track">
          <div
            className="exec-progress-fill"
            style={{
              width: `${progressPercent}%`,
              background: "linear-gradient(90deg, #0066ff 0%, #7c3aed 100%)"
            }}
          />
        </div>
      </div>
    </div>
  );
}
