"use client";

import { TrendingUp } from "lucide-react";

export default function ScaleMetricCard({ title, value, subtitle, trend, icon: Icon }) {
  return (
    <div
      className="client-scale-card-outer hover-scale-card"
      title={`${title}: ${value}`}
    >
      <div className="client-scale-card-inner">
        <div className="client-scale-card-header">
          <div className="client-scale-card-title-wrap">
            {Icon && <Icon className="client-scale-card-icon" size={18} />}
            <span className="client-scale-card-title">{title}</span>
          </div>
          {trend && (
            <div className="client-scale-trend">
              <TrendingUp size={13} className="text-emerald-500" />
              <span>{trend}</span>
            </div>
          )}
        </div>

        <div className="client-scale-revealed">
          <div className="client-scale-value">{value}</div>
          {subtitle && (
            <div className="client-scale-footnote">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
