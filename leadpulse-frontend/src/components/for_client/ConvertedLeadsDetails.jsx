"use client";

import { FileDown, Users } from "lucide-react";

export default function ConvertedLeadsDetails({ onExportPDF, onViewAllLeads, totalConverted = 0 }) {
  return (
    <div className="client-converted-leads-card">
      <div className="client-converted-leads-header">
        <h4 className="client-converted-leads-title">Converted Leads Details</h4>
        <span className="client-converted-leads-badge">
          {totalConverted.toLocaleString()} Total Leads
        </span>
      </div>

      <div className="client-converted-leads-actions">
        <button
          type="button"
          onClick={onExportPDF}
          className="client-btn client-btn-export"
        >
          <FileDown size={16} />
          <span>Export as PDF</span>
        </button>

        <button
          type="button"
          onClick={onViewAllLeads}
          className="client-btn client-btn-view-all"
        >
          <Users size={16} />
          <span>View All Leads</span>
        </button>
      </div>
    </div>
  );
}
