"use client";

import { useState } from "react";

// Standard VIBGYOR palette
const VIBGYOR_COLORS = [
  { name: "Violet", hex: "#8B00FF" },
  { name: "Indigo", hex: "#4B0082" },
  { name: "Blue", hex: "#0047AB" },
  { name: "Green", hex: "#16A34A" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Red", hex: "#DC2626" },
];

export default function DonutChart({ campaigns = [], sequenceName = "" }) {
  const [activeSegment, setActiveSegment] = useState(null);

  const totalConverted = campaigns.reduce((acc, c) => acc + (Number(c.convertedLeads) || 0), 0);

  const size = 260;
  const strokeWidth = 34;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulativePercent = 0;

  const segments = campaigns.map((campaign, idx) => {
    const value = Number(campaign.convertedLeads) || 0;
    const percent = totalConverted > 0 ? (value / totalConverted) * 100 : 0;
    const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    const colorObj = VIBGYOR_COLORS[idx % VIBGYOR_COLORS.length];

    cumulativePercent += percent;

    return {
      campaign,
      value,
      percent,
      strokeDasharray,
      strokeDashoffset,
      color: colorObj.hex,
      colorName: colorObj.name,
      index: idx,
    };
  });

  return (
    <div className="client-donut-container">
      <div className="client-donut-header">
        <h4 className="client-donut-title">Conversion Distribution</h4>
        <span className="client-donut-subtitle">
          Breakdown across {campaigns.length} Campaign{campaigns.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="client-donut-chart-wrapper">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="client-donut-svg"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f1f3f8"
            strokeWidth={strokeWidth}
          />

          {segments.map((seg) => (
            <circle
              key={seg.campaign.id || seg.index}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={activeSegment === seg.index ? strokeWidth + 6 : strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              className="client-donut-segment"
              transform={`rotate(-90 ${center} ${center})`}
              onMouseEnter={() => setActiveSegment(seg.index)}
              onMouseLeave={() => setActiveSegment(null)}
            />
          ))}
        </svg>

        <div className="client-donut-center">
          <span className="client-donut-center-label">
            {activeSegment !== null ? segments[activeSegment]?.campaign?.name : "Total Converted"}
          </span>
          <span className="client-donut-center-count">
            {activeSegment !== null
              ? segments[activeSegment]?.value?.toLocaleString()
              : totalConverted.toLocaleString()}
          </span>
          <span className="client-donut-center-sub">
            {activeSegment !== null
              ? `${segments[activeSegment]?.percent.toFixed(1)}% of sequence`
              : "Converted Leads"}
          </span>
        </div>
      </div>

      <div className="client-donut-legend">
        {segments.map((seg) => (
          <div
            key={seg.campaign.id || seg.index}
            className={`client-donut-legend-item ${activeSegment === seg.index ? "active" : ""}`}
            onMouseEnter={() => setActiveSegment(seg.index)}
            onMouseLeave={() => setActiveSegment(null)}
          >
            <span
              className="client-donut-color-dot"
              style={{ backgroundColor: seg.color }}
              title={seg.colorName}
            />
            <span className="client-donut-legend-name" title={seg.campaign.name}>
              {seg.campaign.name}
            </span>
            <span className="client-donut-legend-val">
              <strong>{seg.value}</strong> leads ({seg.percent.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
