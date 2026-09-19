"use client";
import { ChevronRight, ShieldCheck } from "lucide-react";

const SECTION_LABELS = {
  dashboard: "Dashboard Overview",
  clients: "Client Organizations",
  executives: "Calling Team & Executives",
  campaigns: "Campaign Control & Strategy",
};

export default function ManagerHeader({ activeTab }) {
  return (
    <header className="mgr-header-bar">
      <div className="mgr-breadcrumb">
        <span>Manager</span>
        <ChevronRight size={14} />
        <span className="mgr-breadcrumb-active">
          {SECTION_LABELS[activeTab] || "Dashboard"}
        </span>
      </div>

      <div className="mgr-header-right">
        <span className="mgr-role-badge">
          <ShieldCheck size={12} style={{ display: "inline", marginRight: 4 }} />
          CAMPAIGN MANAGER
        </span>
      </div>
    </header>
  );
}