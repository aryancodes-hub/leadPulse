"use client";

import { Box, Home, Play, History, CalendarClock, LogOut, Send, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation"; // 🚀 1. Import the router

export default function ExecutiveSidebar({ activeTab, setActiveTab, campaignType = "call", isUnassigned }) {
  const { logout } = useAuth();
  const router = useRouter(); // 🚀 2. Initialize router

  const handleLogout = () => {
    logout();               // Clear tokens
    router.push("/login");  // 🚀 3. Force redirect
  };

  const isCall = campaignType === "call" || campaignType === "Cold Call Blitz";

  return (
    // {/* 🚀 4. Use h-full w-64 flex-shrink-0 to lock it perfectly inside the parent */}
    <aside className="exec-sidebar h-screen w-64 flex-shrink-0 flex flex-col overflow-hidden bg-slate-900">
      
      <div className="flex-1 overflow-y-auto">
        <div className="exec-logo-container">
          <div className="exec-logo-badge">
            <Box size={22} className="exec-logo-icon" />
          </div>
          <span className="exec-logo-text">LEADPULSE</span>
        </div>

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

          {isCall ? (
            <>
              <button 
                type="button" 
                onClick={() => !isUnassigned && setActiveTab("queue")} 
                disabled={isUnassigned}
                className={`exec-nav-item ${activeTab === "queue" ? "active" : ""} ${isUnassigned ? "opacity-50" : ""}`}
                style={isUnassigned ? { cursor: "not-allowed" } : {}}
              >
                <Play size={18} className="exec-nav-icon fill-current" />
                <span className="exec-nav-label">START CALLING</span>
              </button>
              <button 
                type="button" 
                onClick={() => !isUnassigned && setActiveTab("callbacks")} 
                disabled={isUnassigned}
                className={`exec-nav-item ${activeTab === "callbacks" ? "active" : ""} ${isUnassigned ? "opacity-50" : ""}`}
                style={isUnassigned ? { cursor: "not-allowed" } : {}}
              >
                <CalendarClock size={18} className="exec-nav-icon" />
                <span className="exec-nav-label">CALLBACKS</span>
              </button>
            </>
          ) : (
            <hr></hr>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 mt-auto bg-slate-900 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`exec-nav-item w-full transition-colors ${activeTab === "profile" ? "active" : ""}`}
        >
          <User size={18} className="exec-nav-icon" />
          <span className="exec-nav-label font-bold tracking-wider">PROFILE</span>
        </button>
        {/* 🚀 5. Attach handleLogout */}
        <button
          type="button"
          onClick={handleLogout}
          className="exec-nav-item w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut size={18} className="exec-nav-icon" />
          <span className="exec-nav-label font-bold tracking-wider">LOGOUT</span>
        </button>
      </div>
      
    </aside>
  );
}