"use client";

import { useState } from "react";
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { forgotPassword } from "@/lib/auth"; // Adjust import if your path is different

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Reset Password</h2>
        <p className="text-sm text-slate-500 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {status === "success" ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex gap-3 items-start">
            <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-600" size={18} />
            <p className="text-sm font-medium">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === "error" && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle size={16} /> {message}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
            >
              {status === "loading" ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}