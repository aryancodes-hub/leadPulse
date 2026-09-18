"use client";

import { Bell, User, ChevronRight, Phone, Mail, ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ExecutiveHeader({
  breadcrumbs = [],
  campaignType = "call",
  onToggleCampaignType,
}) {
  const { user } = useAuth();
  const isCall = campaignType === "call";

  return (
    <header className="exec-header-bar">
      {/* Breadcrumb Navigation */}
      <div className="exec-breadcrumb-container">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <div key={crumb.label || idx} className="exec-crumb-item">
              {idx > 0 && <ChevronRight size={14} className="exec-crumb-sep" />}
              {isLast || !crumb.onClick ? (
                <span className={`exec-crumb-text ${isLast ? "current" : ""}`}>
                  {crumb.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className="exec-crumb-link"
                >
                  {crumb.label}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Dev Campaign Type Toggle (Switch between Call & Email campaign) */}
      {onToggleCampaignType && (
        <button
          type="button"
          onClick={onToggleCampaignType}
          className={`exec-dev-campaign-toggle ${
            isCall ? "call-mode" : "email-mode"
          }`}
          title="Click to toggle between Call and Email executive mode"
        >
          {isCall ? <Phone size={13} /> : <Mail size={13} />}
          <span>Campaign Type: <strong>{isCall ? "CALL" : "EMAIL"}</strong></span>
          <span className="exec-toggle-chip">
            <ArrowLeftRight size={11} />
            <span>Switch to {isCall ? "Email" : "Call"}</span>
          </span>
        </button>
      )}

      {/* Right Controls: Notification Bell and User Profile */}
      <div className="exec-header-right">
        <button
          type="button"
          className="exec-icon-btn"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="exec-unread-dot" />
        </button>

        <div className="exec-user-profile">
          <div className="exec-avatar-circle" title={user?.email || "Executive"}>
            <User size={18} className="text-white" />
          </div>
          <div className="exec-user-text">
            <span className="exec-user-name">{user?.name || "Caller Executive"}</span>
            <span className="exec-user-role">Executive</span>
          </div>
        </div>
      </div>
    </header>
  );
}
