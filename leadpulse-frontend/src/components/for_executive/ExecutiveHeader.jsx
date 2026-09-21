"use client";

import { Bell, ChevronRight } from "lucide-react";
import AvatarInitial from "../shared/AvatarInitial.jsx";

export default function ExecutiveHeader({ breadcrumbs = [], executiveData }) {
  

  return (
    <header className="exec-header-bar">
      {/* Breadcrumb Navigation - Safely renders nothing if empty */}
      <div className="exec-breadcrumb-container">
        {breadcrumbs.length > 0 &&
          breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={crumb.label || idx} className="exec-crumb-item">
                {idx > 0 && <ChevronRight size={14} className="exec-crumb-sep" />}
                {isLast || !crumb.onClick ? (
                  <span className={`exec-crumb-text ${isLast ? "current" : ""}`}>
                    {crumb.label}
                  </span>
                ) : (
                  <button type="button" onClick={crumb.onClick} className="exec-crumb-link">
                    {crumb.label}
                  </button>
                )}
              </div>
            );
          })}
      </div>

      {/* Right Controls: Notification Bell and Real User Profile */}
      <div className="exec-header-right">
        <button type="button" className="exec-icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="exec-unread-dot" />
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9
          }}
        >
          <AvatarInitial name={executiveData.fullName || executiveData.email}/>
          <div>
            <div
              style={{
                fontWeight: 700,
                color: "#1e293b",
                fontSize: 12
              }}
            >
              {executiveData.fullName
                ? `${executiveData.fullName}`.trim()
                : executiveData.email}
            </div>
            {(executiveData.fullName) && (
              <div
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  fontFamily: "monospace"
                }}
              >
                {executiveData.email}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
