"use client";

import { useState, useEffect } from "react";
import { Send, TrendingUp, Eye, MousePointerClick, Inbox, AlertCircle, Mail } from "lucide-react";
import api from "@/api/api";
import KpiCard from "@/components/shared/KpiCard";
import AvatarInitial from "@/components/shared/AvatarInitial";
import OutcomeBadge from "@/components/shared/OutcomeBadge";

export default function ExecutiveEmailView({ activeCampaign }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get(`/campaigns/${activeCampaign.id}/email-dashboard`);
      setData(res.data?.data || res.data);
    } catch (err) {
      console.error("Failed to fetch email dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeCampaign?.id) return;
    setLoading(true);
    fetchDashboard();
  }, [activeCampaign?.id]);

  useEffect(() => {
    if (!data?.job) return;
    const status = data.job.status;
    
    if (status === "Processing" || status === "Queued") {
      const interval = setInterval(() => {
        fetchDashboard();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [data?.job?.status]);

  const handleDispatch = async () => {
    if (!window.confirm("Are you sure you want to dispatch this email campaign?")) return;
    setDispatching(true);
    try {
      await api.post(`/campaigns/${activeCampaign.id}/dispatch-email`);
      fetchDashboard(); 
    } catch (err) {
      alert("Failed to dispatch emails");
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontWeight: "bold" }}>Loading Email Engine...</div>;
  }

  const job = data?.job;
  const logs = data?.logs || [];
  
  const totalJob = job?.totalEmails || 0;
  const processed = job?.processedEmails || 0;
  const progressPercent = totalJob > 0 ? Math.round((processed / totalJob) * 100) : 0;

  const totalDispatched = logs.length;
  const totalOpens = logs.reduce((acc, c) => acc + (Number(c.opens) || 0), 0);
  const totalClicks = logs.reduce((acc, c) => acc + (Number(c.clicks) || 0), 0);
  const openRate = totalDispatched > 0 ? ((totalOpens / totalDispatched) * 100).toFixed(1) : "0.0";
  const clickRate = totalDispatched > 0 ? ((totalClicks / totalDispatched) * 100).toFixed(1) : "0.0";
  const clickToOpen = totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(1) : "0.0";
  
  const unopened = logs.filter((c) => !c.opens || c.opens === 0).length;
  const bounced = logs.filter((c) => c.status === "bounced" || c.status === "spamreport").length;

  const emailFunnel = [
    { label: "Sent", color: "#6366f1", bg: "#ede9fe", count: totalDispatched },
    { label: "Opened", color: "#10b981", bg: "#d1fae5", count: totalOpens },
    { label: "Clicked", color: "#0ea5e9", bg: "#e0f2fe", count: totalClicks }
  ];

  const isDispatchDisabled = dispatching || job?.status === "Processing" || job?.status === "Queued" || job?.status === "Completed";
  const btnLabel = job?.status === "Processing" ? "Dispatching..." : job?.status === "Queued" ? "Queued..." : job?.status === "Completed" ? "Completed" : "Dispatch Emails";

  return (
    <div style={{ padding: "24px", width: "100%" }}>

      {/* ══ 1. DISPATCH CONTROL PANEL ══ */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", marginBottom: 24, overflow: "hidden" }}>

        {/* Gradient Hero Strip */}
        <div style={{
          background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 55%, #8b5cf6 100%)",
          padding: "18px 24px", position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "relative", flexWrap: "wrap" }}>

            {/* Left: icon + campaign name + client */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <Mail size={20} color="white" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "white", lineHeight: 1.2 }}>
                  {data?.campaign?.name}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2, fontWeight: 500 }}>
                  {data?.campaign?.clientName || activeCampaign?.clientName || "Email Sequence Drip"}
                </div>
              </div>
            </div>

            {/* Right: status pill + dispatch button */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                background: job?.status === "Processing" ? "rgba(59,130,246,0.35)" : job?.status === "Completed" ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.18)",
                border: `1px solid ${job?.status === "Processing" ? "rgba(59,130,246,0.5)" : job?.status === "Completed" ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.3)"}`,
                color: "white",
              }}>
                {job?.status || "Ready to Dispatch"}
              </span>

              <button
                onClick={handleDispatch}
                disabled={isDispatchDisabled}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 22px", borderRadius: 12,
                  fontWeight: 800, fontSize: 13, border: "none",
                  cursor: isDispatchDisabled ? "not-allowed" : "pointer",
                  background: isDispatchDisabled
                    ? "rgba(255,255,255,0.15)"
                    : "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
                  color: isDispatchDisabled ? "rgba(255,255,255,0.45)" : "white",
                  boxShadow: isDispatchDisabled ? "none" : "0 4px 14px rgba(124,58,237,0.5)",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                <Send size={15} />
                {btnLabel}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar Section */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <span style={{ color: "#475569" }}>Dispatch Progress</span>
            <span style={{ color: "#6366f1" }}>{progressPercent}%</span>
          </div>
          <div style={{ width: "100%", height: 12, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
            <div
              className={job?.status === "Processing" ? "animate-pulse" : ""}
              style={{
                height: "100%", borderRadius: 999,
                background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)",
                width: `${progressPercent}%`, transition: "width 1s ease-out"
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>
            <span>{job?.processedEmails || 0} of {job?.totalEmails || 0} processed</span>
            <span style={{ display: "flex", gap: 14 }}>
              <span style={{ color: "#10b981", fontWeight: 700 }}>✓ {job?.successfulSends || 0} sent</span>
              <span style={{ color: "#ef4444", fontWeight: 700 }}>✗ {job?.failedSends || 0} failed</span>
            </span>
          </div>
        </div>
      </div>

      {/* ══ 2. ANALYTICS OVERVIEW PANEL ══ */}
      <div style={{ background: "#fff", padding: "24px", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <TrendingUp size={15} color="#7c3aed" />
          <span style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Analytics Overview</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Primary KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <KpiCard label="Dispatched" value={totalDispatched} subtext="outreach emails" icon={<Send size={13} color="white" />} gradient="linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)" glow="rgba(2,132,199,0.35)" />
            <KpiCard label="Total Opens" value={totalOpens} badge={`📬 ${openRate}% Open Rate`} icon={<Eye size={13} color="white" />} gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)" glow="rgba(5,150,105,0.35)" />
            <KpiCard label="Total Clicks" value={totalClicks} badge={`🖱️ ${clickRate}% CTR`} icon={<MousePointerClick size={13} color="white" />} gradient="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" glow="rgba(124,58,237,0.35)" />
          </div>

          {/* Secondary Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div className="lp-stat-card" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #bbf7d0" }}>
              <div>
                <div className="lp-stat-label" style={{ color: "#16a34a" }}>Click-to-Open</div>
                <div className="lp-stat-value" style={{ color: "#14532d" }}>{clickToOpen}%</div>
              </div>
              <div className="lp-stat-icon-box" style={{ background: "#bbf7d0" }}><TrendingUp size={16} color="#16a34a" /></div>
            </div>
            <div className="lp-stat-card" style={{ background: "linear-gradient(135deg, #fff7ed, #ffedd5)", border: "1px solid #fed7aa" }}>
              <div>
                <div className="lp-stat-label" style={{ color: "#c2410c" }}>Unopened</div>
                <div className="lp-stat-value" style={{ color: "#7c2d12" }}>{unopened}</div>
              </div>
              <div className="lp-stat-icon-box" style={{ background: "#fed7aa" }}><Inbox size={16} color="#c2410c" /></div>
            </div>
            <div className="lp-stat-card" style={{ background: "linear-gradient(135deg, #fef2f2, #fee2e2)", border: "1px solid #fecaca" }}>
              <div>
                <div className="lp-stat-label" style={{ color: "#b91c1c" }}>Bounced / Failed</div>
                <div className="lp-stat-value" style={{ color: "#7f1d1d" }}>{bounced}</div>
              </div>
              <div className="lp-stat-icon-box" style={{ background: "#fecaca" }}><AlertCircle size={16} color="#b91c1c" /></div>
            </div>
          </div>

          {/* Email Funnel Bar */}
          {totalDispatched > 0 && (
            <div className="lp-breakdown-card">
              <div className="lp-breakdown-header">
                <span className="lp-breakdown-title">Email Funnel</span>
                <span className="lp-breakdown-count">{totalDispatched} emails total</span>
              </div>
              {emailFunnel.map((seg) => (
                <div key={seg.label} className="lp-bar-row">
                  <span className="lp-bar-label">{seg.label}</span>
                  <div className="lp-bar-track">
                    <div className="lp-bar-fill" style={{ width: totalDispatched > 0 ? `${(seg.count / totalDispatched) * 100}%` : "0%", background: seg.color }} />
                  </div>
                  <span className="lp-bar-badge" style={{ background: seg.bg, color: seg.color }}>{seg.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ 3. ENGAGEMENT LOG PANEL ══ */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", overflow: "hidden" }}>

        {/* Panel Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Eye size={15} color="#0ea5e9" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Engagement Log</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, padding: "2px 10px", borderRadius: 20, background: "#e0f2fe", color: "#0284c7" }}>
            {logs.length} records
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="lp-empty-state" style={{ margin: "32px auto", maxWidth: 340 }}>
            <div className="lp-empty-icon-wrap" style={{ background: "#e0f2fe" }}>
              <Send size={20} color="#0ea5e9" />
            </div>
            <div className="lp-empty-title">No engagements yet</div>
            <p className="lp-empty-desc">
              Hit <strong>Dispatch Emails</strong> above to send this campaign. Recipient open and click events will appear here in real time.
            </p>
          </div>
        ) : (
          <table className="lp-log-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th className="center">Status</th>
                <th className="center">Opens</th>
                <th className="center">Clicks</th>
                <th>Sent At</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((detail, i) => (
                <tr key={detail.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <AvatarInitial name={detail.firstName || detail.lastName || detail.email} index={i} />
                      <div>
                        <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 12 }}>
                          {detail.firstName || detail.lastName ? `${detail.firstName || ""} ${detail.lastName || ""}`.trim() : detail.email}
                        </div>
                        {(detail.firstName || detail.lastName) && (
                          <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace", marginTop: 2 }}>{detail.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="center" style={{ whiteSpace: "nowrap" }}>
                    <OutcomeBadge type="emailStatus" value={detail.status} />
                  </td>
                  <td className="center" style={{ whiteSpace: "nowrap" }}>
                    {detail.opens > 0
                      ? <span className="lp-metric-chip lp-metric-chip-green"><Eye size={10} />{detail.opens}</span>
                      : <span style={{ color: "#cbd5e1", fontFamily: "monospace", fontSize: 11 }}>—</span>}
                  </td>
                  <td className="center" style={{ whiteSpace: "nowrap" }}>
                    {detail.clicks > 0
                      ? <span className="lp-metric-chip lp-metric-chip-blue"><MousePointerClick size={10} />{detail.clicks}</span>
                      : <span style={{ color: "#cbd5e1", fontFamily: "monospace", fontSize: 11 }}>—</span>}
                  </td>
                  <td style={{ fontSize: 11, fontFamily: "monospace", color: "#64748b", whiteSpace: "nowrap" }}>
                    {detail.sentAt ? new Date(detail.sentAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
