"use client";
import { X } from "lucide-react";
import "@/styles/manager-modals.css";

/**
 * ModalShell — Universal Manager Modal Wrapper
 *
 * Props:
 *   isOpen      {boolean}    - controls visibility
 *   onClose     {function}   - called when X or overlay is clicked
 *   title       {string}     - header title text
 *   maxWidth    {string}     - CSS max-width for the modal box (default: "520px")
 *   noHeader    {boolean}    - set true to hide the standard header (e.g. for gradient hero headers)
 *   footer      {ReactNode}  - optional footer slot (buttons etc.)
 *   children    {ReactNode}  - modal body content
 */
export default function ModalShell({
  isOpen,
  onClose,
  title,
  maxWidth = "520px",
  noHeader = false,
  footer,
  children,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="lp-modal-overlay"
      onClick={(e) => {
        // Close when clicking the dimmed backdrop (not the modal box itself)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="lp-modal-box" style={{ maxWidth }}>

        {/* ── Standard Header (skipped for gradient-hero modals) ── */}
        {!noHeader && (
          <div className="lp-modal-header">
            <span className="lp-modal-title">{title}</span>
            <button className="lp-modal-close" onClick={onClose} aria-label="Close modal">
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Body ─────────────────────────────────────────────── */}
        <div className="lp-modal-body">
          {children}
        </div>

        {/* ── Footer (optional) ────────────────────────────────── */}
        {footer && (
          <div className="lp-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
