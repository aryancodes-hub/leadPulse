"use client";
import { LayoutDashboard, Users, UserCheck, Megaphone, LogOut, User } from "lucide-react";
import api, { clearAccessToken } from "@/api/api"; // Adjust path if using @/utils/api

const NAV_ITEMS = [
  { id: "dashboard", label: "DASHBOARD", icon: LayoutDashboard },
  { id: "clients", label: "CLIENTS", icon: Users },
  { id: "executives", label: "EXECUTIVES", icon: UserCheck },
  { id: "campaigns", label: "CAMPAIGNS", icon: Megaphone },
];

export default function ManagerSidebar({ activeTab, setActiveTab }) {
  // Endpoint #2: POST /api/v1/auth/logout
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Logout request failed, clearing local session", e);
    } finally {
      clearAccessToken();
      window.location.href = "/login";
    }
  };

  return (
    <aside className="mgr-sidebar">
      <div className="mgr-logo-container">
        <div className="mgr-logo-badge">
          <Megaphone size={20} className="mgr-logo-icon" />
        </div>
        <span className="mgr-logo-text">MANAGER</span>
      </div>

      <nav className="mgr-nav-list">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`mgr-nav-item ${activeTab === id ? "active" : ""}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="mgr-sidebar-footer">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`mgr-nav-item w-full transition-colors ${activeTab === "profile" ? "active" : ""}`}
          style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "10px", fontWeight: 700, fontSize: "12px", letterSpacing: "0.05em", background: activeTab === "profile" ? "rgba(124, 58, 237, 0.15)" : "transparent", color: activeTab === "profile" ? "#a78bfa" : "#94a3b8" }}
        >
          <User size={18} />
          <span>PROFILE</span>
        </button>
        <button type="button" onClick={handleLogout} className="mgr-logout-btn">
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}