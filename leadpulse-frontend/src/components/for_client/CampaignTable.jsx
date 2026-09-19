"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Mail, Phone, Eye } from "lucide-react";

export default function CampaignTable({ campaigns = [], onViewCampaign }) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 5;

  const totalPages = Math.ceil(campaigns.length / pageSize) || 1;
  const currentCampaigns = campaigns.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="client-campaign-table-container">
      <div className="client-table-outer">
        <table className="client-main-table">
          <thead>
            <tr>
              <th className="client-th-camp-id">Campaign ID</th>
              <th className="client-th-camp-name">Campaign Name</th>
              <th className="client-th-camp-type">Type</th>
            </tr>
          </thead>
          <tbody>
            {currentCampaigns.map((camp) => (
              <tr 
                key={camp.id} 
                className="client-table-row hover:bg-slate-50 transition-colors cursor-pointer transform hover:scale-105"
                onClick={() => onViewCampaign(camp)}
                title="View campaign details"
              >
                <td className="client-td-id font-mono font-semibold">
                  {camp.id}
                </td>
                <td className="client-td-name font-semibold">
                  {camp.name}
                </td>
                <td className="client-td-type">
                  <span
                    className={`client-badge ${
                      camp.type === "Email" ? "client-badge-email" : "client-badge-call"
                    }`}
                  >
                    {camp.type === "Email" ? (
                      <Mail size={12} className="inline mr-1" />
                    ) : (
                      <Phone size={12} className="inline mr-1" />
                    )}
                    {camp.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clean Pagination Footer */}
      <div className="client-table-footer">
        <div className="client-pagination-notice">
          <span>
            Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, campaigns.length)} of {campaigns.length} campaigns
          </span>
          <span className="client-page-indicator">
            (Page {currentPage + 1} of {totalPages})
          </span>
        </div>

        <div className="client-pagination-actions">
          {currentPage > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="client-pagination-btn prev-btn"
            >
              <ChevronLeft size={14} />
              <span>PREV</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={currentPage >= totalPages - 1}
            className="client-pagination-btn next-btn"
          >
            <span>NEXT</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
