"use client";

import { useEffect, useState } from "react";
import {
  User,
  Edit3,
  Clock,
  SkipForward,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  History,
  Phone,
  Mail,
  Building2,
  Briefcase,
  ShieldAlert,
} from "lucide-react";
import { getNextQueueLead, skipQueueLead } from "@/lib/campaigns";
import { createCallRemark } from "@/lib/calls";
import { recordCallRemark, CALL_OUTCOMES } from "@/lib/executiveStore";

// Comprehensive mock leads for development
const MOCK_LEAD_QUEUE = [
  {
    id: "LEAD-101",
    firstName: "John",
    lastName: "Doe",
    name: "John Doe",
    phone: "+1 555-0199",
    email: "john.doe@techcorp.io",
    company: "TechCorp",
    title: "IT Manager",
    industry: "Enterprise Software",
    status: "New",
    isDnc: false,
    isUnsubscribed: false,
    pastRemarks: "Left voicemail 9/16",
    historyNotes: [
      { date: "Sep 16, 2:30 PM", caller: "You", note: "Left voicemail introducing enterprise automation stack." },
      { date: "Sep 12, 10:15 AM", caller: "Alex W.", note: "Inbound click on SaaS comparison guide." },
    ],
  },
  {
    id: "LEAD-102",
    firstName: "Sarah",
    lastName: "Jenkins",
    name: "Sarah Jenkins",
    phone: "+1 555-0248",
    email: "s.jenkins@apexglobal.com",
    company: "Apex Global Systems",
    title: "VP of Engineering",
    industry: "Cloud Infrastructure",
    status: "In Review",
    isDnc: false,
    isUnsubscribed: false,
    pastRemarks: "Requested case study on automated workflows",
    historyNotes: [
      { date: "Sep 15, 11:00 AM", caller: "You", note: "Sent case study PDF; requested follow-up call." },
    ],
  },
  {
    id: "LEAD-103",
    firstName: "Marcus",
    lastName: "Vance",
    name: "Marcus Vance",
    phone: "+1 555-0371",
    email: "marcus@vanguardtech.net",
    company: "Vanguard Tech",
    title: "Chief Technology Officer",
    industry: "Cybersecurity",
    status: "New",
    isDnc: true, // Example DNC flag to demonstrate the compliance badge
    isUnsubscribed: false,
    pastRemarks: "Number flagged on internal do-not-call list",
    historyNotes: [
      { date: "Aug 28, 4:00 PM", caller: "System", note: "Opted out via web portal form." },
    ],
  },
];

