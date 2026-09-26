"use client";
import React, { useState, useEffect } from "react";
import { Loader2, FileSpreadsheet, Building2, Calendar, Hash, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/api/api";

export default function ManagerLeadLists() {
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 10;
  const totalPages = Math.ceil(lists.length / limit) || 1;
  const paginatedLists = lists.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    fetchLeadLists();
  }, []);

  const fetchLeadLists = async () => {
    try {
      const res = await api.get("/lead-lists");
      setLists(res.data?.data || []);
    } catch (e) {
      console.error(e);
      alert("Failed to load lead lists");
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <div className="flex flex-col gap-6">
      {/* Header Section */}

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
            <p className="text-slate-400 font-medium text-sm">Loading lead lists...</p>
          </div>
        ) : (
          <div className="mgr-section-panel">
            <table className="mgr-data-table">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    List Name
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Leads
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Assigned Sequences
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Uploaded On
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedLists.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-4 rounded-full bg-slate-50 mb-3">
                          <FileSpreadsheet className="text-slate-300" size={32} />
                        </div>
                        <p className="text-slate-600 font-semibold">No lead lists found</p>
                        <p className="text-slate-400 text-sm mt-1">Uploaded lists will appear here.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLists.map((list) => {
                    const latestJob = list.importJobs?.[0];
                    const totalLeads = latestJob ? latestJob.totalRows : 0;
                    
                    return (
                      <tr key={list.id} className="hover:bg-slate-50/70 transition-colors group">
                        {/* List Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{list.name}</div>
                        </td>
                        
                        {/* Client */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-slate-600 font-medium">
                            <Building2 size={14} className="text-slate-400" />
                            {list.client?.name || "Unknown Client"}
                          </div>
                        </td>
                        
                        {/* Total Leads */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50/80 text-indigo-700 font-mono text-xs font-bold border border-indigo-100/50">
                            <Hash size={12} className="text-indigo-500" />
                            {totalLeads}
                          </div>
                        </td>
                        
                        {/* Sequences */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {list.sequences && list.sequences.length > 0 ? (
                              list.sequences.map(seq => (
                                <span 
                                  key={seq.id} 
                                  className="inline-flex items-center px-2 py-1 rounded bg-purple-50 text-purple-700 text-xs font-semibold ring-1 ring-inset ring-purple-600/20"
                                >
                                  {seq.name}
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded bg-slate-50 text-slate-500 text-xs font-medium ring-1 ring-inset ring-slate-500/10">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </td>
                        
                        {/* Uploaded On */}
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                          <div className="flex items-center gap-2 font-medium">
                            <Calendar size={14} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                            {new Date(list.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {lists.length > 0 && (
              <div className="mgr-pagination">
                <span className="mgr-pagination-info">
                  Showing Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="mgr-btn mgr-btn-outline"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="mgr-btn mgr-btn-outline"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
