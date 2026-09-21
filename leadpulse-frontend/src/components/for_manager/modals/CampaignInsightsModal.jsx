"use client";
import {
  PhoneCall,
  Mail,
  Clock,
  TrendingUp,
  Eye,
  UserCheck,
  MousePointerClick,
  Inbox
} from "lucide-react";
import KpiCard from "@/components/shared/KpiCard";
import AvatarInitial from "@/components/shared/AvatarInitial";
import OutcomeBadge from "@/components/shared/OutcomeBadge";

// ─────────────────────────────────────────────────────────────
// CampaignInsightsModal
//
// Props:
//   campaign    {object}   - the selected campaign row object
//   details     {array}    - array of call-remarks or email-engagement records
//   activeTab   {string}   - "analytics" | "log"
//   setTab      {function} - setter to switch tabs (lives in ManagerCampaigns)
// ─────────────────────────────────────────────────────────────
export default function CampaignInsightsModal({ campaign, details = [], activeTab, setTab }) {
  const isCall = campaign.type === "Cold Call Blitz" || campaign.type === "call";
  const total = campaign.executives.length;
  const dettotal = details.length;

  // ── Call Metrics ────────────────────────────────────────────
  const converted = details.filter((c) => c.callOutcome?.toLowerCase() === "converted").length;
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
  const totalTalkTime = details.reduce((acc, c) => acc + (Number(c.callDurationMinutes) || 0), 0);
  const avgTalkTime = total > 0 ? (totalTalkTime / total).toFixed(1) : "0";

  const callbackCalls = details.filter((c) => {
    const oc = (c.callOutcome || "").toLowerCase();
    return oc.includes("callback") || oc.includes("follow") || oc.includes("scheduled");
  }).length;

  const notReachedCalls = details.filter((c) => {
    const oc = (c.callOutcome || "").toLowerCase();
    return oc.includes("busy") || oc.includes("voicemail") || oc.includes("no_answer");
  }).length;

  const rejectedCalls = details.filter((c) => {
    const oc = (c.callOutcome || "").toLowerCase();
    return oc.includes("rejected") || oc.includes("declined") || oc.includes("wrong");
  }).length;

  // ── Email Metrics ────────────────────────────────────────────
  const totalOpens = details.reduce((acc, c) => acc + (Number(c.opens) || 0), 0);
  const totalClicks = details.reduce((acc, c) => acc + (Number(c.clicks) || 0), 0);
  const openRate = total > 0 ? ((totalOpens / total) * 100).toFixed(1) : "0.0";
  const clickRate = total > 0 ? ((totalClicks / total) * 100).toFixed(1) : "0.0";
  const clickToOpen = totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(1) : "0.0";
  const unopened = details.filter((c) => !c.opens || c.opens === 0).length;

  // ── Reusable breakdown bar data ──────────────────────────────
  const callBreakdown = [
    { label: "Converted", color: "#10b981", bg: "#d1fae5", count: converted },
    { label: "Callback", color: "#0ea5e9", bg: "#e0f2fe", count: callbackCalls },
    { label: "No Answer", color: "#f59e0b", bg: "#fef3c7", count: notReachedCalls },
    { label: "Rejected", color: "#ef4444", bg: "#fee2e2", count: rejectedCalls }
  ];

  const emailFunnel = [
    { label: "Sent", color: "#6366f1", bg: "#ede9fe", count: total },
    { label: "Opened", color: "#10b981", bg: "#d1fae5", count: totalOpens },
    { label: "Clicked", color: "#0ea5e9", bg: "#e0f2fe", count: totalClicks }
  ];

  return (
    <>
      {/* ══ HERO GRADIENT HEADER ════════════════════════════════ */}
      <div
        className="lp-insights-hero"
        style={{
          background: isCall
            ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)"
            : "linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%)"
        }}
      >
        <div className="lp-insights-hero-blob-1" />
        <div className="lp-insights-hero-blob-2" />

        <div className="lp-insights-hero-inner">
          {/* Left: icon + name + meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="lp-insights-channel-icon">
              {isCall ? <PhoneCall size={22} color="white" /> : <Mail size={22} color="white" />}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h3 className="lp-insights-campaign-name">
                  {campaign.name || `Campaign #${campaign.id.substring(0, 6)}`}
                </h3>
                <span className="lp-insights-campaign-id">#{campaign.id.substring(0, 8)}</span>
              </div>

              <div className="lp-insights-meta">
                <span className="lp-insights-meta-text">
                  Client:{" "}
                  <strong style={{ color: "white" }}>{campaign.clientName || "Unassigned"}</strong>
                </span>
                {campaign.status && (
                  <span
                    className="lp-insights-status-pill"
                    style={{
                      background:
                        campaign.status === "Active"
                          ? "rgba(16,185,129,0.25)"
                          : "rgba(251,191,36,0.25)",
                      borderColor:
                        campaign.status === "Active"
                          ? "rgba(16,185,129,0.5)"
                          : "rgba(251,191,36,0.5)",
                      color: campaign.status === "Active" ? "#6ee7b7" : "#fde68a"
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: campaign.status === "Active" ? "#34d399" : "#fbbf24"
                      }}
                      className={campaign.status === "Active" ? "lp-pulse" : ""}
                    />
                    {campaign.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: type tag */}
          <div className="lp-insights-type-tag">
            {isCall ? <PhoneCall size={12} /> : <Mail size={12} />}
            {campaign.type}
          </div>
        </div>
      </div>

      {/* ══ TAB NAV ═════════════════════════════════════════════ */}
      <div className="lp-tab-nav">
        {[
          {
            key: "analytics",
            label: "Analytics Overview",
            icon: <TrendingUp size={13} />
          },
          {
            key: "log",
            label: isCall ? "Call Log" : "Engagement Log",
            icon: isCall ? <PhoneCall size={13} /> : <Eye size={13} />
          },
          {
            key: "executive",
            label: "Executives Data",
            icon: <UserCheck size={13} />
          }
        ].map((tab) => (
          <button
            key={tab.key}
            className={`lp-tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
            {tab.key === "executive" && <span className="lp-tab-count">{total}</span> || tab.key === "log" && <span className="lp-tab-count">{dettotal}</span>}
            
          </button>
        ))}
      </div>

      {/* ══ TAB CONTENT ═════════════════════════════════════════ */}
      <div className="lp-tab-panel">
        {/* ── ANALYTICS TAB ─────────────────────────────────── */}
        {activeTab === "analytics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* KPI Cards grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12
              }}
            >
              {isCall ? (
                <>
                  <KpiCard
                    label="Total Calls"
                    value={total}
                    subtext="logged activities"
                    icon={<PhoneCall size={13} color="white" />}
                    gradient="linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
                    glow="rgba(79,70,229,0.35)"
                  />
                  <KpiCard
                    label="Converted"
                    value={converted}
                    badge={`🏆 ${conversionRate}% Win Rate`}
                    icon={<TrendingUp size={13} color="white" />}
                    gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
                    glow="rgba(5,150,105,0.35)"
                  />
                  <KpiCard
                    label="Talk Time"
                    value={totalTalkTime}
                    valueUnit="m"
                    subtext={`~${avgTalkTime}m avg/call`}
                    icon={<Clock size={13} color="white" />}
                    gradient="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
                    glow="rgba(124,58,237,0.35)"
                  />
                </>
              ) : (
                <>
                  <KpiCard
                    label="Dispatched"
                    value={total}
                    subtext="outreach emails"
                    icon={<Mail size={13} color="white" />}
                    gradient="linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)"
                    glow="rgba(2,132,199,0.35)"
                  />
                  <KpiCard
                    label="Total Opens"
                    value={totalOpens}
                    badge={`📬 ${openRate}% Open Rate`}
                    icon={<Eye size={13} color="white" />}
                    gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
                    glow="rgba(5,150,105,0.35)"
                  />
                  <KpiCard
                    label="Total Clicks"
                    value={totalClicks}
                    badge={`🖱️ ${clickRate}% CTR`}
                    icon={<MousePointerClick size={13} color="white" />}
                    gradient="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
                    glow="rgba(124,58,237,0.35)"
                  />
                </>
              )}
            </div>

            {/* Secondary stat row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12
              }}
            >
              {isCall ? (
                <>
                  {/* Callbacks */}
                  <div
                    className="lp-stat-card"
                    style={{
                      background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                      border: "1px solid #bae6fd"
                    }}
                  >
                    <div>
                      <div className="lp-stat-label" style={{ color: "#0284c7" }}>
                        Callbacks / Follow-ups
                      </div>
                      <div className="lp-stat-value" style={{ color: "#075985" }}>
                        {callbackCalls}
                      </div>
                    </div>
                    <div className="lp-stat-icon-box" style={{ background: "#bae6fd" }}>
                      <PhoneCall size={16} color="#0284c7" />
                    </div>
                  </div>

                  {/* Not Reached */}
                  <div
                    className="lp-stat-card"
                    style={{
                      background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                      border: "1px solid #fed7aa"
                    }}
                  >
                    <div>
                      <div className="lp-stat-label" style={{ color: "#c2410c" }}>
                        Not Reached
                      </div>
                      <div className="lp-stat-value" style={{ color: "#7c2d12" }}>
                        {notReachedCalls}
                      </div>
                    </div>
                    <div className="lp-stat-icon-box" style={{ background: "#fed7aa" }}>
                      <Clock size={16} color="#c2410c" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Click-to-Open Rate */}
                  <div
                    className="lp-stat-card"
                    style={{
                      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                      border: "1px solid #bbf7d0"
                    }}
                  >
                    <div>
                      <div className="lp-stat-label" style={{ color: "#16a34a" }}>
                        Click-to-Open Rate
                      </div>
                      <div className="lp-stat-value" style={{ color: "#14532d" }}>
                        {clickToOpen}%
                      </div>
                    </div>
                    <div className="lp-stat-icon-box" style={{ background: "#bbf7d0" }}>
                      <TrendingUp size={16} color="#16a34a" />
                    </div>
                  </div>

                  {/* Unopened */}
                  <div
                    className="lp-stat-card"
                    style={{
                      background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                      border: "1px solid #fed7aa"
                    }}
                  >
                    <div>
                      <div className="lp-stat-label" style={{ color: "#c2410c" }}>
                        Unopened
                      </div>
                      <div className="lp-stat-value" style={{ color: "#7c2d12" }}>
                        {unopened}
                      </div>
                    </div>
                    <div className="lp-stat-icon-box" style={{ background: "#fed7aa" }}>
                      <Inbox size={16} color="#c2410c" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Breakdown bar chart */}
            {total > 0 && (
              <div className="lp-breakdown-card">
                <div className="lp-breakdown-header">
                  <span className="lp-breakdown-title">
                    {isCall ? "Outcome Breakdown" : "Email Funnel"}
                  </span>
                  <span className="lp-breakdown-count">
                    {total} {isCall ? "calls" : "emails"} total
                  </span>
                </div>

                {(isCall ? callBreakdown : emailFunnel).map((seg) => (
                  <div key={seg.label} className="lp-bar-row">
                    <span className="lp-bar-label">{seg.label}</span>
                    <div className="lp-bar-track">
                      <div
                        className="lp-bar-fill"
                        style={{
                          width: total > 0 ? `${(seg.count / total) * 100}%` : "0%",
                          background: seg.color
                        }}
                      />
                    </div>
                    <span className="lp-bar-badge" style={{ background: seg.bg, color: seg.color }}>
                      {seg.count}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Empty analytics state */}
            {total === 0 && (
              <div className="lp-empty-state">
                <div className="lp-empty-icon-wrap">
                  <Inbox size={22} color="#7c3aed" />
                </div>
                <div className="lp-empty-title">No data to analyze yet</div>
                <p className="lp-empty-desc">
                  {isCall
                    ? "Call logs from your sales reps will appear here once they start logging activities."
                    : "Email engagement events will show up once the campaign dispatches emails."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── LOG TAB ───────────────────────────────────────── */}
        {activeTab === "log" && (
          <>
            {total === 0 ? (
              <div className="lp-empty-state">
                <div className="lp-empty-icon-wrap">
                  <Inbox size={22} color="#7c3aed" />
                </div>
                <div className="lp-empty-title">No Records Found</div>
                <p className="lp-empty-desc">
                  {isCall
                    ? "When sales reps log calls, they will appear here."
                    : "Recipient email events will appear here once active."}
                </p>
              </div>
            ) : (
              <div className="lp-log-table-wrap">
                <table className="lp-log-table">
                  <thead>
                    <tr>
                      {isCall ? (
                        <>
                          <th>Outcome</th>
                          <th>Duration</th>
                          <th>Notes</th>
                        </>
                      ) : (
                        <>
                          <th>Recipient</th>
                          <th className="center">Status</th>
                          <th className="center">Opens</th>
                          <th className="center">Clicks</th>
                          <th>Sent At</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((detail, i) => (
                      <tr key={i}>
                        {isCall ? (
                          <>
                            {/* Outcome badge */}
                            <td style={{ whiteSpace: "nowrap" }}>
                              <OutcomeBadge type="outcome" value={detail.callOutcome} />
                            </td>

                            {/* Duration */}
                            <td style={{ whiteSpace: "nowrap" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  fontFamily: "monospace",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#475569"
                                }}
                              >
                                <Clock size={11} color="#94a3b8" />
                                {detail.callDurationMinutes
                                  ? `${detail.callDurationMinutes}m`
                                  : "—"}
                              </span>
                            </td>

                            {/* Notes */}
                            <td>
                              {detail.notes ? (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "#334155",
                                    lineHeight: 1.4
                                  }}
                                >
                                  {detail.notes}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "#94a3b8",
                                    fontStyle: "italic"
                                  }}
                                >
                                  No notes recorded
                                </span>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Recipient with avatar */}
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 9
                                }}
                              >
                                <AvatarInitial
                                  name={detail.firstName || detail.lastName || detail.email}
                                  index={i}
                                />
                                <div>
                                  <div
                                    style={{
                                      fontWeight: 700,
                                      color: "#1e293b",
                                      fontSize: 12
                                    }}
                                  >
                                    {detail.firstName || detail.lastName
                                      ? `${detail.firstName || ""} ${detail.lastName || ""}`.trim()
                                      : detail.email}
                                  </div>
                                  {(detail.firstName || detail.lastName) && (
                                    <div
                                      style={{
                                        fontSize: 10,
                                        color: "#94a3b8",
                                        fontFamily: "monospace"
                                      }}
                                    >
                                      {detail.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Email status badge */}
                            <td className="center" style={{ whiteSpace: "nowrap" }}>
                              <OutcomeBadge type="emailStatus" value={detail.status} />
                            </td>

                            {/* Opens chip */}
                            <td className="center" style={{ whiteSpace: "nowrap" }}>
                              {detail.opens > 0 ? (
                                <span className="lp-metric-chip lp-metric-chip-green">
                                  <Eye size={10} />
                                  {detail.opens}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    color: "#cbd5e1",
                                    fontFamily: "monospace",
                                    fontSize: 11
                                  }}
                                >
                                  —
                                </span>
                              )}
                            </td>

                            {/* Clicks chip */}
                            <td className="center" style={{ whiteSpace: "nowrap" }}>
                              {detail.clicks > 0 ? (
                                <span className="lp-metric-chip lp-metric-chip-blue">
                                  <MousePointerClick size={10} />
                                  {detail.clicks}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    color: "#cbd5e1",
                                    fontFamily: "monospace",
                                    fontSize: 11
                                  }}
                                >
                                  —
                                </span>
                              )}
                            </td>

                            {/* Sent timestamp */}
                            <td
                              style={{
                                fontSize: 11,
                                fontFamily: "monospace",
                                color: "#64748b",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {detail.sentAt
                                ? new Date(detail.sentAt).toLocaleString([], {
                                    dateStyle: "short",
                                    timeStyle: "short"
                                  })
                                : "—"}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Exec data TAB ───────────────────────────────────────── */}
        {activeTab === "executive" && (
          <>
            {total === 0 ? (
              <div className="lp-empty-state">
                <div className="lp-empty-icon-wrap">
                  <Inbox size={22} color="#7c3aed" />
                </div>
                <div className="lp-empty-title">No Records Found</div>
                <p className="lp-empty-desc">
                  Data of Executives assigned to this campaign will appear here.
                </p>
              </div>
            ) : (
              <div className="lp-log-table-wrap">
                <table className="lp-log-table">
                  <thead>
                    <tr>
                      <>
                        <th>S.NO.</th>
                        <th>Executive</th>
                        <th className="center">Status</th>
                        <th>Assigned At</th>
                      </>
                    </tr>
                  </thead>
                  <tbody>
                    {campaign.executives.map((detail, i) => (
                      <tr key={i}>
                        <>
                          {/* Recipient with avatar */}
                          <td>{i + 1}</td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 9
                              }}
                            >
                              <AvatarInitial name={detail.name || detail.email} index={i} />
                              <div>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    color: "#1e293b",
                                    fontSize: 12
                                  }}
                                >
                                  {detail.name ? `${detail.name}`.trim() : detail.email}
                                </div>
                                {detail.name && (
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: "#94a3b8",
                                      fontFamily: "monospace"
                                    }}
                                  >
                                    {detail.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Email status badge */}
                          <td className="center" style={{ whiteSpace: "nowrap" }}>
                            <OutcomeBadge type="emailStatus" value={detail.status} />
                          </td>

                          {/* Exec Assigned at */}
                          <td
                            style={{
                              fontSize: 13,
                              fontFamily: "monospace",
                              color: "#64748b",
                              whiteSpace: "nowrap"
                            }}
                          >
                            <span>
                              {detail.assignedat
                                ? new Date(detail.assignedat).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })
                                : "Not assigned yet"}
                            </span>
                          </td>
                        </>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
