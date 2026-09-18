"use client";

import Image from "next/image";
import { LayoutDashboard, Compass } from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="client-sidebar">
      {/* Top LOGO Box */}
      <div className="client-logo-box">
        <div className="client-logo-inner">
          <Image
            src="/logo.png"
            alt="Lead Pulse Logo"
            width={28}
            height={28}
            priority
            className="client-logo-img"
          />
          <span className="client-logo-text"/>
        </div>
      </div>

      {/* Side Nav Bar Section */}
      <div className="client-nav-section">
        <div className="client-nav-heading">
          <span/>
        </div>

        <nav className="client-nav-menu">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`client-nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
          >
            <div className="client-nav-btn-main">
              <LayoutDashboard size={18} className="client-nav-icon" />
              <span className="client-nav-title">DASHBOARD</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("deepdive")}
            className={`client-nav-btn ${activeTab === "deepdive" ? "active" : ""}`}
          >
            <div className="client-nav-btn-main">
              <Compass size={18} className="client-nav-icon" />
              <span className="client-nav-title">DEEP DIVE</span>
            </div>
          </button>
        </nav>
      </div>

      <div className="client-sidebar-footer">
        <div className="client-pulse-indicator">
          <span className="pulse-beacon" />
          <span className="pulse-text">Lead Pulse &bull; Client Portal</span>
        </div>
      </div>
    </aside>
  );
}