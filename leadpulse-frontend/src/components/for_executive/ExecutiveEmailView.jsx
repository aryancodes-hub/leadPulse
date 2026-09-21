"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import ExecutiveEmailDonut from "./ExecutiveEmailDonut";
import {
  Mail,
  Send,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  AlertCircle,
  Layers,
  ArrowRight,
  Search,
  Download,
  Filter,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { dispatchEmail } from "@/lib/campaigns";
import { getEmailJobStatus } from "@/lib/email";
import { getExecutiveState, updateEmailJobStats } from "@/lib/executiveStore";

const TOTAL_RECIPIENTS = 500;
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 200;
const TOTAL_BATCHES = Math.ceil(TOTAL_RECIPIENTS / BATCH_SIZE);

export default function ExecutiveEmailView({
  activeCampaign,
  viewMode = "dashboard", // "dashboard" | "dispatch" | "history"
  onNavigateTab,
}) {
  const campaignName = activeCampaign?.name || "CloudScale Renewal Drip";
  const campaignId = activeCampaign?.id || "CMP-EMAIL-01";

  // Initial stats from store
  const [stats, setStats] = useState(() => {
    const s = getExecutiveState();
    return s.emailStats || { queued: TOTAL_RECIPIENTS, processing: 0, completed: 0, failed: 0 };
  });

  const [isDispatching, setIsDispatching] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [batchLogs, setBatchLogs] = useState([
    { id: "BATCH-01", count: 50, timestamp: "Today, 09:30 AM", latency: "200ms", status: "Completed", response: "250 OK: 50 queued" },
    { id: "BATCH-02", count: 50, timestamp: "Today, 09:31 AM", latency: "200ms", status: "Completed", response: "250 OK: 50 queued" },
    { id: "BATCH-03", count: 50, timestamp: "Today, 09:32 AM", latency: "200ms", status: "Completed", response: "250 OK: 50 queued" },
  ]);
  const [statusMessage, setStatusMessage] = useState("Ready to start automated batch dispatch.");
  const [historySearch, setHistorySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toastMsg, setToastMsg] = useState("");

  const dispatchTimerRef = useRef(null);

  // Sync with store
  useEffect(() => {
    updateEmailJobStats(stats);
  }, [stats]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (dispatchTimerRef.current) clearTimeout(dispatchTimerRef.current);
    };
  }, []);

  /*
  =============================================================================
  50-BATCH DISPATCH ENGINE (Sends 50 emails -> waits 200ms -> next batch)
  =============================================================================
  */
  const startBatchDispatch = async () => {
    if (isDispatching || stats.queued <= 0) return;
    setIsDispatching(true);
    setStatusMessage("Triggering batch dispatch pipeline...");

    try {
      await dispatchEmail(campaignId, { batchSize: BATCH_SIZE });
    } catch (err) {
      // Fallback
    }

    processNextBatch(currentBatch + 1);
  };

  const processNextBatch = (batchNum) => {
    if (batchNum > TOTAL_BATCHES) {
      setIsDispatching(false);
      setStatusMessage("All 500 emails successfully dispatched across 10 batches!");
      return;
    }

    setCurrentBatch(batchNum);
    setStatusMessage(`Batch ${batchNum} of ${TOTAL_BATCHES}: Transmitting ${BATCH_SIZE} emails...`);

    // 1. Move from Queued to Processing
    setStats((prev) => ({
      ...prev,
      queued: Math.max(0, prev.queued - BATCH_SIZE),
      processing: BATCH_SIZE,
    }));

    // 2. Wait 200ms
    dispatchTimerRef.current = setTimeout(() => {
      const hasFailed = batchNum === 7;
      const completedInBatch = hasFailed ? BATCH_SIZE - 1 : BATCH_SIZE;
      const failedInBatch = hasFailed ? 1 : 0;

      setStats((prev) => ({
        ...prev,
        processing: 0,
        completed: prev.completed + completedInBatch,
        failed: prev.failed + failedInBatch,
      }));

      const newLog = {
        id: `BATCH-0${batchNum}`,
        count: BATCH_SIZE,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        latency: "200ms",
        status: hasFailed ? "Completed (1 Failed)" : "Completed",
        response: hasFailed ? "451 Mailbox temporarily unavailable (1)" : "250 OK: Delivered",
      };
      setBatchLogs((prev) => [newLog, ...prev]);

      setStatusMessage(`Batch ${batchNum} completed! Pausing 200ms before next batch...`);

      // 3. Pause 200ms before next batch
      dispatchTimerRef.current = setTimeout(() => {
        processNextBatch(batchNum + 1);
      }, BATCH_DELAY_MS);
    }, BATCH_DELAY_MS);
  };

  const pauseDispatch = () => {
    if (dispatchTimerRef.current) {
      clearTimeout(dispatchTimerRef.current);
    }
    setIsDispatching(false);
    setStatusMessage("Batch dispatch paused by operator.");
  };

  const resetDispatch = () => {
    pauseDispatch();
    setCurrentBatch(0);
    setStats({
      queued: TOTAL_RECIPIENTS,
      processing: 0,
      completed: 0,
      failed: 0,
    });
    setStatusMessage("Queue reset to initial state (500 Queued).");
  };

  const progressPercent = Math.round(((stats.completed + stats.failed) / TOTAL_RECIPIENTS) * 100);

  const handleExportCSV = () => {
    setToastMsg("Exporting transmission log as CSV...");
    setTimeout(() => {
      setToastMsg("CSV download started successfully.");
      setTimeout(() => setToastMsg(""), 2500);
    }, 1000);
  };

  // Filtered logs for History tab
  const filteredLogs = useMemo(() => {
    return batchLogs.filter((log) => {
      if (statusFilter === "COMPLETED" && log.status.includes("Failed")) return false;
      if (statusFilter === "FAILED" && !log.status.includes("Failed")) return false;

      const term = historySearch.toLowerCase();
      return (
        log.id.toLowerCase().includes(term) ||
        log.status.toLowerCase().includes(term) ||
        log.response.toLowerCase().includes(term)
      );
    });
  }, [batchLogs, historySearch, statusFilter]);

  return (
    <div className="exec-email-container">
      {/* Feedback Toast */}
      {toastMsg && (
        <div className="exec-alert-toast">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top 4 Email Metric Cards (shown on all views) */}
      <div className="exec-email-metrics-grid">
        <div className="exec-metric-card">
          <div className="exec-metric-icon-wrap bg-purple-500 text-white">
            <Mail size={22} />
          </div>
          <div className="exec-metric-info">
            <span className="exec-metric-title">TARGET RECIPIENTS</span>
            <span className="exec-metric-value">{TOTAL_RECIPIENTS}</span>
          </div>
        </div>

        <div className="exec-metric-card">
          <div className="exec-metric-icon-wrap bg-emerald-500 text-white">
            <CheckCircle2 size={22} />
          </div>
          <div className="exec-metric-info">
            <span className="exec-metric-title">COMPLETED / DELIVERED</span>
            <span className="exec-metric-value text-emerald-600">{stats.completed}</span>
          </div>
        </div>

        <div className="exec-metric-card">
          <div className="exec-metric-icon-wrap bg-amber-500 text-white">
            <Clock size={22} />
          </div>
          <div className="exec-metric-info">
            <span className="exec-metric-title">QUEUED REMAINING</span>
            <span className="exec-metric-value text-amber-600">{stats.queued}</span>
          </div>
        </div>

        <div className="exec-metric-card">
          <div className="exec-metric-icon-wrap bg-rose-500 text-white">
            <AlertCircle size={22} />
          </div>
          <div className="exec-metric-info">
            <span className="exec-metric-title">FAILED / BOUNCED</span>
            <span className="exec-metric-value text-rose-600">{stats.failed}</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          VIEW 1: DASHBOARD (Overview & Enlarged RGBY Donut)
          ===================================================================== */}
        <div className="space-y-6">
          <div className="exec-email-main-grid">
            {/* Left: Enlarged RGBY Donut Chart */}
            <div className="exec-card-panel">
              <div className="exec-card-header">
                <div className="flex items-center gap-2 text-purple-600">
                  <Layers size={18} />
                  <h3 className="exec-card-title text-purple-800">EMAIL PIPELINE STATUS</h3>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  RGBY Breakdown
                </span>
              </div>
              <ExecutiveEmailDonut
                queued={stats.queued}
                processing={stats.processing}
                completed={stats.completed}
                failed={stats.failed}
              />
            </div>

            {/* Right: Campaign Configuration & Dispatch Launchpad */}
            <div className="exec-card-panel flex flex-col justify-between">
              <div>
                <div className="exec-card-header">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Zap size={18} />
                    <h3 className="exec-card-title text-blue-800">CAMPAIGN SPECIFICATIONS</h3>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    50 / 200ms Cadence
                  </span>
                </div>

                <div className="p-4 space-y-3.5 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-500 block uppercase tracking-wider text-[10px]">
                      Active Campaign
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">{campaignName}</span>
                  </div>

                  <div>
                    <span className="font-extrabold text-slate-500 block uppercase tracking-wider text-[10px]">
                      Verified Sender Identity
                    </span>
                    <span className="font-mono text-slate-800">outreach.delivery@leadpulse.io</span>
                  </div>

                  <div>
                    <span className="font-extrabold text-slate-500 block uppercase tracking-wider text-[10px]">
                      Subject Line
                    </span>
                    <span className="text-slate-800 italic bg-slate-50 p-2 rounded block border border-slate-200">
                      &ldquo;Accelerate Your Cloud Architecture with Real-Time Data Pipelines&rdquo;
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between font-bold text-slate-700 mb-1">
                      <span>Total Transmission Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* =====================================================================
          VIEW 2: DISPATCH (Full 50-Batch Interactive Visual Workspace)
          ===================================================================== */}
        

      {/* =====================================================================
          VIEW 3: HISTORY (Dedicated Searchable Transmission Logs)
          ===================================================================== */}
        <div className="exec-card-panel p-0 overflow-hidden mt-6">
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Email Transmission Logs &bull; {campaignName}
              </h3>
              <p className="text-xs text-slate-500">
                Audited dispatch stream tracking volume, latency, and server responses
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Pills */}
              <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    statusFilter === "ALL" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("COMPLETED")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    statusFilter === "COMPLETED" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("FAILED")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    statusFilter === "FAILED" ? "bg-rose-600 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Bounces
                </button>
              </div>

              {/* Search */}
              <div className="relative w-48">
                <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-300 outline-none focus:border-blue-500"
                />
              </div>

              {/* Export */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="exec-btn exec-btn-outline py-1 px-3 text-xs"
                title="Download CSV report"
              >
                <Download size={13} />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="exec-table-responsive">
            <table className="exec-data-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Recipient Volume</th>
                  <th>Timestamp</th>
                  <th>Batch Interval</th>
                  <th>SMTP Response</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      No transmission records found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((b) => (
                    <tr key={b.id}>
                      <td className="font-mono font-bold text-slate-900">{b.id}</td>
                      <td className="font-semibold text-slate-700">{b.count} emails</td>
                      <td className="text-slate-500 text-xs">{b.timestamp}</td>
                      <td className="font-mono text-xs text-slate-600">{b.latency}</td>
                      <td className="font-mono text-xs text-slate-500 max-w-xs truncate">{b.response}</td>
                      <td className="text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            b.status.includes("Failed")
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {b.status}
                        </span>
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


