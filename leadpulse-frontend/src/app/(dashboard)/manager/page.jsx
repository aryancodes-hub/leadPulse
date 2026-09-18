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

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <AuthGuard allowedRoles={["manager", "campaign_manager"]}>
      <div className="mgr-spa-root">
        {/* Navigation Sidebar */}
        <ManagerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Viewport */}
        <div className="mgr-main-wrapper">
          <ManagerHeader activeTab={activeTab} />

          <main className="mgr-content-area">
            {activeTab === "dashboard" && <ManagerDashboard />}
            {activeTab === "clients" && <ManagerClients />}
            {activeTab === "executives" && <ManagerExecutives />}
            {activeTab === "campaigns" && <ManagerCampaigns />}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}