export default function ExecutiveQueueView({ activeCampaign }) {
  const campaignId = activeCampaign?.id || "CMP-CALL-01";
  const campaignName = activeCampaign?.name || "TechCorp Outreach";
  const categoryTag = activeCampaign?.categoryTag || "B2B SaaS Enterprise";

  const [currentLeadIndex, setCurrentLeadIndex] = useState(0);
  const [currentLead, setCurrentLead] = useState(MOCK_LEAD_QUEUE[0]);
  const [completedCount, setCompletedCount] = useState(12);
  const totalLeads = 50;

  // Form State
  const [form, setForm] = useState({
    callOutcome: "",
    callDuration: "5",
    followUpDate: "",
    leadStatusUpdate: "Qualified",
    notes: "",
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  /*
  =============================================================================
  BACKEND INTEGRATION: POST /api/v1/campaigns/:id/queue/next (Endpoint 37)
  =============================================================================
  */
  async function loadNextLead() {
    try {
      const nextLeadData = await getNextQueueLead(campaignId);
      if (nextLeadData?.lead) {
        setCurrentLead(nextLeadData.lead);
        return;
      }
    } catch (err) {
      // Fallback: cycle mock leads
    }

    setCurrentLeadIndex((prev) => {
      const nextIdx = (prev + 1) % MOCK_LEAD_QUEUE.length;
      setCurrentLead(MOCK_LEAD_QUEUE[nextIdx]);
      return nextIdx;
    });
  }

  useEffect(() => {
    loadNextLead();
  }, [campaignId]);

  /*
  =============================================================================
  BACKEND INTEGRATION: POST /api/v1/campaigns/:id/queue/:leadId/skip (Endpoint 38)
  =============================================================================
  */
  const handleSkipLead = async () => {
    if (!currentLead) return;
    setIsSkipping(true);
    setFormError("");

    try {
      await skipQueueLead(campaignId, currentLead.id);
    } catch (err) {
      // Fallback
    }

    setFeedbackMsg(`Skipped lead ${currentLead.name}`);
    setTimeout(() => setFeedbackMsg(""), 2000);

    await loadNextLead();
    setForm({
      callOutcome: "",
      callDuration: "5",
      followUpDate: "",
      leadStatusUpdate: "Qualified",
      notes: "",
    });
    setIsSkipping(false);
  };

  /*
  =============================================================================
  BACKEND INTEGRATION: POST /api/v1/call-remarks (Endpoint 39)
  =============================================================================
  */
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
      leadId: currentLead?.id,
      outcome: form.callOutcome,
      durationMinutes: Number(form.callDuration) || 0,
      followUpDate: form.followUpDate || null,
      statusUpdate: form.leadStatusUpdate,
      remarks: form.notes,
    };

    // 1. Backend API Call (Endpoint 39)
    try {
      await createCallRemark(payload);
    } catch (err) {
      // Fallback
    }

    // 2. Local Frontend Store Persistence (so Callbacks & History instantly update)
    recordCallRemark({
      leadId: currentLead?.id,
      leadName: currentLead?.name,
      company: currentLead?.company,
      phone: currentLead?.phone,
      outcome: form.callOutcome,
      durationMinutes: form.callDuration,
      followUpDate: form.followUpDate,
      notes: form.notes,
    });

    setCompletedCount((prev) => Math.min(prev + 1, totalLeads));
    setFeedbackMsg(
      form.callOutcome === "Callback_Requested"
        ? `Callback scheduled for ${currentLead?.name}! Added to Callbacks tab.`
        : `Remarks recorded for ${currentLead?.name}! Loading next lead...`
    );
    setTimeout(() => setFeedbackMsg(""), 3000);

    setForm({
      callOutcome: "",
      callDuration: "5",
      followUpDate: "",
      leadStatusUpdate: "Qualified",
      notes: "",
    });

    await loadNextLead();
    setIsSubmitting(false);
  };

  const progressPercent = Math.round((completedCount / totalLeads) * 100);

  return (
    <div className="exec-queue-container">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="exec-alert-toast">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* CRITICAL Compliance Warning if DNC or Unsubscribed */}
      {(currentLead?.isDnc || currentLead?.isUnsubscribed) && (
        <div className="exec-compliance-alert">
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-rose-600 flex-shrink-0" />
            <div>
              <span className="font-extrabold text-rose-800 text-sm block">
                LEGAL COMPLIANCE WARNING:
              </span>
              <span className="text-xs text-rose-700">
                {currentLead.isDnc && "This contact is marked DO NOT CALL (DNC). "}
                {currentLead.isUnsubscribed && "Contact has unsubscribed from marketing communication."}
                Do not engage without manager authorization.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSkipLead}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
          >
            Skip Non-Compliant Lead
          </button>
        </div>
      )}

      {/* Campaign Script Cues & Talking Points Context */}
      <div className="exec-script-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700">
            <FileText size={16} />
            <h4 className="text-xs font-extrabold uppercase tracking-wide">
              Campaign Script Cues &bull; {campaignName}
            </h4>
          </div>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
            Category: {categoryTag}
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
          <strong>Key Talking Point:</strong> &ldquo;We help mid-market teams cut sales cycle times by 35% through multi-channel cadences. Are you currently using an automated outbound stack for your reps?&rdquo;
        </p>
      </div>

      {/* Main Split Row: Lead Card Workspace & Call Remark Entry Form */}
      <div className="exec-split-workspace">
        {/* Left Column: LEAD CARD WORKSPACE */}
        <div className="exec-workspace-card">
          <div className="exec-workspace-header">
            <div className="exec-badge-round-blue">
              <User size={20} />
            </div>
            <div className="flex-1">
              <h3 className="exec-workspace-title">LEAD CARD WORKSPACE</h3>
              <span className="text-xs text-slate-500 font-mono">ID: {currentLead?.id}</span>
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
                {currentLead?.name || "John Doe"}
              </span>
            </div>

            <div className="exec-detail-row">
              <span className="exec-detail-label">Phone:</span>
              <span className="exec-detail-val font-mono font-bold text-blue-600 text-base">
                {currentLead?.phone || "+1 555-0199"}
              </span>
            </div>

            <div className="exec-detail-row">
              <span className="exec-detail-label">Email:</span>
              <span className="exec-detail-val text-slate-700 text-xs font-medium">
                {currentLead?.email || "john.doe@techcorp.io"}
              </span>
            </div>

            <div className="exec-detail-row">
              <span className="exec-detail-label">Company:</span>
              <span className="exec-detail-val text-slate-800 font-semibold">
                {currentLead?.company || "TechCorp"}
              </span>
            </div>

            <div className="exec-detail-row">
              <span className="exec-detail-label">Title:</span>
              <span className="exec-detail-val text-slate-700">
                {currentLead?.title || "IT Manager"}
              </span>
            </div>

            <div className="exec-detail-row">
              <span className="exec-detail-label">Status:</span>
              <div className="exec-detail-val">
                <span className="exec-status-pill">
                  {currentLead?.status || "New"}
                </span>
              </div>
            </div>

            <div className="exec-detail-row items-start">
              <span className="exec-detail-label pt-2">Past Remarks:</span>
              <div className="exec-detail-val flex-1">
                <div className="exec-past-remarks-box">
                  &ldquo;{currentLead?.pastRemarks || "Left voicemail 9/16"}&rdquo;
                </div>
              </div>
            </div>

            {/* Past History Stream */}
            {currentLead?.historyNotes && currentLead.historyNotes.length > 0 && (
              <div className="border-t border-slate-100 pt-3 mt-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-2">
                  <History size={13} />
                  <span>Lead Touchpoint History</span>
                </div>
                <div className="space-y-1.5 max-h-24 overflow-y-auto">
                  {currentLead.historyNotes.map((h, i) => (
                    <div key={i} className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded">
                      <span className="font-bold text-slate-800">{h.date}</span> ({h.caller}): {h.note}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action: SKIP LEAD */}
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

        {/* Right Column: CALL REMARK ENTRY FORM */}
        <div className="exec-workspace-card">
          <div className="exec-workspace-header">
            <div className="exec-badge-round-purple">
              <Edit3 size={18} />
            </div>
            <h3 className="exec-workspace-title">CALL REMARK ENTRY FORM</h3>
          </div>

          <form onSubmit={handleSubmitAndNext} className="exec-form-body">
            {formError && (
              <div className="exec-form-error-alert">
                {formError}
              </div>
            )}

            {/* Field 1: Call Outcome */}
            <div className="exec-form-group">
              <label className="exec-form-label">
                Call Outcome: <span className="text-red-500">*</span>
              </label>
              <select
                value={form.callOutcome}
                onChange={(e) => {
                  setForm({ ...form, callOutcome: e.target.value });
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
                <option value="Callback_Requested">Callback Requested</option>
                <option value="Not_Interested">Not Interested</option>
                <option value="Converted">Converted</option>
              </select>
            </div>

            {/* If Callback Requested, show prompt */}
            {form.callOutcome === "Callback_Requested" && (
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 font-semibold">
                🔔 Scheduled Callback: Select Follow-Up Date below to add this lead to your actionable Callbacks queue.
              </div>
            )}

            {/* Field 2: Call Duration */}
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

            {/* Field 3: Follow-Up Date */}
            <div className="exec-form-group">
              <label className="exec-form-label">Follow-Up Date:</label>
              <div className="relative">
                <input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                  className="exec-text-input pr-10"
                  placeholder="YYYY-MM-DD"
                />
              </div>
            </div>

            {/* Field 4: Lead Status Update */}
            <div className="exec-form-group">
              <label className="exec-form-label">Lead Status Update:</label>
              <select
                value={form.leadStatusUpdate}
                onChange={(e) => setForm({ ...form, leadStatusUpdate: e.target.value })}
                className="exec-select-input"
              >
                <option value="Qualified">Qualified</option>
                <option value="Contacted">Contacted</option>
                <option value="In Review">In Review</option>
                <option value="Unqualified">Unqualified</option>
              </select>
            </div>

            {/* Field 5: Notes / Remarks */}
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

            {/* Action: SUBMIT & NEXT LEAD */}
            <div className="exec-form-submit-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="exec-btn-submit-next"
              >
                <Send size={16} />
                <span>{isSubmitting ? "SAVING & LOADING NEXT..." : "SUBMIT & NEXT LEAD"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Queue Progress Bar Card matching Image 2 */}
      <div className="exec-queue-progress-card">
        <div className="exec-progress-header">
          <div className="flex items-center gap-2 text-slate-800">
            <Clock size={18} className="text-blue-600" />
            <h4 className="exec-progress-title">QUEUE PROGRESS</h4>
          </div>
          <span className="exec-progress-stats font-semibold text-slate-700">
            <strong>{completedCount} / {totalLeads}</strong> Leads Completed ({progressPercent}%)
          </span>
        </div>

        <div className="exec-progress-track">
          <div
            className="exec-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
