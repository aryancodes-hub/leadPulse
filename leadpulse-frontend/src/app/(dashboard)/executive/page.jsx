"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/Authguard";
import ExecutiveSidebar from "@/components/for_executive/ExecutiveSidebar";
import ExecutiveHeader from "@/components/for_executive/ExecutiveHeader";
import ExecutiveDashboardView from "@/components/for_executive/ExecutiveDashboardView";
import ExecutiveQueueView from "@/components/for_executive/ExecutiveQueueView";
import ExecutiveCallHistoryTab from "@/components/for_executive/ExecutiveCallHistoryTab";
import ExecutiveEmailView from "@/components/for_executive/ExecutiveEmailView";
import {
  getExecutiveState,
  switchActiveCampaignType,
  MOCK_CALL_CAMPAIGN,
  MOCK_EMAIL_CAMPAIGN,
} from "@/lib/executiveStore";

export default function ExecutivePage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeCampaign, setActiveCampaign] = useState(() => {
    return getExecutiveState().activeCampaign;
  });

  const isCall = activeCampaign?.campaign_type === "call";

  // Listen for store updates
  useEffect(() => {
    const handleUpdate = () => {
      const state = getExecutiveState();
      setActiveCampaign(state.activeCampaign);
    };
    window.addEventListener("exec-store-updated", handleUpdate);
    return () => window.removeEventListener("exec-store-updated", handleUpdate);
  }, []);

  // Handle switching campaign type (Call <-> Email)
  const handleToggleCampaignType = () => {
    const nextType = isCall ? "email" : "call";
    const nextState = switchActiveCampaignType(nextType);
    setActiveCampaign(nextState.activeCampaign);
    setActiveTab("dashboard");
  };

  const handleStartCalling = () => {
    setActiveTab("queue");
  };

  const handleDialLead = () => {
    setActiveTab("queue");
  };

  // Breadcrumbs configuration matching current view & campaign type
  const getBreadcrumbs = () => {
    if (activeTab === "queue") {
      return [
        { label: "Campaigns", onClick: () => setActiveTab("dashboard") },
        { label: activeCampaign?.name || "TechCorp Outreach" },
        { label: "Call Queue" },
      ];
    }
    if (activeTab === "history") {
      return [
        { label: "Executive", onClick: () => setActiveTab("dashboard") },
        { label: "Call History & Logs" },
      ];
    }
    if (activeTab === "callbacks") {
      return [
        { label: "Executive", onClick: () => setActiveTab("dashboard") },
        { label: "Scheduled Callbacks" },
      ];
    }
    if (activeTab === "email_dispatch") {
      return [
        { label: "Campaigns", onClick: () => setActiveTab("dashboard") },
        { label: activeCampaign?.name || "CloudScale Renewal Drip" },
        { label: "50-Batch Dispatch Engine" },
      ];
    }
    if (activeTab === "email_history") {
      return [
        { label: "Campaigns", onClick: () => setActiveTab("dashboard") },
        { label: activeCampaign?.name || "CloudScale Renewal Drip" },
        { label: "Transmission Stream" },
      ];
    }
    return [
      { label: "Dashboard", onClick: () => setActiveTab("dashboard") },
      { label: isCall ? "Call Overview" : "Email Pipeline" },
    ];
  };

  return (
    <AuthGuard allowedRoles={["executive"]}>
      <div className="exec-spa-root">
        {/* Left Dark Navy Sidebar with conditional tabs */}
        <ExecutiveSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          campaignType={activeCampaign?.campaign_type || "call"}
        />

        {/* Main Content Area */}
        <div className="exec-main-wrapper">
          {/* Top Header Bar with Dev Campaign Switcher */}
          <ExecutiveHeader
            breadcrumbs={getBreadcrumbs()}
            campaignType={activeCampaign?.campaign_type || "call"}
            onToggleCampaignType={handleToggleCampaignType}
          />

          {/* Active View conditional on Campaign Type & Tab */}
          {activeTab === "dashboard" && (
            <ExecutiveDashboardView
              activeCampaign={activeCampaign}
              onStartCalling={handleStartCalling}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* Call Campaign specific views */}
          {isCall && activeTab === "queue" && (
            <ExecutiveQueueView activeCampaign={activeCampaign} />
          )}

          {isCall && activeTab === "callbacks" && (
            <ExecutiveCallHistoryTab
              viewMode="callbacks"
              onDialLead={handleDialLead}
            />
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

