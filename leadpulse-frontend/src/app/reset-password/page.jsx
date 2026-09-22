"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"; // 🚀 Added Eye, EyeOff
import { resetPassword } from "@/lib/auth"; 

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  // 🚀 New states for toggling password visibility
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const styles = {
    alertError: { backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "0.75rem", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", marginBottom: "1rem" },
    alertSuccess: { backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "1.5rem", borderRadius: "0.5rem", textAlign: "center" },
    emailTag: { backgroundColor: "#f1f5f9", padding: "0.5rem 0.75rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontFamily: "monospace", color: "#475569", marginBottom: "1rem", boxSizing: "border-box", overflow: "hidden", textOverflow: "ellipsis" },
    label: { display: "block", fontSize: "0.875rem", fontWeight: "bold", color: "#334155", marginBottom: "0.25rem" },
    inputWrapper: { position: "relative", marginBottom: "1rem" },
    icon: { position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" },
    // 🚀 Increased right padding to 2.5rem to make room for the eye icon
    input: { width: "100%", boxSizing: "border-box", padding: "0.625rem 2.5rem", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "0.5rem", outline: "none", fontSize: "0.875rem" },
    button: { width: "100%", backgroundColor: "#2563eb", color: "#ffffff", fontWeight: "bold", padding: "0.75rem", borderRadius: "0.5rem", border: "none", cursor: status === "loading" ? "not-allowed" : "pointer", fontSize: "0.875rem", marginTop: "0.5rem", opacity: status === "loading" ? 0.7 : 1 },
    // 🚀 New style for the eye button
    eyeButton: { position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 0 }
  };

  if (!email || !token) {
    return (
      <div style={{...styles.alertError, alignItems: "flex-start"}}>
        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "0.125rem" }} />
        <span style={{ fontWeight: "600", margin: 0 }}>Invalid reset link. Missing token or email in URL.</span>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      await resetPassword(email, token, newPassword);
      setStatus("success");
      setMessage("Your password has been successfully reset!");
      setTimeout(() => router.push("/login"), 3000); 
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Failed to reset password.");
    }
  };

  if (status === "success") {
    return (
      <div style={styles.alertSuccess}>
        <CheckCircle2 size={32} style={{ color: "#059669", margin: "0 auto 0.75rem auto" }} />
        <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", margin: "0 0 0.25rem 0", color: "#064e3b" }}>Password Updated</h3>
        <p style={{ fontSize: "0.875rem", fontWeight: "500", margin: "0 0 1rem 0", color: "#065f46" }}>{message}</p>
        <p style={{ fontSize: "0.75rem", margin: 0, color: "#059669" }}>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ margin: 0 }}>
      {status === "error" && (
        <div style={styles.alertError}>
          <AlertCircle size={16} /> <span style={{ margin: 0 }}>{message}</span>
        </div>
      )}
      
      <div style={styles.emailTag}>
        Resetting for: <strong style={{ color: "#334155" }}>{email}</strong>
      </div>

      <div>
        <label style={styles.label}>New Password</label>
        <div style={styles.inputWrapper}>
          <Lock size={18} style={styles.icon} />
          <input
            type={showNew ? "text" : "password"} // 🚀 Toggle type
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={styles.input}
            placeholder="••••••••"
          />
          <button type="button" onClick={() => setShowNew(!showNew)} style={styles.eyeButton}>
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label style={styles.label}>Confirm Password</label>
        <div style={styles.inputWrapper}>
          <Lock size={18} style={styles.icon} />
          <input
            type={showConfirm ? "text" : "password"} // 🚀 Toggle type
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.input}
            placeholder="••••••••"
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={styles.eyeButton}>
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={status === "loading"} style={styles.button}>
        {status === "loading" ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}