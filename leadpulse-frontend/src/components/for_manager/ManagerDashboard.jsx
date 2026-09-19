"use client";
import { useEffect, useState } from "react";
import { Megaphone, Users, UserCheck, BarChart3, Check, X, ShieldAlert } from "lucide-react";
import api from "@/api/api";

export default function ManagerDashboard() {
  const [summary, setSummary] = useState({
    activeCampaigns: 12,
    activeClients: 8,
    activeExecutives: 24,
    conversionsByClient: [
      { clientName: "Northwind Retail", conversions: 142 },
      { clientName: "Brightline Health", conversions: 87 },
      { clientName: "Ardent Legal", conversions: 63 },
      { clientName: "SkyBridge Corp", conversions: 41 },
      { clientName: "Apex Digital", conversions: 29 },
    ],
  });

  const [pendingApprovals, setPendingApprovals] = useState([
    { id: "RMK-101", execName: "Jordan Ellis", leadName: "Maria Chen", clientName: "Northwind Retail", notes: "Lead confirmed upgrade to Enterprise tier." },
    { id: "RMK-102", execName: "Sam Patel", leadName: "Kevin Brooks", clientName: "Ardent Legal", notes: "Agreed to retainer package." }
  ]);

  useEffect(() => {
    // Endpoint #48: GET /api/v1/dashboards/manager-summary
    api.get("/dashboards/manager-summary")
      .then((res) => {
        const data = res.data?.data ?? res.data;
                if (data) {
          setSummary((prev) => ({
            ...prev,
            ...data,
            conversionsByClient: data.conversionsByClient || prev.conversionsByClient
          }));
        }
      })
      .catch((err) => console.log("Using dashboard summary mock", err));
  }, []);

  // Endpoint #41: PATCH /api/v1/call-remarks/:id/confirm
  const handleConfirmConversion = async (remarkId, isConfirmed) => {
    try {
      await api.patch(`/call-remarks/${remarkId}/confirm`, {
        conversionConfirmed: isConfirmed,
      });
      setPendingApprovals((prev) => prev.filter((item) => item.id !== remarkId));
    } catch (e) {
      setPendingApprovals((prev) => prev.filter((item) => item.id !== remarkId));
    }
  };

  const maxConv = Math.max(...(summary.conversionsByClient || []).map((c) => c.conversions), 1);
  const CARDS = [
    { label: "Total Active Campaigns", value: summary.activeCampaigns, sub: "Currently executing", icon: Megaphone, color: "bg-purple-600" },
    { label: "Total Active Clients", value: summary.activeClients, sub: "Active corporate accounts", icon: Users, color: "bg-blue-600" },
    { label: "Total Active Executives", value: summary.activeExecutives, sub: "Assigned team members", icon: UserCheck, color: "bg-emerald-600" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Metric Cards with Scale Effect */}
      <div className="mgr-metrics-row">
        {CARDS.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="mgr-metric-card">
            <div className={`mgr-metric-icon text-white ${color}`}>
              <Icon size={24} />
            </div>
            <div className="mgr-metric-info">
              <span className="mgr-metric-label">{label}</span>
              <span className="mgr-metric-value">{value}</span>
              <span className="mgr-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="mgr-section-panel">
        <div className="mgr-section-header">
          <div className="mgr-section-title-group">
            <BarChart3 size={18} className="text-purple-600" />
            <div>
              <div className="mgr-section-title">Converted Leads Per Client</div>
              <div className="mgr-section-subtitle">Real-time breakdown of confirmed conversions</div>
            </div>
          </div>
        </div>

        <div className="mgr-section-body">
          <div className="mgr-bar-chart-area">
            {(summary.conversionsByClient || []).map((item) => {
              const heightPct = (item.conversions / maxConv) * 100;
              return (
                <div key={item.clientName} className="mgr-bar-group">
                  <div className="mgr-bar-wrapper">
                    <div className="mgr-bar" style={{ height: `${heightPct}%` }} title={`${item.clientName}: ${item.conversions} conversions`} />
                  </div>
                  <div className="text-xs font-bold text-slate-800">{item.conversions}</div>
                  <div className="text-[11px] font-semibold text-slate-500 truncate max-w-[90px]">{item.clientName}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* QA Conversion Approvals Inbox */}
      <div className="mgr-section-panel">
        <div className="mgr-section-header">
          <div className="mgr-section-title-group">
            <ShieldAlert size={18} className="text-amber-500" />
            <div>
              <div className="mgr-section-title">Conversion Approvals Inbox</div>
              <div className="mgr-section-subtitle">Verify caller conversion logs before finalizing</div>
            </div>
          </div>
          <span className="mgr-badge mgr-badge-amber">{pendingApprovals.length} Pending</span>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 font-semibold">
            All pending call conversions reviewed.
          </div>
        ) : (
          <table className="mgr-data-table">
            <thead>
              <tr>
                <th>Remark ID</th>
                <th>Executive</th>
                <th>Lead / Client</th>
                <th>Notes</th>
                <th style={{ textAlign: "right" }}>QA Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.map((item) => (
                <tr key={item.id}>
                  <td className="font-mono text-xs font-bold text-slate-500">{item.id}</td>
                  <td className="font-bold text-slate-900">{item.execName}</td>
                  <td>
                    <div className="font-semibold text-slate-800">{item.leadName}</div>
                    <div className="text-xs text-slate-400">{item.clientName}</div>
                  </td>
                  <td className="text-xs text-slate-600 italic">&ldquo;{item.notes}&rdquo;</td>
                  <td style={{ textAlign: "right" }}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleConfirmConversion(item.id, true)}
                        className="mgr-btn mgr-btn-purple text-xs py-1"
                      >
                        <Check size={13} /> Approve
                      </button>
                      <button
                        onClick={() => handleConfirmConversion(item.id, false)}
                        className="mgr-btn mgr-btn-red text-xs py-1"
                      >
                        <X size={13} /> Reject
                      </button>
                    </div>
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