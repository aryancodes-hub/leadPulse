"use client";
import { useEffect, useState } from "react";
import { Megaphone, Users, UserCheck, BarChart3, Check, X, ShieldAlert } from "lucide-react";
import api from "@/api/api";

export default function ManagerDashboard() {
  const [summary, setSummary] = useState({});
  const [pendingApprovals, setPendingApprovals] = useState([]);

  useEffect(() => {
    // Endpoint #48: GET /api/v1/dashboards/manager-summary
    api
      .get("/dashboards/manager-summary")
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (data) {
          setSummary((prev) => ({
            ...prev,
            ...data,
            conversionsByClient: data.conversionsByClient || prev.conversionsByClient || [],
            pendingApprovals: data.pendingApprovals || []
          }));
        }
      })
      .catch((err) => console.log("Using dashboard summary mock", err));

    // SEE IF THIS IS NEEDED ELSE CHECK IF THIS IS BEING REDUNDANT 
    api.get("/call-remarks/pending")
      .then((res) => {
        const approvalData = res.data?.data ?? res.data;
        if (approvalData) {
          setPendingApprovals(approvalData);
        }
      })
      .catch((err) => console.log("No pending approvals found or backend error:", err));
  }, []);

  // Endpoint #41: PATCH /api/v1/call-remarks/:id/confirm
  const handleConfirmConversion = async (remarkId, isConfirmed) => {
    try {
      await api.patch(`/call-remarks/${remarkId}/confirm`, {
        conversionConfirmed: isConfirmed
      });
      setPendingApprovals((prev) => prev.filter((item) => item.id !== remarkId));
    } 
    catch(e) {
      // SEE THIS TOO...REFER THE ABOVE THING
      console.error("Failed to review remark:", e);
      alert("Failed to update status. Please try again.");
      // setPendingApprovals((prev) => prev.filter((item) => item.id !== remarkId));
    }
  };

  const maxConv = Math.max(...(summary.conversionsByClient || []).map((c) => c.conversions), 1);
  const CARDS = [
    {
      label: "Total Active Campaigns",
      value: summary.activeCampaigns,
      sub: "Currently executing",
      icon: Megaphone,
      color: "bg-purple-600"
    },
    {
      label: "Total Active Clients",
      value: summary.activeClients,
      sub: "Active corporate accounts",
      icon: Users,
      color: "bg-blue-600"
    },
    {
      label: "Total Active Executives",
      value: summary.activeExecutives,
      sub: "Assigned team members",
      icon: UserCheck,
      color: "bg-emerald-600"
    }
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
              <div className="mgr-section-subtitle">
                Real-time breakdown of confirmed conversions
              </div>
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
                    <div
                      className="mgr-bar"
                      style={{ height: `${heightPct}%` }}
                      title={`${item.clientName}: ${item.conversions} conversions`}
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-800">{item.conversions}</div>
                  <div className="text-[11px] font-semibold text-slate-500 truncate max-w-[90px]">
                    {item.clientName}
                  </div>
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
              <div className="mgr-section-subtitle">
                Verify caller conversion logs before finalizing
              </div>
            </div>
          </div>
          <span className="mgr-badge mgr-badge-amber">{pendingApprovals.length} Pending</span>
        </div>

        {summary.pendingApprovals?.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
            🎉 All pending call conversions reviewed! Inbox zero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="mgr-data-table w-full text-left">
              <thead>
                <tr>
                  <th className="bg-slate-50 text-slate-500 text-xs py-3 px-4 uppercase">
                    Remark ID
                  </th>
                  <th className="bg-slate-50 text-slate-500 text-xs py-3 px-4 uppercase">
                    Executive
                  </th>
                  <th className="bg-slate-50 text-slate-500 text-xs py-3 px-4 uppercase">
                    Lead & Client
                  </th>
                  <th className="bg-slate-50 text-slate-500 text-xs py-3 px-4 uppercase">Notes</th>
                  <th className="bg-slate-50 text-slate-500 text-xs py-3 px-4 uppercase text-right">
                    QA Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.pendingApprovals?.map((item) => (
                  <tr
                    key={item.fullId}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-500">
                      {item.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.execName}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 text-sm">{item.leadName}</div>
                      <div className="text-xs text-slate-400">{item.clientName}</div>
                    </td>
                    <td
                      className="py-3 px-4 text-xs text-slate-600 italic max-w-[200px] truncate"
                      title={item.notes}
                    >
                      &ldquo;{item.notes}&rdquo;
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Make sure to pass fullId back to your API */}
                        <button
                          onClick={() => handleConfirmConversion(item.fullId, true)}
                          className="mgr-btn mgr-btn-purple text-xs py-1.5 px-3 bg-purple-100 text-purple-700 font-bold rounded flex items-center gap-1 hover:bg-purple-200"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleConfirmConversion(item.fullId, false)}
                          className="mgr-btn mgr-btn-red text-xs py-1.5 px-3 bg-red-100 text-red-700 font-bold rounded flex items-center gap-1 hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
