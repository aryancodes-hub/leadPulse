"use client";

import { useMemo } from "react";
import { RGBY_EMAIL_CONFIG } from "@/lib/executiveStore";

export default function ExecutiveEmailDonut({
  queued = 0,
  processing = 0,
  completed = 0,
  failed = 0,
}) {
  const total = queued + processing + completed + failed;

  // Slices configuration in RGBY order
  const slices = useMemo(() => {
    const raw = [
      { key: "Completed", label: "Completed", count: completed, color: "#10B981", rgb: "G" },
      { key: "Processing", label: "Processing", count: processing, color: "#3B82F6", rgb: "B" },
      { key: "Queued", label: "Queued", count: queued, color: "#F59E0B", rgb: "Y" },
      { key: "Failed", label: "Failed", count: failed, color: "#EF4444", rgb: "R" },
    ];

    if (total === 0) {
      return raw.map((s) => ({ ...s, percent: 0, startAngle: 0, endAngle: 0 }));
    }

    let accumulatedAngle = 0;
    return raw.map((s) => {
      const fraction = s.count / total;
      const sweepAngle = fraction * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += sweepAngle;
      return {
        ...s,
        fraction,
        percent: Math.round(fraction * 100),
        startAngle,
        endAngle: accumulatedAngle,
        midAngle: startAngle + sweepAngle / 2,
      };
    });
  }, [queued, processing, completed, failed, total]);

  // SVG Geometry for enlarged donut matching Image 2
  const cx = 310;
  const cy = 210;
  const r = 130;
  const circumference = 2 * Math.PI * r;

  let currentOffset = 0;

  return (
    <div className="exec-donut-card-container">
      {/* Left Legend Card matching Image 2 */}
      <div className="exec-donut-legend-panel">
        <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3.5">
          Job Status (RGBY)
        </h5>
        <div className="space-y-3">
          {slices.map((slice) => (
            <div key={slice.key} className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-sm flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-slate-700 font-bold">{slice.label}</span>
              </div>
              <span className="font-mono font-black text-slate-900 ml-4 text-sm">
                {slice.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Donut Chart with Leader Callout Numbers */}
      <div className="exec-donut-chart-panel">
        <svg viewBox="0 0 600 420" className="exec-donut-svg enlarged">
          {/* Base Empty Ring */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="50"
          />

          {/* Slices */}
          {total > 0 &&
            slices.map((slice) => {
              if (slice.count === 0) return null;
              const strokeLength = slice.fraction * circumference;
              const dashOffset = -currentOffset;
              currentOffset += strokeLength;

              return (
                <circle
                  key={slice.key}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="50"
                  strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                  strokeDashoffset={dashOffset}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{
                    transition: "all 0.5s ease-out",
                  }}
                />
              );
            })}

          {/* Center Hole Details */}
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            className="font-mono font-black fill-slate-900"
            fontSize="36"
            fontWeight="900"
          >
            {total}
          </text>
          <text
            x={cx}
            y={cy + 18}
            textAnchor="middle"
            className="font-bold fill-slate-400 uppercase tracking-wider"
            fontSize="12"
            fontWeight="700"
          >
            Total Emails
          </text>

          {/* Leader Line Callout Numbers matching Image 2 */}
          {total > 0 &&
            slices.map((slice) => {
              if (slice.count === 0) return null;
              // Angle in radians (converted from -90 offset)
              const rad = ((slice.midAngle - 90) * Math.PI) / 180;
              const lineStartR = r + 28;
              const lineEndR = r + 62;
              const x1 = cx + lineStartR * Math.cos(rad);
              const y1 = cy + lineStartR * Math.sin(rad);
              const x2 = cx + lineEndR * Math.cos(rad);
              const y2 = cy + lineEndR * Math.sin(rad);

              const textX = x2 + (Math.cos(rad) >= 0 ? 12 : -12);
              const textY = y2 + 6;
              const textAnchor = Math.cos(rad) >= 0 ? "start" : "end";

              return (
                <g key={`callout-${slice.key}`} className="exec-donut-callout">
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#94A3B8"
                    strokeWidth="2"
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor={textAnchor}
                    className="font-mono font-black"
                    fill="#0F172A"
                    fontSize="16"
                    fontWeight="900"
                  >
                    {slice.count}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>
    </div>
  );
}

