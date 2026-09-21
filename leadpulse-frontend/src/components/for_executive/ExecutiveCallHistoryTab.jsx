"use client";

import { useState } from "react";
import { Phone, CalendarClock, CheckCircle, Clock, ArrowUpRight, Search } from "lucide-react";
import { VIBGYOR_OUTCOME_CONFIG } from "@/lib/executiveStore";

export default function ExecutiveCallHistoryTab({ viewMode = "history", onDialLead, callLogs = [] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const isCallbacksOnly = viewMode === "callbacks";

  const displayedList = callLogs.filter((call) => {
    if (isCallbacksOnly && call.outcome !== "Callback_Requested") return false;
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
    <div className="exec-history-container">
      <div className="exec-history-header">
        <div className="flex items-center gap-2">
          {isCallbacksOnly ? (
            <CalendarClock size={22} className="text-purple-600" />
          ) : (
            <Phone size={22} className="text-blue-600" />
          )}
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              {isCallbacksOnly ? "Scheduled Callbacks & Action List" : "My Call History & Logs"}
            </h3>
            <p className="text-xs text-slate-500">
              {isCallbacksOnly
                ? "Organized follow-up appointments sorted by due date"
                : "Complete chronological audit stream of all calls and remarks logged by you"}
            </p>
          </div>
        </div>

        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by contact, company, or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="exec-card-panel p-0 overflow-hidden">
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
                      <div className="text-xs text-slate-500">{log.company} &bull; {log.phone}</div>
                    </td>
                    <td>
                      {(() => {
                        const conf = VIBGYOR_OUTCOME_CONFIG[log.outcome] || {
                          label: log.outcome,
                          color: "#64748B",
                          bg: "#F1F5F9",
                          textColor: "#334155",
                          border: "#CBD5E1",
                        };
                        return (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: conf.bg,
                              color: conf.textColor,
                              border: `1px solid ${conf.border}`,
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: conf.color }}
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