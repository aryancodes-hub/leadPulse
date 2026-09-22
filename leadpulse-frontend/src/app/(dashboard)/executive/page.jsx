"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/Authguard";
import ExecutiveSidebar from "@/components/for_executive/ExecutiveSidebar";
import ExecutiveHeader from "@/components/for_executive/ExecutiveHeader";
import ExecutiveDashboardView from "@/components/for_executive/ExecutiveDashboardView";
import ExecutiveQueueView from "@/components/for_executive/ExecutiveQueueView";
import ExecutiveCallHistoryTab from "@/components/for_executive/ExecutiveCallHistoryTab";
import ExecutiveEmailView from "@/components/for_executive/ExecutiveEmailView";
import { getExecutivePerformance } from "@/lib/dashboards";

export default function ExecutivePage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [executiveData, setExecutiveData] = useState(null);
  const [perfData, setPerfData] = useState(null);

  // 🚀 Fetch Real Data on Load!
   const fetchPerformance = () => {
    getExecutivePerformance().then((data) => {
      if (data) {
        setPerfData(data);
      }
      if (data && data.activeCampaign) {
        setActiveCampaign({
          ...data.activeCampaign,
          campaign_type: data.activeCampaign.type 
        });
      }
      if (data && data.executiveDetails) {
        setExecutiveData(data.executiveDetails);
      }
      setIsLoading(false);
    }).catch(err => {
      console.error("Failed to fetch executive data", err);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchPerformance();
  }, [activeTab]);

  const isCall = activeCampaign?.campaign_type === "call" || activeCampaign?.campaign_type === "Cold Call Blitz";

  const handleStartCalling = () => setActiveTab("queue");
  const handleDialLead = () => setActiveTab("queue");

    const getBreadcrumbs = () => {
    if (!isCall) {
      return [
        { label: "Dashboard", onClick: () => setActiveTab("dashboard") }
      ]; 
    }

    if (activeTab === "queue") {
      return [
        { label: "Campaigns", onClick: () => setActiveTab("dashboard") },
        { label: activeCampaign?.name || "Loading..." }, 
        { label: "Call Queue" },
      ];
    }
    if (activeTab === "history") {
      return [{ label: "Executive", onClick: () => setActiveTab("dashboard") }, { label: "Call History" }];
    }
    if (activeTab === "callbacks") {
      return [{ label: "Executive", onClick: () => setActiveTab("dashboard") }, { label: "Scheduled Callbacks" }];
    }
    
    return [
      { label: "Dashboard", onClick: () => setActiveTab("dashboard") },
      { label: "Call Overview" },
    ];
  };

  if (isLoading) return <div className="p-10 text-center text-slate-500 font-bold">Loading Executive Workspace...</div>;

  // Render the rest of your component as normal starting at the return!
  return (
    <AuthGuard allowedRoles={["executive"]}>
      <div className="exec-spa-root flex h-screen w-full overflow-hidden bg-slate-50">
        {/* Left Dark Navy Sidebar with conditional tabs */}
        <ExecutiveSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          campaignType={activeCampaign?.campaign_type || "call"}
        />

        {/* Main Content Area */}
        <div className="exec-main-wrapper flex-1 overflow-y-auto">
          {/* Top Header Bar with Dev Campaign Switcher */}
          <ExecutiveHeader
            breadcrumbs={getBreadcrumbs()}
            executiveData={executiveData} 
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
             <ExecutiveQueueView activeCampaign={activeCampaign} perfData={perfData} refreshData={fetchPerformance} />
          )}

          {isCall && activeTab === "callbacks" && (
            <ExecutiveCallHistoryTab
              viewMode="callbacks"
              onDialLead={handleDialLead}
              callLogs={perfData?.callLogs || []}
            />
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

