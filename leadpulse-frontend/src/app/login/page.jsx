"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import api from "@/api/api";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
   const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (!executeRecaptcha) {
                alert("reCAPTCHA not loaded yet");
                return;
            }
      const recaptchaToken = await executeRecaptcha("login");
      const response = await login({ email, password, recaptchaToken });

      const userRole = response?.user?.role;

      // 3. Route them to their specific dashboard based on their role (e.g., "/manager")
      // (If you have dashes or underscores in roles like 'campaign_manager', you may need to format it to match your route, e.g. "/manager")
      let dashboardRoute = "/" + userRole;
      if (userRole === "campaign_manager") dashboardRoute = "/manager";

      router.push(dashboardRoute);
    }
    catch(error) {
      const status = error.response?.status;
      if (status === 401 || status === 403) { router.push("/unauthorized"); } 
      else if (status === 404) { router.push("/not_found"); } 
      else { router.push("/unauthorized"); }
    }
  };

  return (
    <main className="auth-page">
      {/* 🌟 Aurora Background Layer with Floating Fluid Blobs */}
      <div className="aurora-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="auth-side">
        <div className="auth-side-top" />
        <div className="auth-side-copy">
          <span className="hero-badge"> CAMPAIGN INTELLIGENCE PLATFORM </span>
          <h2> Every lead, every call, one dashboard. </h2>
          <p>
            {" "}
            Sign in to pick up campaigns, leads and reports exactly where your team left them.{" "}
          </p>
        </div>
        <p className="auth-side-foot"> &copy; {new Date().getFullYear()} Lead Pulse </p>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <h1>Welcome back</h1>

          <p>Sign in to your workspace.</p>

          {/* <div className="demo-note">
                        No backend yet — pick a role
                        below to preview that dashboard.
                    </div> */}

          <form onSubmit={handleSubmit} className="form">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  required
                  style={{ width: "100%", paddingRight: "2.5rem" }} // Ensure text doesn't hide behind icon
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8"
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button type="submit" className="btn btn-primary w-100">
              Login
            </button>
          </form>

          <div className="auth-actions text-center mt-4">
            <Link
              href="/forgot-password"
              className="link-button"
              style={{ textDecoration: "none" }}
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
