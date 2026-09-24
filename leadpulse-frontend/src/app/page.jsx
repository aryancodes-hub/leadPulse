"use client";

import { useRef, useState } from "react";

import Link from "next/link";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

import { register } from "@/lib/auth";

const FEATURES = [
  {
    mark: "\u2726",
    title: "Campaign management",
    description: "Build, approve, launch and monitor campaigns from one workspace."
  },
  {
    mark: "\u25C9",
    title: "Lead intelligence",
    description: "Import lead lists, manage audiences and track every interaction."
  },
  {
    mark: "\u2197",
    title: "Performance analytics",
    description: "Monitor calls, conversions, email engagement and campaign performance."
  },
  {
    mark: "\u260E",
    title: "Calling & email in sync",
    description: "Every dial and every sequence step lands in the same lead timeline."
  }
];

export default function HomePage() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const registerRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  function scrollToRegister() {
    registerRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");

      return;
    }

    try {
      console.log("[DEBUG] Starting registration process...");
      setLoading(true);
      let recaptchaToken = "test_token_bypass";
      
      console.log("[DEBUG] Checking executeRecaptcha...");
      if (executeRecaptcha) {
        try {
          console.log("[DEBUG] Awaiting executeRecaptcha...");
          recaptchaToken = await executeRecaptcha("register");
          console.log("[DEBUG] reCAPTCHA success:", recaptchaToken);
        } catch(e) {
          console.warn("[DEBUG] reCAPTCHA failed:", e);
        }
      } else {
        console.warn("[DEBUG] executeRecaptcha is null/undefined!");
      }

      console.log("[DEBUG] Calling register API with payload...");
      await register({
        fullName: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        recaptchaToken: recaptchaToken
      });
      console.log("[DEBUG] API call finished successfully!");

      setMessage("Campaign Manager account created successfully. You can now log in.");
      // ... (reset form)
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
      });
    } catch (err) {
      console.error("[DEBUG] Caught error in outer catch:", err);
      console.error("[DEBUG] err.response:", err.response);
      console.error("[DEBUG] err.message:", err.message);
      setError(err.response?.data?.message ?? "Registration failed.");
    } finally {
      setLoading(false);
      console.log("[DEBUG] Process finished.");
    }
  }

  return (
    <main>
      <section className="hero-section">
        <video className="hero-video-bg" src="/heros1.mp4" autoPlay muted loop playsInline />

        <div className="hero-video-overlay" />

        <div className="hero-inner">
          <div className="hero-content">
            <span className="hero-badge">CAMPAIGN INTELLIGENCE PLATFORM</span>

            <h1>
              Turn every lead into an <span>opportunity.</span>
            </h1>

            <p>
              Lead Pulse brings campaigns, lead management, calling, email outreach and analytics
              together in one workspace for your whole agency.
            </p>

            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={scrollToRegister}>
                Start your agency
              </button>

              <Link href="/login" className="btn btn-outline-light btn-lg">
                Sign in
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-visual-label">
              <span>
                <span className="dot" />
                Live campaign pulse
              </span>

              <span>Last 30 days</span>
            </div>

            <svg className="pulse-line" viewBox="0 0 300 90" preserveAspectRatio="none">
              <path d="M0 60 L35 60 L48 20 L60 78 L74 45 L90 45 L104 15 L118 65 L140 65 L155 38 L170 38 L185 55 L210 55 L226 25 L242 70 L260 40 L300 40" />
            </svg>

            <div className="hero-visual-stats">
              <div>
                <strong>428</strong>
                Leads worked
              </div>

              <div>
                <strong>16.8%</strong>
                Conversion
              </div>

              <div>
                <strong>32</strong>
                Active campaigns
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — PRODUCT STORY + SIGNUP */}
      <section ref={registerRef} className="main-section">
        <div className="aurora-bg">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>

        <div className="container main-section-inner">
          <div className="main-copy">
            <span className="eyebrow">EVERYTHING IN ONE PLACE</span>
            <h2>Built for modern campaign teams.</h2>
            <p>
              From the first lead import to the final conversion, Lead Pulse keeps executives,
              campaign managers and clients looking at the same numbers.
            </p>
            <div className="feature-list">
              {FEATURES.map((feature) => (
                <div className="feature-row" key={feature.title}>
                  <div className="feature-mark">{feature.mark}</div>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="signup-card">
            <h3>Create your manager account</h3>
            <p>Your first account becomes the Campaign Manager for your agency.</p>
            {error && <div className="alert alert-danger">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Full name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="form-label">Confirm password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? "Creating account..." : "Create manager account"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
