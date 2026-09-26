"use client";

import "@/app/(dashboard)/manager/manager.css";
import { useState } from "react";
import AuthGuard from "@/components/Authguard";
import ManagerSidebar from "@/components/for_manager/ManagerSidebar";
import ManagerHeader from "@/components/for_manager/ManagerHeader";
import ManagerDashboard from "@/components/for_manager/ManagerDashboard";
import ManagerClients from "@/components/for_manager/ManagerClients";
import ManagerExecutives from "@/components/for_manager/ManagerExecutives";
import ManagerCampaigns from "@/components/for_manager/ManagerCampaigns";
import ProfileView from "@/components/ProfileView";

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <AuthGuard allowedRoles={["manager", "campaign_manager"]}>
      <div className="mgr-spa-root flex h-screen overflow-hidden bg-slate-50">
        {/* Navigation Sidebar */}
        <ManagerSidebar className="w-[260px] shrink-0 bg-[#0b1437] text-white flex flex-col border-r border-white/10 overflow-y-auto" activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Viewport */}
        <div className="mgr-main-wrapper">
          <ManagerHeader activeTab={activeTab} />

          <main className="mgr-content-area flex-1 overflow-y-auto p-8">
            {activeTab === "dashboard" && <ManagerDashboard />}
            {activeTab === "clients" && <ManagerClients />}
            {activeTab === "executives" && <ManagerExecutives />}
            {activeTab === "campaigns" && <ManagerCampaigns />}
            {activeTab === "profile" && <ProfileView />}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}