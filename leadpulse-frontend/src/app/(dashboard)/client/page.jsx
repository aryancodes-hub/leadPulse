"use client";

import { useState } from "react";
import "./client.css";
import Sidebar from "@/components/for_client/Sidebar";
import DashboardView from "@/components/for_client/DashboardView";
import DeepDiveView from "@/components/for_client/DeepDiveView";

export default function ClientPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="client-spa-root">
      <div className="client-spa-layout">
        {/* Left Side Navigation Bar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Right Main Component Area */}
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