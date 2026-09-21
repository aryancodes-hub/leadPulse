// Store for Executive Single-Campaign, Call Remarks, VIBGYOR Counts & Callbacks

export const CALL_OUTCOMES = [
  "Answered",
  "Not_Answered",
  "Busy",
  "Wrong_Number",
  "Left_Voicemail",
  "Callback_Requested",
  "Not_Interested",
  "Converted",
];

export const EMAIL_JOB_STATUSES = [
  "Queued",
  "Processing",
  "Completed",
  "Failed",
];

export const VIBGYOR_OUTCOME_CONFIG = {
  Answered: {
    label: "Answered",
    color: "#8B5CF6", // Violet
    bg: "rgba(139, 92, 246, 0.12)",
    border: "#C4B5FD",
    textColor: "#6D28D9",
    vibgyor: "V",
  },
  Callback_Requested: {
    label: "Callback Requested",
    color: "#4F46E5", // Indigo
    bg: "rgba(79, 70, 229, 0.12)",
    border: "#A5B4FC",
    textColor: "#3730A3",
    vibgyor: "I",
  },
  Converted: {
    label: "Converted",
    color: "#0EA5E9", // Blue
    bg: "rgba(14, 165, 233, 0.12)",
    border: "#7DD3FC",
    textColor: "#0369A1",
    vibgyor: "B",
  },
  Left_Voicemail: {
    label: "Left Voicemail",
    color: "#10B981", // Green
    bg: "rgba(16, 185, 129, 0.12)",
    border: "#6EE7B7",
    textColor: "#047857",
    vibgyor: "G",
  },
  Busy: {
    label: "Busy",
    color: "#F59E0B", // Yellow
    bg: "rgba(245, 158, 11, 0.12)",
    border: "#FDE68A",
    textColor: "#B45309",
    vibgyor: "Y",
  },
  Not_Answered: {
    label: "Not Answered",
    color: "#F97316", // Orange
    bg: "rgba(249, 115, 22, 0.12)",
    border: "#FDBA74",
    textColor: "#C2410C",
    vibgyor: "O",
  },
  Wrong_Number: {
    label: "Wrong Number",
    color: "#EF4444", // Red
    bg: "rgba(239, 68, 68, 0.12)",
    border: "#FCA5A5",
    textColor: "#B91C1C",
    vibgyor: "R",
  },
  Not_Interested: {
    label: "Not Interested",
    color: "#BE123C", // Crimson / Deep Red
    bg: "rgba(190, 18, 60, 0.12)",
    border: "#FDA4AF",
    textColor: "#881337",
    vibgyor: "+",
  },
};

export const RGBY_EMAIL_CONFIG = {
  Failed: {
    label: "Failed",
    color: "#EF4444", // Red
    letter: "R",
  },
  Completed: {
    label: "Completed",
    color: "#10B981", // Green
    letter: "G",
  },
  Processing: {
    label: "Processing",
    color: "#3B82F6", // Blue
    letter: "B",
  },
  Queued: {
    label: "Queued",
    color: "#F59E0B", // Yellow
    letter: "Y",
  },
};

// Default campaigns
export const MOCK_CALL_CAMPAIGN = {
  id: "CMP-CALL-01",
  name: "TechCorp Enterprise Outreach",
  campaign_type: "call",
  targetLeads: 50,
  description: "B2B cold outreach for enterprise workflow automation platform.",
};

export const MOCK_EMAIL_CAMPAIGN = {
  id: "CMP-EMAIL-01",
  name: "CloudScale Renewal Drip",
  campaign_type: "email",
  targetLeads: 500,
  description: "Automated sequence for cloud resource renewals and tier upgrades.",
};

const DEFAULT_ACTIVITY_COUNTS = {
  Answered: 5,
  Callback_Requested: 3,
  Converted: 2,
  Left_Voicemail: 4,
  Busy: 2,
  Not_Answered: 3,
  Wrong_Number: 1,
  Not_Interested: 2,
};

