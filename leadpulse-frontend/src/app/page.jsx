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
      setLoading(true);
      if (!executeRecaptcha) {
        setError("reCAPTCHA not loaded yet");
        setLoading(false);
        return;
      }
      const recaptchaToken = await executeRecaptcha("register");

      await register({
        fullName: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        recaptchaToken: recaptchaToken
      });

      setMessage("Campaign Manager account created successfully. You can now log in.");

      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
      });
    } catch (err) {
      setError(err.response?.data?.message ?? "Registration failed.");
    } finally {
      setLoading(false);
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
              Lead Pulse brings campaigns, lead management, calling, email outreach and analytics together in one workspace for your whole agency.
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
