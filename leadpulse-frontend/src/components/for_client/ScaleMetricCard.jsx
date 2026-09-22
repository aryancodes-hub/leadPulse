"use client";

import { TrendingUp } from "lucide-react";

export default function ScaleMetricCard({ title, value, subtitle, trend, icon: Icon }) {
  return (
    <div className="client-metric-card hover-scale-card" title={`${title}: ${value}`}>
      <div className="client-metric-icon bg-purple-600 text-white">
        {Icon && <Icon size={24} />}
      </div>
      <div className="client-metric-info">
        <span className="client-metric-label">{title}</span>
        <span className="client-metric-value">{value}</span>
        <span className="client-metric-sub">{subtitle}</span>
      </div>
    </div>
  );
}
