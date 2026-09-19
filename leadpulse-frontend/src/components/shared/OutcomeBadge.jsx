"use client";

/**
 * OutcomeBadge — Colored pill badge for call outcomes and email statuses
 *
 * Props:
 *   type     {"outcome"|"emailStatus"}  - which color logic to apply
 *   value    {string}                   - the raw value from backend
 */

// ── Call outcome classification ───────────────────────────────
function getOutcomeClass(oc) {
  const v = (oc || "").toLowerCase();
  if (v === "converted" || v === "interested") return "lp-outcome-converted";
  if (v.includes("callback") || v.includes("follow") || v.includes("scheduled"))
    return "lp-outcome-callback";
  if (v.includes("busy") || v.includes("voicemail") || v.includes("no_answer"))
    return "lp-outcome-notreached";
  if (v.includes("rejected") || v.includes("declined") || v.includes("wrong"))
    return "lp-outcome-rejected";
  return "lp-outcome-default";
}

// ── Email delivery status classification ──────────────────────
function getEmailStatusClass(st) {
  const v = (st || "").toLowerCase();
  if (v === "delivered" || v === "sent") return "lp-status-sent";
  if (v === "bounced"   || v === "failed") return "lp-status-bounced";
  return "lp-status-default";
}

export default function OutcomeBadge({ type = "outcome", value = "" }) {
  const cls =
    type === "emailStatus"
      ? getEmailStatusClass(value)
      : getOutcomeClass(value);

  return (
    <span className={`lp-outcome-badge ${cls}`}>
      <span className="lp-outcome-dot" />
      {value || "Unknown"}
    </span>
  );
}
