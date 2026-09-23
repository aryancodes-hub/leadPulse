"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { resetPassword } from "@/lib/auth"; // Adjust import if your path is different

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  if (!email || !token) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-2 border border-red-200">
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
        <p className="text-sm font-semibold">Invalid reset link. Missing token or email in URL.</p>
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
      setTimeout(() => router.push("/login"), 3000); // Redirect to login
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Failed to reset password.");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-lg text-center">
        <CheckCircle2 className="mx-auto text-emerald-600 mb-3" size={32} />
        <h3 className="text-lg font-bold mb-1">Password Updated</h3>
        <p className="text-sm font-medium mb-4">{message}</p>
        <p className="text-xs text-emerald-600">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={16} /> {message}
        </div>
      )}
      
      <div className="bg-slate-100 px-3 py-2 rounded text-xs font-mono text-slate-600 mb-4 truncate">
        Resetting for: <strong>{email}</strong>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-500 transition-all"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-500 transition-all"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 mt-2"
      >
        {status === "loading" ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Create New Password</h2>
        <p className="text-sm text-slate-500 mb-6">Enter and confirm your new password below.</p>
        
        {/* Next.js requires useSearchParams to be wrapped in a Suspense boundary */}
        <Suspense fallback={<div className="text-center text-slate-400">Loading reset token...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}