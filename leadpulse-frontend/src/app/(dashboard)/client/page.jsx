"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import "./client.css";
import Sidebar from "@/components/for_client/Sidebar";
import DashboardView from "@/components/for_client/DashboardView";
import DeepDiveView from "@/components/for_client/DeepDiveView";

export default function ClientPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="client-spa-root">
      {/* Left Side Navigation Bar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Right Main Component Area */}
      <div className="client-main-wrapper">
        {/* Top Header Bar */}
        <header className="client-header-bar">
          <div className="client-breadcrumb">
            <span>Client Portal</span>
            <ChevronRight size={14} />
            <span className="client-breadcrumb-active">
              {activeTab === "dashboard" ? "Dashboard Overview" : "Campaign Deep Dive"}
            </span>
          </div>
          <div className="client-header-right">
            <span className="client-header-badge">
              CLIENT ACCESS
            </span>
          </div>
        </header>

        <main className="client-main-area">
          {activeTab === "dashboard" ? (
            <DashboardView />
          ) : (
            <DeepDiveView />
          )}
        </main>
      </div>
    </div>
  );
}