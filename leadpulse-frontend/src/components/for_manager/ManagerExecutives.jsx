"use client";
import { useEffect, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Power } from "lucide-react";
import ModalShell from "@/components/for_manager/modals/ModalShell";
import api from "@/api/api";

export default function ManagerExecutives() {
  const [executives, setExecutives] = useState([]);

  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedExec, setSelectedExec] = useState(null);
  const [execName, setExecName] = useState("");
  const [execEmail, setExecEmail] = useState("");
  const [execPass, setExecPass] = useState("");
  const limit = 10;
  const totalPages = Math.ceil(executives.length / limit) || 1;
  const paginatedExecs = executives.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    // Endpoint #7: GET /api/v1/users
    api
      .get(`/users?page=${page}&limit=${limit}`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (data?.users) setExecutives(data.users);
      })
      .catch((err) => console.log("Using callers mock list", err));
  }, [page]);

  // Endpoint #8: POST /api/v1/users
  const handleCreateExec = async (e) => {
    e.preventDefault();

    // Map strictly to the backend schema [fullName, email, password]
    const payload = {
      fullName: execName,
      email: execEmail,
      password: execPass
    };

    try {
      const res = await api.post("/users", payload);
      const created = res.data?.data ?? res.data;

      // ONLY update the table if the backend succeeds
      setExecutives([
        {
          id: created?.id,
          name: created?.fullName || execName,
          assignedCampaign: "Unassigned",
          email: created?.email || execEmail,
          status: "Active"
        },
        ...executives
      ]);

      setExecName("");
      setExecEmail("");
      setIsCreateModalOpen(false);
    } catch (error) {
      // Replaced mock row with error handling
      console.error("Failed to create executive:", error.response?.data || error);
      alert("Failed to create Executive. See console.");
    }
  };

  // Endpoint #10: PATCH /api/v1/users/:id
  const handleToggleUserActive = async (execId, currentStatus) => {
    const nextStatus = currentStatus === "Active" ? "Inactive" : "Active";
    try {
      // Send the strict boolean required by the backend
      await api.patch(`/users/${execId}`, { isActive: nextStatus === "Active" });
    } catch (e) {
      /* optimistic fallback */
    }

    setExecutives((prev) =>
      prev.map((ex) => (ex.id === execId ? { ...ex, status: nextStatus } : ex))
    );
    if (selectedExec?.id === execId) {
      setSelectedExec((prev) => ({ ...prev, status: nextStatus }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="font-extrabold text-lg text-slate-800">Executive Calling Roster</div>
        <button onClick={() => setIsCreateModalOpen(true)} className="mgr-btn mgr-btn-purple">
          <Plus size={16} /> Create Executive
        </button>
      </div>

      <div className="mgr-section-panel">
        <table className="mgr-data-table">
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Name</th>
              <th>Assigned Campaign (Constraint: 1:1)</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Toggle Active</th>
            </tr>
          </thead>
          <tbody>
            {paginatedExecs.map((exec, index) => (
              <tr key={exec.id} className="mgr-table-row-clickable">
                <td
                  onClick={() => setSelectedExec(exec)}
                  className="font-mono font-bold text-slate-500"
                >
                  {(page - 1) * limit + index + 1}
                </td>
                <td onClick={() => setSelectedExec(exec)} className="font-bold text-slate-900">
                  {exec.name}
                </td>
                <td onClick={() => setSelectedExec(exec)}>
                  <span
                    className={`mgr-badge ${exec.assignedCampaign === "Unassigned" ? "mgr-badge-amber" : "mgr-badge-purple"}`}
                  >
                    {exec.assignedCampaign}
                  </span>
                </td>
                <td onClick={() => setSelectedExec(exec)}>
                  <span
                    className={`mgr-badge ${exec.status === "Active" ? "mgr-badge-green" : "mgr-badge-amber"}`}
                  >
                    {exec.status}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleUserActive(exec.id, exec.status);
                    }}
                    className={`mgr-btn ${exec.status === "Active" ? "mgr-btn-red" : "mgr-btn-outline"} text-xs py-1`}
                  >
                    <Power size={12} /> {exec.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mgr-pagination">
          <span className="mgr-pagination-info">
            Showing Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="mgr-btn mgr-btn-outline"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="mgr-btn mgr-btn-outline"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create Executive */}
      <ModalShell
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Executive Account"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="mgr-btn mgr-btn-outline"
            >
              Cancel
            </button>
            <button type="submit" form="create-exec-form" className="mgr-btn mgr-btn-purple">
              Create Account
            </button>
          </>
        }
      >
        <form id="create-exec-form" onSubmit={handleCreateExec}>
          <div className="lp-form-body">
            <div className="lp-form-group">
              <label className="lp-form-label">Full Name</label>
              <input
                type="text"
                required
                value={execName}
                onChange={(e) => setExecName(e.target.value)}
                className="lp-form-input"
                placeholder="e.g. Jordan Ellis"
              />
            </div>
            <div className="lp-form-group">
              <label className="lp-form-label">Email Address</label>
              <input
                type="email"
                required
                value={execEmail}
                onChange={(e) => setExecEmail(e.target.value)}
                className="lp-form-input"
                placeholder="jordan@team.com"
                autoComplete="new-password" 
              />
            </div>
            <div className="lp-form-group">
              <label className="lp-form-label">Password</label>
              <input
                type="Password"
                required
                value={execPass}
                onChange={(e) => setExecPass(e.target.value)}
                className="lp-form-input"
                placeholder="Password123!"
                autoComplete="new-password" 
              />
            </div>
          </div>
        </form>
      </ModalShell>

      {/* Modal: Executive Profile */}
      <ModalShell
        isOpen={!!selectedExec}
        onClose={() => setSelectedExec(null)}
        noHeader={true}
        maxWidth="460px"
        footer={
          <button onClick={() => setSelectedExec(null)} className="mgr-btn mgr-btn-purple">
            Close Profile
          </button>
        }
      >
        {selectedExec && (
          <>
            {/* Gradient Hero Strip */}
            <div
              style={{
                background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #7c3aed 100%)",
                padding: "18px 24px",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.07)",
                  pointerEvents: "none"
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Executive initial avatar */}
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    border: "1.5px solid rgba(255,255,255,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 900,
                    color: "white",
                    flexShrink: 0
                  }}
                >
                  {(selectedExec.name || selectedExec.fullName)?.[0]?.toUpperCase() || "E"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "white", lineHeight: 1.2 }}>
                    {selectedExec.name || selectedExec.fullName}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.65)",
                      marginTop: 3,
                      fontFamily: "monospace"
                    }}
                  >
                    {selectedExec.email}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "white",
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    padding: "4px 10px",
                    borderRadius: 8,
                    whiteSpace: "nowrap"
                  }}
                >
                  Sales Executive
                </span>
              </div>
            </div>

            {/* Body */}
            <div
              style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}
            >
              {/* Status + Campaign cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div
                  style={{
                    background:
                      selectedExec.status === "Active"
                        ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                        : "linear-gradient(135deg, #fefce8, #fef9c3)",
                    border: `1px solid ${selectedExec.status === "Active" ? "#bbf7d0" : "#fde68a"}`,
                    borderRadius: 12,
                    padding: "12px 14px"
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: selectedExec.status === "Active" ? "#16a34a" : "#ca8a04",
                      marginBottom: 6
                    }}
                  >
                    Account Status
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: selectedExec.status === "Active" ? "#14532d" : "#78350f",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: selectedExec.status === "Active" ? "#22c55e" : "#eab308",
                        display: "inline-block"
                      }}
                    />
                    {selectedExec.status || "Active"}
                  </div>
                </div>

                <div
                  style={{
                    background:
                      selectedExec.assignedCampaign === "Unassigned"
                        ? "linear-gradient(135deg, #fafafa, #f1f5f9)"
                        : "linear-gradient(135deg, #f5f3ff, #ede9fe)",
                    border: `1px solid ${selectedExec.assignedCampaign === "Unassigned" ? "#e2e8f0" : "#c4b5fd"}`,
                    borderRadius: 12,
                    padding: "12px 14px"
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: selectedExec.assignedCampaign === "Unassigned" ? "#94a3b8" : "#7c3aed",
                      marginBottom: 6
                    }}
                  >
                    Campaign
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: selectedExec.assignedCampaign === "Unassigned" ? "#94a3b8" : "#5b21b6"
                    }}
                  >
                    {selectedExec.assignedCampaign || "Unassigned"}
                  </div>
                </div>
              </div>

              {/* Executive ID row */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em"
                  }}
                >
                  Executive ID
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "#475569"
                  }}
                >
                  {selectedExec.id?.substring(0, 18)}…
                </span>
              </div>
            </div>
          </>
        )}
      </ModalShell>
    </div>
  );
}
