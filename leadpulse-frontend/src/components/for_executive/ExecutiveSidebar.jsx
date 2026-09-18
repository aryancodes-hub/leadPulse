"use client";

import { Box, Home, Play, History, CalendarClock, DollarSign, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ExecutiveSidebar({ activeTab, setActiveTab, campaignType = "call" }) {
  const { logout } = useAuth();
  const isCall = campaignType === "call";

  return (
    <aside className="exec-sidebar">
      {/* Top Logo Area */}
      <div className="exec-logo-container">
        <div className="exec-logo-badge">
          <Box size={22} className="exec-logo-icon" />
        </div>
        <span className="exec-logo-text">LOGO</span>
      </div>

      {/* Navigation Menu */}
      <nav className="exec-nav-list">
        <button
          type="button"
          onClick={() => setActiveTab("dashboard")}
          className={`exec-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
        >
          <Home size={18} className="exec-nav-icon" />
          <span className="exec-nav-label">
            DASHBOARD {activeTab === "dashboard" && <span className="exec-active-tag">(Active)</span>}
          </span>
        </button>

        {isCall && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab("queue")}
              className={`exec-nav-item ${activeTab === "queue" ? "active" : ""}`}
            >
              <Play size={18} className="exec-nav-icon fill-current" />
              <span className="exec-nav-label">
                CALL QUEUE {activeTab === "queue" && <span className="exec-active-tag">(Active)</span>}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("callbacks")}
              className={`exec-nav-item ${activeTab === "callbacks" ? "active" : ""}`}
            >
              <CalendarClock size={18} className="exec-nav-icon" />
              <span className="exec-nav-label">
                CALLBACKS {activeTab === "callbacks" && <span className="exec-active-tag">(Active)</span>}
              </span>
            </button>
          </>
        )}
      </nav>

      {/* Motivation Mini-Banner in Sidebar */}
      <div className="exec-sidebar-motivation">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
          <DollarSign size={14} />
          <span>TODAY&apos;S COMMISSION</span>
        </div>
        <div className="text-xl font-mono font-black text-white mt-1">$450.00</div>
        <div className="text-[11px] text-slate-400 mt-0.5">3 Confirmed &bull; 2 Pending Review</div>
      </div>

      {/* Sidebar Footer */}
      <div className="exec-sidebar-footer">
        <button
          type="button"
          onClick={logout}
          className="exec-logout-btn"
          title="Sign out of Executive portal"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
