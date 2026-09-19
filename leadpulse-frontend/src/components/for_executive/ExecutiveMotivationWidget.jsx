"use client";

import { DollarSign, CheckCircle2, Clock, XCircle, Zap, Target } from "lucide-react";

export default function ExecutiveMotivationWidget({ stats }) {
  const dialsToday = stats?.callsLoggedToday || 248;
  const conversionsToday = stats?.conversionsToday || 14;
  const conversionRate = dialsToday > 0 ? ((conversionsToday / dialsToday) * 100).toFixed(1) : "0.0";
  const pendingQueue = stats?.pendingQueue || 32;

  // Commission details
  const confirmedEarnings = stats?.confirmedEarnings || 1450;
  const inReviewCount = stats?.inReviewCount || 5;
  const inReviewValue = stats?.inReviewValue || 500;
  const disqualifiedCount = stats?.disqualifiedCount || 1;

  return (
    <div className="exec-motivation-wrapper">
      {/* Commission & Earnings Goal Banner */}
      <div className="exec-commission-panel">
        <div className="exec-commission-header">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500 text-white">
              <DollarSign size={20} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 tracking-wide">
                COMMISSION &amp; GOAL TRACKING
              </h4>
              <p className="text-xs text-slate-500">Live validation pipeline for earnings &amp; performance</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Active Tier 1 &bull; 10% Rate
          </span>
        </div>

        <div className="exec-commission-grid">
          {/* Confirmed / Locked In */}
          <div className="exec-comm-box confirmed">
            <div className="flex items-center justify-between">
              <span className="exec-comm-label text-emerald-700">Confirmed Conversions</span>
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <div className="exec-comm-val text-emerald-900 font-mono">
              ${confirmedEarnings.toLocaleString()}.00
            </div>
            <div className="exec-comm-status text-emerald-700">
              Locked-in payout balance
            </div>
          </div>

          {/* In Review / Pending Manager Audio Review */}
          <div className="exec-comm-box pending">
            <div className="flex items-center justify-between">
              <span className="exec-comm-label text-amber-700">Pending Confirmation</span>
              <Clock size={16} className="text-amber-600" />
            </div>
            <div className="exec-comm-val text-amber-900 font-mono">
              ${inReviewValue.toLocaleString()}.00
            </div>
            <div className="exec-comm-status text-amber-700">
              {inReviewCount} leads awaiting call review
            </div>
          </div>

          {/* Rejected / Disqualified */}
          <div className="exec-comm-box disqualified">
            <div className="flex items-center justify-between">
              <span className="exec-comm-label text-rose-700">Rejected Conversions</span>
              <XCircle size={16} className="text-rose-600" />
            </div>
            <div className="exec-comm-val text-rose-900 font-mono">
              {disqualifiedCount}
            </div>
            <div className="exec-comm-status text-rose-700">
              Disqualified by manager
            </div>
          </div>
        </div>
      </div>

      {/* "The Grind" Daily Session Stats */}
      <div className="exec-grind-panel">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-blue-600 fill-current" />
          <h4 className="text-xs font-extrabold text-slate-800 tracking-wider uppercase">
            &ldquo;THE GRIND&rdquo; &mdash; Daily Session Pace
          </h4>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="exec-grind-pill">
            <span className="text-[11px] font-bold text-slate-500">Dials Today</span>
            <span className="text-xl font-black font-mono text-slate-900">{dialsToday}</span>
          </div>

          <div className="exec-grind-pill">
            <span className="text-[11px] font-bold text-slate-500">Conversions Today</span>
            <span className="text-xl font-black font-mono text-emerald-600">{conversionsToday}</span>
          </div>

          <div className="exec-grind-pill">
            <span className="text-[11px] font-bold text-slate-500">Session Rate</span>
            <span className="text-xl font-black font-mono text-indigo-600">{conversionRate}%</span>
          </div>

          <div className="exec-grind-pill">
            <span className="text-[11px] font-bold text-slate-500">Remaining in Queue</span>
            <span className="text-xl font-black font-mono text-purple-600">{pendingQueue}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
