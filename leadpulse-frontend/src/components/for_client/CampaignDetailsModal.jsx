"use client";

import { X, Mail, PhoneCall, CheckCircle2 } from "lucide-react";

export default function CampaignDetailsModal({ show, onClose, campaign, sequenceName = "" }) {
  if (!show || !campaign) return null;

  const totalDelivered = campaign.totalDelivered || (campaign.convertedLeads ? Math.round(campaign.convertedLeads * 5.4) : 100);
  const conversionRate = totalDelivered > 0 ? ((campaign.convertedLeads / totalDelivered) * 100).toFixed(1) : "0.0";

  return (
    <div className="client-modal-overlay" onClick={onClose}>
      <div
        className="client-modal-box client-modal-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="client-modal-header">
          <div className="client-modal-title-group">
            <div className="client-modal-badge client-modal-badge-primary">
              {campaign.type === "Email" ? <Mail size={18} /> : <PhoneCall size={18} />}
            </div>
            <div>
              <h3 className="client-modal-title">{campaign.name}</h3>
              <p className="client-modal-subtitle">
                Sequence: <span className="font-medium text-slate-800">{sequenceName}</span> &middot; ID: <span className="font-mono font-semibold">{campaign.id}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="client-modal-close-btn"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="client-modal-body space-y-6">
          {/* Quick Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="client-metric-pill">
              <span className="client-pill-label">Converted Leads</span>
              <span className="client-pill-val text-emerald-600 font-bold">
                {campaign.convertedLeads?.toLocaleString() || 0}
              </span>
            </div>
            <div className="client-metric-pill">
              <span className="client-pill-label">Total Outreached</span>
              <span className="client-pill-val text-slate-800 font-bold">
                {totalDelivered.toLocaleString()}
              </span>
            </div>
            <div className="client-metric-pill">
              <span className="client-pill-label">Conversion Rate</span>
              <span className="client-pill-val text-indigo-600 font-bold">
                {conversionRate}%
              </span>
            </div>
          </div>

          {/* Campaign Details Grid */}
          <div className="client-detail-card">
            <h4 className="client-detail-heading">Campaign Parameters</h4>
            <div className="client-detail-grid">
              <div className="client-detail-item">
                <span className="client-detail-label">Campaign Type</span>
                <span className="client-detail-value">
                  <span className={`client-badge ${campaign.type === "Email" ? "client-badge-email" : "client-badge-call"}`}>
                    {campaign.type === "Email" ? <Mail size={12} className="inline mr-1" /> : <PhoneCall size={12} className="inline mr-1" />}
                    {campaign.type} Campaign
                  </span>
                </span>
              </div>

              <div className="client-detail-item">
                <span className="client-detail-label">Current Status</span>
                <span className="client-detail-value">
                  <span className="client-badge client-badge-success">
                    <CheckCircle2 size={12} className="inline mr-1" />
                    {campaign.status || "Active"}
                  </span>
                </span>
              </div>

              <div className="client-detail-item">
                <span className="client-detail-label">Target Audience</span>
                <span className="client-detail-value font-medium text-slate-700">
                  {campaign.targetAudience || "Enterprise B2B Decision Makers"}
                </span>
              </div>

              <div className="client-detail-item">
                <span className="client-detail-label">Schedule / Execution</span>
                <span className="client-detail-value font-medium text-slate-700">
                  {campaign.schedule || "Daily Automated Cadence"}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="client-detail-card">
            <h4 className="client-detail-heading">Performance Summary</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {campaign.description ||
                `This ${campaign.type.toLowerCase()} campaign was executed as part of the ${sequenceName} workflow, yielding ${campaign.convertedLeads} verified sales-qualified lead conversions at a steady conversion rate of ${conversionRate}%.`}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="client-modal-footer">
          <span className="text-xs text-slate-400">
            Lead Pulse Campaign Intelligence
          </span>
          <button
            type="button"
            onClick={onClose}
            className="client-btn client-btn-primary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
