"use client";

import { useState } from "react";
import { X, Search, UserCheck, Mail, Phone, Building2 } from "lucide-react";

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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600">
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Converted Leads &middot; <span className="text-slate-500 font-semibold">{sequence.name}</span>
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Showing all converted contacts for this sequence
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Controls / Search */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, company, or campaign..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow shadow-sm"
            />
          </div>
          <div className="text-sm font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">
            <span className="text-slate-900">{filteredLeads.length}</span> of {leads.length} leads
          </div>
        </div>

        {/* Modal Body / Table */}
        <div className="flex-1 overflow-auto bg-slate-50/50">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm">
              <tr>
                <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 text-center w-16">#</th>
                <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Lead Profile</th>
                <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Contact Info</th>
                <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Company</th>
                <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Campaign</th>
                <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Converted Date</th>
                <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search size={40} className="mb-3 opacity-20" />
                      <p className="text-base font-semibold text-slate-600">No leads found</p>
                      <p className="text-sm">Try adjusting your search terms.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead, index) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-6 text-center text-sm font-mono font-semibold text-slate-400 group-hover:text-slate-600">
                      {(index + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-bold text-slate-900">{lead.name}</div>
                      {/* <div className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[120px]" title={lead.id}>
                        ID: {lead.id.substring(0,8)}...
                      </div> */}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                        <Mail size={14} className="text-slate-400" />
                        <span className="truncate max-w-[180px]" title={lead.email}>{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Phone size={14} className="text-slate-400" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Building2 size={14} className="text-slate-400" />
                        <span className="truncate max-w-[150px]" title={lead.company}>{lead.company}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
                        {lead.campaignName || "General Outreach"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 font-mono">
                      {lead.convertedDate}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {lead.status || "Converted"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            Data synchronized securely from client leads database
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}