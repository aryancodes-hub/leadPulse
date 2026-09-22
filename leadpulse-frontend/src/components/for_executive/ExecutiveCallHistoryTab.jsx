"use client";

import { useState } from "react";
import { Phone, CalendarClock, CheckCircle, Clock, ArrowUpRight, Search } from "lucide-react";
import { VIBGYOR_OUTCOME_CONFIG } from "@/lib/executiveStore";

export default function ExecutiveCallHistoryTab({
  viewMode = "history",
  onDialLead,
  callLogs = []
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const isCallbacksOnly = viewMode === "callbacks";

  const displayedList = callLogs.filter((call) => {
    if (isCallbacksOnly && call.outcome !== "Callback Requested") return false;
    const term = searchTerm.toLowerCase();
    const leadName = (call.leadName || "").toLowerCase();
    const company = (call.company || "").toLowerCase();
    const outcome = (call.outcome || "").toLowerCase();
    const notes = (call.notes || "").toLowerCase();
    return (
      leadName.includes(term) ||
      company.includes(term) ||
      outcome.includes(term) ||
      notes.includes(term)
    );
  });

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          background: "#fff",
          padding: "18px 22px",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isCallbacksOnly ? "#f5f3ff" : "#eff6ff",
              border: `1px solid ${isCallbacksOnly ? "#ddd6fe" : "#bfdbfe"}`
            }}
          >
            {isCallbacksOnly ? (
              <CalendarClock size={20} color="#7c3aed" />
            ) : (
              <Phone size={20} color="#0066ff" />
            )}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#0f172a" }}>
              {isCallbacksOnly ? "Scheduled Callbacks & Action List" : "My Call History & Logs"}
            </h3>
            <p style={{ margin: 0, fontSize: 11, color: "#64748b", marginTop: 2 }}>
              {isCallbacksOnly
                ? "Organized follow-up appointments sorted by due date"
                : "Complete chronological audit stream of all calls logged by you"}
            </p>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8"
            }}
          />
          <input
            type="text"
            placeholder="Search by contact, company, or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: 32,
              paddingRight: 12,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: 12,
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              outline: "none",
              width: 272,
              background: "#f8fafc",
              color: "#0f172a"
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="exec-card-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div className="exec-table-responsive">
          <table className="exec-data-table">
            <thead>
              <tr>
                <th>Contact &amp; Company</th>
                <th>Outcome</th>
                <th>Duration</th>
                <th>{isCallbacksOnly ? "Callback Due Date" : "Timestamp"}</th>
                <th>Remarks / Notes</th>
                <th>Pipeline Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 text-sm">
                    No calls or callbacks match your query.
                  </td>
                </tr>
              ) : (
                displayedList.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="font-bold text-slate-900">{log.leadName}</div>
                      <div className="text-xs text-slate-500">
                        {log.company} &bull; {log.phone}
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const normalizedKey = (log.outcome || "").replace(/ /g, "_");
                        const conf = VIBGYOR_OUTCOME_CONFIG[normalizedKey] || {
                          label: log.outcome,
                          color: "#64748B",
                          bg: "#F1F5F9",
                          textColor: "#334155",
                          border: "#CBD5E1"
                        };
                        return (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "4px 10px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              backgroundColor: conf.bg,
                              color: conf.textColor,
                              border: `1px solid ${conf.border}`,
                              whiteSpace: "nowrap"
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: conf.color,
                                flexShrink: 0,
                                display: "inline-block"
                              }}
                            />
                            {conf.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="text-slate-700 font-mono text-xs">{log.duration} mins</td>
                    <td className="text-xs font-semibold text-slate-800">
                      {isCallbacksOnly ? (
                        <span className="text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded">
                          {log.followUpDate}
                        </span>
                      ) : (
                        log.timestamp
                      )}
                    </td>
                    <td className="max-w-xs text-xs text-slate-600 line-clamp-2" title={log.notes}>
                      &ldquo;{log.notes}&rdquo;
                    </td>
                    <td>
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {log.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => onDialLead && onDialLead(log)}
                        className="exec-btn exec-btn-blue text-xs py-1.5 px-3"
                      >
                        <Phone size={12} />
                        <span>Dial Now</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
