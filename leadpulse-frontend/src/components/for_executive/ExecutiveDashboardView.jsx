"use client";

import { useEffect, useState, useMemo } from "react";
import { Megaphone, Phone, Hourglass, Play, DollarSign, CheckCircle2 } from "lucide-react";
import { getExecutivePerformance } from "@/lib/dashboards";
import ExecutiveMotivationWidget from "@/components/for_executive/ExecutiveMotivationWidget";
import ExecutiveSpeedometer from "@/components/for_executive/ExecutiveSpeedometer";
import ExecutiveEmailView from "@/components/for_executive/ExecutiveEmailView";
import { getExecutiveState, CALL_OUTCOMES } from "@/lib/executiveStore";

export default function ExecutiveDashboardView({
  activeCampaign,
  onStartCalling,
  onNavigateTab,
}) {
  const [storeState, setStoreState] = useState(getExecutiveState());
  const [loading, setLoading] = useState(false);

  // Listen for local store updates (e.g. from queue submits)
  useEffect(() => {
    const handleUpdate = () => {
      setStoreState(getExecutiveState());
    };
    window.addEventListener("exec-store-updated", handleUpdate);
    return () => window.removeEventListener("exec-store-updated", handleUpdate);
  }, []);

  const [backendPerf, setBackendPerf] = useState(null);

  // Backend Integration Point: GET /dashboards/exec-performance (Endpoint #49)
  useEffect(() => {
    let isMounted = true;
    async function loadPerformance() {
      try {
        const data = await getExecutivePerformance();
        if (data && isMounted) {
          console.log(data)
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
  const activityCounts = storeState.activityCounts || {};
  const totalCallsCompleted = useMemo(() => {
    if (backendPerf?.totalCalls != null) return backendPerf.totalCalls;
    return CALL_OUTCOMES.reduce((sum, key) => sum + (activityCounts[key] || 0), 0);
  }, [backendPerf, activityCounts]);

  const targetLeads = (backendPerf?.pendingQueueSize || 0) + (backendPerf?.totalCalls || 0);
  const pendingQueue = backendPerf?.pendingQueueSize ?? Math.max(0, targetLeads - totalCallsCompleted);

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
      <div className="exec-card-panel">
        <div className="exec-card-header">
          <div className="flex items-center gap-2 text-blue-600">
            <Phone size={18} className="fill-current" />
            <h3 className="exec-card-title text-blue-700">MY ASSIGNED CALL CAMPAIGN</h3>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Active Assignment
          </span>
        </div>

        <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-extrabold text-slate-900">{campaign.name}</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              {campaign.description || "B2B cold outreach sequence targeting technical leadership."}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-600">
              <span>Campaign ID: <strong className="font-mono text-slate-800">{campaign.id}</strong></span>
              <span>&bull;</span>
              <span>Queue Size: <strong className="text-slate-800">{targetLeads} Contacts</strong></span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStartCalling(campaign)}
            className="exec-btn exec-btn-blue text-sm py-2.5 px-6 shadow-md"
          >
            <Play size={16} className="fill-current" />
            <span>START CALLING QUEUE</span>
          </button>
        </div>
      </div>
    </div>
  );
}

