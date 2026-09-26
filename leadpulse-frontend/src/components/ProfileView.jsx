"use client";
import { useState, useEffect } from "react";
import api from "@/api/api";
import { UserCircle } from "lucide-react";

export default function ProfileView() {
  const [currentName, setCurrentName] = useState("Loading...");
  const [newName, setNewName] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.get("/auth/me").then(res => {
      setCurrentName(res.data?.data?.fullName || "");
      setNewName(res.data?.data?.fullName || "");
    }).catch(err => {
      console.error(err);
      setCurrentName("Error loading profile");
    });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch("/auth/me", { fullName: newName });
      setCurrentName(res.data?.data?.fullName || newName);
      setStatus("Name updated successfully!");
    } catch (err) {
      setStatus("Failed to update name");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "30px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "24px" }}>
        <UserCircle size={32} color="#7c3aed" />
        <h2 style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", margin: 0 }}>My Profile</h2>
      </div>
      
      <div style={{ marginBottom: "24px", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <span style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Current Name</span>
        <span style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>{currentName}</span>
      </div>

      <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>Enter New Name</label>
          <div style={{ display: "flex", gap: "12px" }}>
            <input 
              type="text" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              required 
              style={{ flex: 1, padding: "12px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: 500, outline: "none" }}
            />
            <button type="submit" style={{ padding: "0 24px", background: "#7c3aed", color: "white", fontWeight: 800, borderRadius: "10px", cursor: "pointer", border: "none", transition: "all 0.2s" }}>
              Update Name
            </button>
          </div>
        </div>
      </form>
      
      {status && (
        <div style={{ 
          marginTop: "20px", padding: "12px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 700,
          background: status.includes("Failed") ? "#fef2f2" : "#f0fdf4",
          color: status.includes("Failed") ? "#dc2626" : "#16a34a",
          border: `1px solid ${status.includes("Failed") ? "#fecaca" : "#bbf7d0"}`
        }}>
          {status}
        </div>
      )}
    </div>
  );
}