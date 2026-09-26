"use client";

import { useEffect, useState, useMemo } from "react";
import { Megaphone, Phone, Hourglass, Play, DollarSign, CheckCircle2 } from "lucide-react";
import { getExecutivePerformance } from "@/lib/dashboards";
import ExecutiveSpeedometer from "@/components/for_executive/ExecutiveSpeedometer";
import ExecutiveEmailView from "@/components/for_executive/ExecutiveEmailView";
import { getExecutiveState, CALL_OUTCOMES } from "@/lib/executiveStore";

export default function ExecutiveDashboardView({ activeCampaign, onStartCalling, onNavigateTab }) {
  const [storeState, setStoreState] = useState(getExecutiveState());
  const [loading, setLoading] = useState(false);

  const [backendPerf, setBackendPerf] = useState(null);

  // Backend Integration Point: GET /dashboards/exec-performance (Endpoint #49)
  useEffect(() => {
    let isMounted = true;
    async function loadPerformance() {
      try {
        const data = await getExecutivePerformance();
        if (data && isMounted) {
          setBackendPerf(data);
        }
      } catch (err) {
        // Backend offline; fallback to local reactive store
      }
    }
    loadPerformance();
    return () => {
      isMounted = false;
    };
  }, []);

  const campaign = activeCampaign || storeState.activeCampaign;
  const isEmailCampaign = campaign?.campaign_type === "email";

  // Calculate total completed calls from activity counts or backend
  // 🚀 Dynamically tally the outcomes from the backend callLogs array!
  // 1. Ultra-safe Activity Counts
  const activityCounts = useMemo(() => {
    const counts = {};

    if (backendPerf && Array.isArray(backendPerf.callLogs)) {
      backendPerf.callLogs.forEach((log) => {
        if (!log || !log.outcome) return;

        const key = log.outcome;
        counts[key] = (counts[key] || 0) + 1;
      });
      return counts; // Make sure this return is here!
    }

    // Safe fallback using optional chaining
    return storeState?.activityCounts || {};
  }, [backendPerf, storeState]);

  // 2. Ultra-safe Total Calls Completed
  const totalCallsCompleted = useMemo(() => {
    if (backendPerf?.totalCalls != null) return backendPerf.totalCalls;

    // Safety net: force it to an empty object if activityCounts is somehow still undefined
    const safeCounts = activityCounts || {};

    return CALL_OUTCOMES.reduce((sum, key) => sum + (safeCounts[key] || 0), 0);
  }, [backendPerf, activityCounts]);

  const targetLeads = (backendPerf?.pendingQueueSize || 0) + (backendPerf?.totalCalls || 0);
  const pendingQueue =
    backendPerf?.pendingQueueSize ?? Math.max(0, targetLeads - totalCallsCompleted);

  // If email campaign, render dedicated email panel in dashboard viewMode
  if (isEmailCampaign) {
    return (
      <ExecutiveEmailView
        activeCampaign={campaign}
        viewMode="dashboard"
        onNavigateTab={onNavigateTab}
      />
    );
  }

  // Otherwise, render dedicated CALL panel with Speedometer & VIBGYOR Summary
  return (
    <div className="exec-dashboard-content">
      {/* Top 3 Metric Cards for Call Executive */}
      <div className="exec-metrics-row">
        {/* Card 1: ASSIGNED CALL CAMPAIGN */}
        <div className="exec-metric-card">
          <div className="exec-metric-icon-wrap bg-blue-500 text-white">
            <Megaphone size={24} />
          </div>
          <div className="exec-metric-info">
            <span className="exec-metric-title">TARGET CALL QUEUE</span>
            <span className="exec-metric-value">{targetLeads} Leads</span>
          </div>
        </div>

        {/* Card 2: CALLS LOGGED TODAY */}
        <div className="exec-metric-card">
          <div className="exec-metric-icon-wrap bg-emerald-500 text-white">
            <Phone size={24} />
          </div>
          <div className="exec-metric-info">
            <span className="exec-metric-title">CALLS LOGGED TODAY</span>
            <span className="exec-metric-value">{totalCallsCompleted}</span>
          </div>
        </div>

        {/* Card 3: PENDING QUEUE */}
        <div className="exec-metric-card">
          <div className="exec-metric-icon-wrap bg-purple-500 text-white">
            <Hourglass size={24} />
          </div>
          <div className="exec-metric-info">
            <span className="exec-metric-title">PENDING IN QUEUE</span>
            <span className="exec-metric-value">{pendingQueue}</span>
          </div>
        </div>
      </div>

      {/* Speedometer Gauge & VIBGYOR Activity Summary matching mockup */}
      <ExecutiveSpeedometer
        completedCount={totalCallsCompleted}
        totalTarget={targetLeads}
        activityCounts={activityCounts}
      />

      {/* Single Assigned Call Campaign Panel */}
      {campaign?.isUnassigned && (
        <div style={{
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: 12,
          padding: "14px 20px",
          marginBottom: 16,
          color: "#92400e",
          fontSize: 14,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <Megaphone size={18} />
          You are currently unassigned. Showing data from your last assigned campaign.
        </div>
      )}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          overflow: "hidden",
          opacity: campaign?.isUnassigned ? 0.7 : 1
        }}
      >
        {/* Gradient Header Strip */}
        <div
          style={{
            background: "linear-gradient(135deg, #75787c 0%, #847fc4 55%, #878688 100%)",
            padding: "16px 22px",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -16,
              right: -16,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
              pointerEvents: "none"
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              gap: 12
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.18)",
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <Phone size={18} color="white" />
              </div>
              <span
                style={{ fontSize: 13, fontWeight: 900, color: "white", letterSpacing: "0.04em" }}
              >
                MY ASSIGNED CALL CAMPAIGN
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: "3px 12px",
                borderRadius: 20,
                background: "rgba(16,185,129,0.3)",
                border: "1px solid rgba(16,185,129,0.5)",
                color: "#6ee7b7"
              }}
            >
              ● Active Assignment
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div
          style={{
            padding: "20px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap"
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 900,
                color: "#0f172a",
                letterSpacing: "-0.3px"
              }}
            >
              {campaign.name}
            </h4>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 12,
                color: "#64748b",
                lineHeight: 1.5,
                maxWidth: 480
              }}
            >
              {campaign.description || "B2B cold outreach sequence targeting technical leadership."}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 12,
                flexWrap: "wrap"
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: "#f1f5f9",
                  color: "#475569",
                  padding: "3px 10px",
                  borderRadius: 8,
                  fontFamily: "monospace"
                }}
              >
                ID: {campaign.id?.substring(0, 12)}...
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  padding: "3px 10px",
                  borderRadius: 8,
                  border: "1px solid #bfdbfe"
                }}
              >
                {targetLeads} Contacts in Queue
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={campaign?.isUnassigned}
            onClick={() => onStartCalling(campaign)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "13px 28px",
              borderRadius: 12,
              border: "none",
              cursor: campaign?.isUnassigned ? "not-allowed" : "pointer",
              background: campaign?.isUnassigned ? "#94a3b8" : "linear-gradient(135deg, #0066ff 0%, #7c3aed 100%)",
              color: "white",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: "0.03em",
              boxShadow: campaign?.isUnassigned ? "none" : "0 4px 16px rgba(0,102,255,0.35)",
              whiteSpace: "nowrap",
              transition: "all 0.2s"
            }}
          >
            <Play size={15} fill="white" />
            START CALLING QUEUE
          </button>
        </div>
      </div>
    </div>
  );
}
