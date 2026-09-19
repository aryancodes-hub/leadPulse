"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";

export default function SequenceTable({ sequences = [], onSelectSequence }) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  const totalPages = Math.ceil(sequences.length / pageSize) || 1;
  const currentSequences = sequences.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

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
    <div className="client-sequence-container">
      <div className="client-table-outer">
        <table className="client-main-table">
          <thead>
            <tr>
              <th className="client-th-seq-id">Sequence ID</th>
              <th className="client-th-seq-name">Sequence Name</th>
              <th className="client-th-seq-desc">Description</th>
            </tr>
          </thead>
          <tbody>
            {currentSequences.map((seq) => (
              <tr 
                key={seq.id} 
                className="client-table-row hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => onSelectSequence(seq)}
                title={`View campaigns for ${seq.name}`}
              >
                <td className="client-td-id font-mono font-semibold">
                  {seq.id}
                </td>
                <td className="client-td-name font-semibold">
                  {seq.name}
                </td>
                <td className="client-td-desc">
                  {seq.description}
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
            Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, sequences.length)} of {sequences.length} sequences
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
