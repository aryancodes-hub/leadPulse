"use client";

import { useMemo } from "react";
import { VIBGYOR_OUTCOME_CONFIG, CALL_OUTCOMES } from "@/lib/executiveStore";
import { Activity, PhoneCall } from "lucide-react";

export default function ExecutiveSpeedometer({
  completedCount = 0,
  totalTarget = 50,
  activityCounts = {},
}) {
  // Ensure target is at least 1
  const target = Math.max(totalTarget, 1);
  const clampedCompleted = Math.min(Math.max(completedCount, 0), target);
  const ratio = clampedCompleted / target;
  const percentage = (ratio * 100).toFixed(1);

  // SVG Geometry
  // Radius = 100, Center = (140, 130), Stroke = 22
  // Arc length for semicircle (180deg) = PI * R = 3.14159 * 100 = 314.16
  const r = 100;
  const cx = 140;
  const cy = 130;
  const arcLength = Math.PI * r;
  const strokeDashoffset = arcLength * (1 - ratio);

  // Needle angle: -90deg is leftmost 0, +90deg is rightmost 100%
  const needleAngle = -90 + ratio * 180;

  return (
    <div className="exec-speedometer-container">
      {/* Left Box: Speedometer Gauge */}
      <div className="exec-speedometer-box">
        {/* Top Header Badge matching Image 1 */}
        <div className="exec-speedometer-badge-tag">
          <span>Call Queue % Complete</span>
        </div>

        {/* Semi-circular Speedometer SVG */}
        <div className="exec-speedometer-svg-wrapper">
          <svg viewBox="0 0 280 160" className="exec-speedometer-svg">
            {/* Background Arc Track (Faded) */}
            <path
              d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="22"
              strokeLinecap="round"
            />

            {/* Filled Progress Arc */}
            <path
              d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
              fill="none"
              stroke="#0D9488"
              strokeWidth="22"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />

          </svg>
        </div>

        {/* Large Percentage Below matching Image 1 */}
        <div className="exec-speedometer-footer">
          <div className="exec-speedometer-percentage">{percentage}%</div>
          <div className="text-xs text-slate-500 font-semibold mt-0.5">
            {clampedCompleted} of {target} Leads Called
          </div>
        </div>
      </div>

      {/* Right Box: Summary of Activity based on VIBGYOR */}
      <div className="exec-activity-summary-box">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Summary of Activity
            </h4>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            Total Calls: {clampedCompleted}
          </span>
        </div>

        {/* VIBGYOR Grid showing ONLY THE COUNT beside each outcome */}
        <div className="exec-vibgyor-grid">
          {CALL_OUTCOMES.map((outcomeKey) => {
            const config = VIBGYOR_OUTCOME_CONFIG[outcomeKey] || {
              label: outcomeKey,
              color: "#64748B",
              bg: "#F1F5F9",
              textColor: "#334155",
            };
            const count = activityCounts[outcomeKey] || 0;

            return (
              <div
                key={outcomeKey}
                className="exec-vibgyor-item"
                style={{
                  backgroundColor: config.bg,
                  borderColor: config.border,
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* VIBGYOR color dot */}
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: config.color }}
                  />
                  <span
                    className="text-xs font-semibold truncate"
                    style={{ color: config.textColor }}
                    title={config.label}
                  >
                    {config.label}
                  </span>
                </div>

                {/* ONLY COUNT displayed prominently */}
                <span
                  className="text-sm font-extrabold font-mono ml-2 px-2 py-0.5 rounded"
                  style={{
                    color: config.textColor,
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

