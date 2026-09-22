"use client";

import { useState } from "react";
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { forgotPassword } from "@/lib/auth"; 

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); 
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      await forgotPassword(email);
      setStatus("success");
      setMessage("If that email exists, a reset link has been sent.");
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Something went wrong.");
    }
  };

  const styles = {
    page: { display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", padding: "1rem", fontFamily: "sans-serif" },
    card: { width: "100%", maxWidth: "400px", backgroundColor: "#ffffff", borderRadius: "1rem", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)", padding: "2rem", border: "1px solid #f1f5f9", boxSizing: "border-box" },
    title: { fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.5rem 0" },
    subtitle: { fontSize: "0.875rem", color: "#64748b", margin: "0 0 1.5rem 0", lineHeight: "1.5" },
    alertSuccess: { backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "1rem", borderRadius: "0.5rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" },
    alertError: { backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "0.75rem", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", marginBottom: "1rem" },
    label: { display: "block", fontSize: "0.875rem", fontWeight: "bold", color: "#334155", marginBottom: "0.25rem" },
    inputWrapper: { position: "relative", marginBottom: "1rem" },
    icon: { position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" },
    input: { width: "100%", boxSizing: "border-box", padding: "0.625rem 1rem 0.625rem 2.5rem", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "0.5rem", outline: "none", fontSize: "0.875rem" },
    button: { width: "100%", backgroundColor: "#2563eb", color: "#ffffff", fontWeight: "bold", padding: "0.75rem", borderRadius: "0.5rem", border: "none", cursor: status === "loading" ? "not-allowed" : "pointer", fontSize: "0.875rem", marginTop: "0.5rem", opacity: status === "loading" ? 0.7 : 1 },
    footer: { marginTop: "1.5rem", textAlign: "center" },
    backLink: { display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", fontWeight: "600", color: "#64748b", textDecoration: "none" }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Reset Password</h2>
        <p style={styles.subtitle}>Enter your email address and we'll send you a link to reset your password.</p>

        {status === "success" ? (
          <div style={styles.alertSuccess}>
            <CheckCircle2 size={18} style={{ marginTop: "0.125rem", flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: "500" }}>{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ margin: 0 }}>
            {status === "error" && (
              <div style={styles.alertError}>
                <AlertCircle size={16} /> <span style={{ margin: 0 }}>{message}</span>
              </div>
            )}
            
            <div>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.icon} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  placeholder="name@company.com"
                />
              </div>
            </div>
            
            <button type="submit" disabled={status === "loading"} style={styles.button}>
              {status === "loading" ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div style={styles.footer}>
          <Link href="/login" style={styles.backLink}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}