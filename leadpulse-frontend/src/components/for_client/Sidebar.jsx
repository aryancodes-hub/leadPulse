"use client";

import Image from "next/image";
import { LayoutDashboard, Compass, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearAccessToken } from "@/api/api";
import api from "@/api/api";

export default function Sidebar({ activeTab, setActiveTab }) {
  const router = useRouter();
  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } 
    catch(e) { console.error("Logout failed:", e); } 
    finally {
      clearAccessToken();
      router.push("/");
    }
  };
  return (
    <aside className="client-sidebar">
      {/* Top LOGO Box */}
      <div className="client-logo-box">
        <div className="client-logo-inner">
          <Image
            src="/logo.png"
            alt="Lead Pulse Logo"
            width={22}
            height={22}
            priority
            className="client-logo-img"
          />
        </div>
        <span className="client-logo-text">LEAD PULSE</span>
      </div>

      {/* Side Nav Bar Section */}
      <div className="client-nav-section">
        <div className="client-nav-heading">
          <span/>
        </div>

        <nav className="client-nav-menu">
          <button type="button" onClick={() => setActiveTab("dashboard")}
            className={`client-nav-btn ${activeTab === "dashboard" ? "active" : ""}`} >
            <LayoutDashboard size={18} className="client-nav-icon" />
            <span className="client-nav-title">DASHBOARD</span>
          </button>

          <button type="button" onClick={() => setActiveTab("deepdive")}
            className={`client-nav-btn ${activeTab === "deepdive" ? "active" : ""}`} >
            <Compass size={18} className="client-nav-icon" />
            <span className="client-nav-title">DEEP DIVE</span>
          </button>
        </nav>
      </div>

      <div className="client-sidebar-footer">
         <button type="button" onClick={() => setActiveTab("profile")}
          className={`client-nav-btn ${activeTab === "profile" ? "active" : ""} mb-2`} >
          <User size={18} className="client-nav-icon" />
          <span className="client-nav-title">PROFILE</span>
        </button>
        <button type="button" onClick={handleLogout}
          className="client-nav-btn text-red-400 hover:text-red-300 hover:bg-red-900/20 mb-4" >
          <LogOut size={18} className="client-nav-icon" />
          <span className="client-nav-title">SIGN OUT</span>
        </button>
        <div className="client-pulse-indicator">
          <span className="pulse-beacon" />
          <span className="pulse-text">Lead Pulse &bull; Client Portal</span>
        </div>
      </div>
    </aside>
  );
}