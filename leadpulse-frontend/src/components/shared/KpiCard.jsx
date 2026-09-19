"use client";

/**
 * KpiCard — Gradient metric card for Analytics tab
 *
 * Props:
 *   label      {string}    - uppercase label text
 *   value      {string|number} - primary big number
 *   valueUnit  {string}    - optional unit appended inline (e.g. "m" for minutes)
 *   subtext    {string}    - small text below value (plain)
 *   badge      {string}    - optional colored badge text (e.g. "42% Win Rate")
 *   icon       {ReactNode} - lucide icon element
 *   gradient   {string}    - CSS gradient string for card background
 *   glow       {string}    - CSS box-shadow glow color (e.g. "rgba(79,70,229,0.35)")
 */
export default function KpiCard({
  label,
  value,
  valueUnit,
  subtext,
  badge,
  icon,
  gradient,
  glow,
}) {
  return (
    <div
      className="lp-kpi-card"
      style={{
        background: gradient,
        boxShadow: `0 4px 18px ${glow}`,
      }}
    >
      {/* Decorative blob */}
      <div className="lp-kpi-card-blob" />

      {/* Label + Icon Row */}
      <div className="lp-kpi-header">
        <span className="lp-kpi-label">{label}</span>
        <div className="lp-kpi-icon-box">{icon}</div>
      </div>

      {/* Big Number */}
      <div className="lp-kpi-value">
        {value}
        {valueUnit && (
          <span className="lp-kpi-value-unit">{valueUnit}</span>
        )}
      </div>

      {/* Subtext or Badge */}
      {badge ? (
        <div className="lp-kpi-badge">{badge}</div>
      ) : (
        <div className="lp-kpi-sub">{subtext}</div>
      )}
    </div>
  );
}