const DEFAULT_CALL_LOGS = [
  {
    id: "CALL-101",
    leadId: "LEAD-001",
    leadName: "John Doe",
    company: "TechCorp",
    phone: "+1 555-0199",
    outcome: "Converted",
    duration: 6,
    timestamp: "Today, 11:20 AM",
    notes: "Client agreed to a 50-seat trial demo next Tuesday.",
    followUpDate: null,
  },
  {
    id: "CALL-102",
    leadId: "LEAD-002",
    leadName: "Sarah Jenkins",
    company: "Apex Global",
    phone: "+1 555-0248",
    outcome: "Callback_Requested",
    duration: 2,
    timestamp: "Today, 10:45 AM",
    notes: "In meetings until Thursday afternoon. Requested callback at 3:00 PM.",
    followUpDate: "2026-09-22",
  },
  {
    id: "CALL-103",
    leadId: "LEAD-003",
    leadName: "Michael Chen",
    company: "CloudScale Systems",
    phone: "+1 555-0371",
    outcome: "Left_Voicemail",
    duration: 1,
    timestamp: "Today, 10:15 AM",
    notes: "Voicemail left detailing Q4 renewal incentives.",
    followUpDate: null,
  },
  {
    id: "CALL-104",
    leadId: "LEAD-004",
    leadName: "Amanda Brooks",
    company: "Vanguard Tech",
    phone: "+1 555-0482",
    outcome: "Answered",
    duration: 4,
    timestamp: "Today, 09:30 AM",
    notes: "Had quick conversation, requested brochure to review with CFO.",
    followUpDate: null,
  },
  {
    id: "CALL-105",
    leadId: "LEAD-005",
    leadName: "Robert Taylor",
    company: "Horizon Dynamics",
    phone: "+1 555-0599",
    outcome: "Callback_Requested",
    duration: 3,
    timestamp: "Yesterday, 4:10 PM",
    notes: "Requested technical spec sheet and callback on Friday morning.",
    followUpDate: "2026-09-20",
  },
];

const STORAGE_KEY = "leadpulse_exec_state_v2";

function getStoredState() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function saveState(state) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event("exec-store-updated"));
  } catch (err) {}
}

export function getExecutiveState() {
  const stored = getStoredState();
  if (stored) return stored;

  const initialState = {
    activeCampaign: MOCK_CALL_CAMPAIGN, // Default to call campaign
    activityCounts: { ...DEFAULT_ACTIVITY_COUNTS },
    callLogs: [...DEFAULT_CALL_LOGS],
    emailStats: {
      queued: 500,
      processing: 0,
      completed: 0,
      failed: 0,
    },
  };
  saveState(initialState);
  return initialState;
}

// Toggle between Call and Email campaign for dev testing
export function switchActiveCampaignType(type) {
  const current = getExecutiveState();
  current.activeCampaign =
    type === "email" ? MOCK_EMAIL_CAMPAIGN : MOCK_CALL_CAMPAIGN;
  saveState(current);
  return current;
}

// Record a new call remark (called from ExecutiveQueueView)
export function recordCallRemark({
  leadId,
  leadName,
  company,
  phone,
  outcome,
  durationMinutes,
  followUpDate,
  notes,
}) {
  const state = getExecutiveState();

  // 1. Increment outcome count
  if (state.activityCounts[outcome] !== undefined) {
    state.activityCounts[outcome] += 1;
  } else {
    state.activityCounts[outcome] = 1;
  }

  // 2. Create new log entry
  const newLog = {
    id: `CALL-${Date.now().toString().slice(-4)}`,
    leadId: leadId || `LEAD-${Date.now().toString().slice(-3)}`,
    leadName: leadName || "Contact Lead",
    company: company || "Corporate Inc.",
    phone: phone || "+1 555-0100",
    outcome,
    duration: Number(durationMinutes) || 1,
    timestamp: "Just now",
    followUpDate: followUpDate || null,
    notes: notes || "Call completed.",
  };

  state.callLogs = [newLog, ...state.callLogs];
  saveState(state);
  return state;
}

// Update email stats (called during batch dispatch)
export function updateEmailJobStats(patch) {
  const state = getExecutiveState();
  state.emailStats = {
    ...state.emailStats,
    ...patch,
  };
  saveState(state);
  return state;
}