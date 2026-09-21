"use client";

import { useEffect, useState } from "react";
import ScaleMetricCard from "@/components/for_client/ScaleMetricCard";
import { getClientPortal } from "@/lib/dashboards";
import { PhoneCall, Mail, Layers, CheckCircle2, PieChart, DollarSign } from "lucide-react";

/*
===============================================================================
MOCK DATA FOR DEVELOPMENT
===============================================================================
*/
const MOCK_CLIENT_STATS = {
  totalConversion: "1,428",
  totalCost: "$48,250",
  conversionRate: "15.4%",
  totalCalls: 4820,
  totalEmails: 24680,
  activeCampaigns: 12,
  completedCampaigns: 28,
  totalCampaigns: 40,
};

export default function DashboardView() {
  const [stats, setStats] = useState(MOCK_CLIENT_STATS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    /*
    ===========================================================================
    BACKEND INTEGRATION POINT: GET /dashboards/client-portal (Axios)
    ===========================================================================
    */
    async function fetchDashboardStats() {
      setLoading(true);
      try {
        const data = await getClientPortal();
        if (data && isMounted) {
          setStats({
            totalConversion: data.totalConversion !== undefined ? data.totalConversion.toLocaleString() : MOCK_CLIENT_STATS.totalConversion,
            totalCost: data.totalCost !== undefined ? (typeof data.totalCost === "number" ? `$${data.totalCost.toLocaleString()}` : data.totalCost) : MOCK_CLIENT_STATS.totalCost,
            conversionRate: data.conversionRate !== undefined ? `${data.conversionRate}%` : MOCK_CLIENT_STATS.conversionRate,
            totalCalls: data.totalCalls !== undefined ? data.totalCalls : MOCK_CLIENT_STATS.totalCalls,
            totalEmails: data.totalEmails !== undefined ? data.totalEmails : MOCK_CLIENT_STATS.totalEmails,
            activeCampaigns: data.activeCampaigns !== undefined ? data.activeCampaigns : MOCK_CLIENT_STATS.activeCampaigns,
            completedCampaigns: data.completedCampaigns !== undefined ? data.completedCampaigns : MOCK_CLIENT_STATS.completedCampaigns,
            totalCampaigns: data.totalCampaigns !== undefined ? data.totalCampaigns : MOCK_CLIENT_STATS.totalCampaigns,
          });
        }
      } catch (err) {
        // Fallback gracefully to mock data for development
        if (isMounted) {
          setStats(MOCK_CLIENT_STATS);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboardStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="client-dashboard-page">
      {/* Top Header */}
      <div className="client-main-header">
        <div className="client-main-header-info">
          <h2 className="client-page-title">Client Dashboard Overview</h2>
          <p className="client-page-subtitle">
            Performance analytics, engagement channels, and campaign metrics
          </p>
        </div>
      </div>

      {/* Top Row: 3 Scale-Up Version Metric Cards */}
      <div className="client-top-metrics-row">
        <ScaleMetricCard
          title="Total Conversion"
          value={stats.totalConversion}
          subtitle="Total verified client conversions"
          trend="+14.2% vs prior month"
          icon={PieChart}
        />

        <ScaleMetricCard
          title="Conversion Rate"
          value={stats.conversionRate}
          subtitle="Aggregate lead-to-deal conversion"
          trend="+2.1% benchmark delta"
          icon={CheckCircle2}
        />
      </div>

      {/* Bottom Grid: Calls, Emails, and Campaigns Container */}
      <div className="client-bottom-grid">
        {/* Left Card: Total calls */}
        <div className="client-rounded-panel client-calls-card">
          <div className="client-panel-header">
            <div className="client-panel-icon-wrap bg-blue-50 text-blue-600">
              <PhoneCall size={22} />
            </div>
            <span className="client-panel-title">Total Calls</span>
          </div>

          <div className="client-panel-body">
            <span className="client-panel-big-number">
              {stats.totalCalls.toLocaleString()}
            </span>
            <span className="client-panel-subtext">
              Total calls placed across all sequences
            </span>
          </div>

          <div className="client-panel-footer">
            <div className="client-call-breakdown">
              <span className="client-stat-tag text-emerald-700 bg-emerald-50">
                84% Connected
              </span>
              <span className="client-stat-tag text-slate-700 bg-slate-100">
                Avg 3m 42s
              </span>
            </div>
          </div>
        </div>

        {/* Middle Card: Total Emails */}
        <div className="client-rounded-panel client-emails-card">
          <div className="client-panel-header">
            <div className="client-panel-icon-wrap bg-indigo-50 text-indigo-600">
              <Mail size={22} />
            </div>
            <span className="client-panel-title">Total Emails</span>
          </div>

          <div className="client-panel-body">
            <span className="client-panel-big-number">
              {stats.totalEmails.toLocaleString()}
            </span>
            <span className="client-panel-subtext">
              Total emails dispatched across all campaigns
            </span>
          </div>

          <div className="client-panel-footer">
            <div className="client-call-breakdown">
              <span className="client-stat-tag text-indigo-700 bg-indigo-50">
                48.2% Open rate
              </span>
              <span className="client-stat-tag text-emerald-700 bg-emerald-50">
                21.6% Click-through
              </span>
            </div>
          </div>
        </div>

        {/* Right Tall Container with 3 Stacked Sub-panels */}
        <div className="client-tall-campaigns-container">
          <div className="client-tall-container-header">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-slate-700" />
              <h3 className="client-tall-title">Campaign Status</h3>
            </div>
          </div>

          <div className="client-stacked-subpanels">
            {/* Sub-panel 1: Active Campaigns */}
            <div className="client-stacked-box client-active-box">
              <div className="client-stacked-info">
                <span className="client-stacked-label">Active Campaigns</span>
                <span className="client-stacked-note">Currently running</span>
              </div>
              <span className="client-stacked-val text-emerald-600">
                {stats.activeCampaigns}
              </span>
            </div>

            {/* Sub-panel 2: Completed Campaigns */}
            <div className="client-stacked-box client-completed-box">
              <div className="client-stacked-info">
                <span className="client-stacked-label">Completed Campaigns</span>
                <span className="client-stacked-note">Finished execution</span>
              </div>
              <span className="client-stacked-val text-indigo-600">
                {stats.completedCampaigns}
              </span>
            </div>

            {/* Sub-panel 3: Total Campaigns */}
            <div className="client-stacked-box client-total-box">
              <div className="client-stacked-info">
                <span className="client-stacked-label">Total Campaigns</span>
                <span className="client-stacked-note">All registered campaigns</span>
              </div>
              <span className="client-stacked-val text-slate-900">
                {stats.totalCampaigns}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}