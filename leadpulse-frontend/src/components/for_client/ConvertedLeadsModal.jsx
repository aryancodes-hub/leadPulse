"use client";

import { useState } from "react";
import { X, Search, Download, UserCheck, Mail, Phone, Building2 } from "lucide-react";

export default function ConvertedLeadsModal({ show, onClose, sequence, leads = [] }) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!show || !sequence) return null;

  const filteredLeads = leads.filter((lead) => {
    const term = searchTerm.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(term) ||
      lead.email?.toLowerCase().includes(term) ||
      lead.company?.toLowerCase().includes(term) ||
      lead.campaignName?.toLowerCase().includes(term) ||
      lead.id?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="client-modal-overlay" onClick={onClose}>
      <div
        className="client-modal-box client-modal-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="client-modal-header">
          <div className="client-modal-title-group">
            <div className="client-modal-badge">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="client-modal-title">
                Converted Leads &middot; {sequence.name}
              </h3>
              <p className="client-modal-subtitle">
                Showing all {leads.length} converted leads for Sequence ID: <span className="font-mono font-semibold">{sequence.id}</span>
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

        {/* Modal Controls */}
        <div className="client-modal-controls">
          <div className="client-search-wrapper">
            <Search size={16} className="client-search-icon" />
            <input
              type="text"
              placeholder="Search leads by name, email, company, or campaign..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="client-search-input"
            />
          </div>
          <span className="client-results-count">
            {filteredLeads.length} of {leads.length} leads
          </span>
        </div>

        {/* Modal Body / Table */}
        <div className="client-modal-body">
          <div className="client-table-wrapper">
            <table className="client-table">
              <thead>
                <tr>
                  <th>Lead ID</th>
                  <th>Lead Name</th>
                  <th>Contact Info</th>
                  <th>Affiliation</th>
                  <th>Campaign</th>
                  <th>Converted Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      No converted leads match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead, index) => (
                    <tr key={lead.id}>
                      <td className="font-mono font-semibold text-slate-500 text-center">
                        {index + 1}
                      </td>
                      <td className="font-semibold text-slate-900">
                        {lead.name}
                      </td>
                      <td className="text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail size={12} className="text-slate-400" />
                          <span>{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 mt-0.5 text-slate-500">
                            <Phone size={12} className="text-slate-400" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="text-xs font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={12} className="text-slate-400" />
                          <span>{lead.company}</span>
                        </div>
                      </td>
                      <td>
                        <span className="client-badge client-badge-indigo">
                          {lead.campaignName}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500 font-mono">
                        {lead.convertedDate}
                      </td>
                      <td>
                        <span className="client-badge client-badge-success">
                          {lead.status || "Converted"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="client-modal-footer">
          <span className="text-xs text-slate-500">
            Data synchronized from client leads database
          </span>
          <button
            type="button"
            onClick={onClose}
            className="client-btn client-btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
