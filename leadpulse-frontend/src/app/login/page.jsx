"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] =  useState("");
    const [password, setPassword] = useState("");
    const [recaptchaToken, setrecaptchaToken] = useState("adkkadf")
    const [role, setRole] = useState("");

        const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            // 1. Await the login and capture the response data from the backend
            const response = await login({ email, password, recaptchaToken });
            
            // 2. Extract the user's role from the backend response (defaulting to manager just in case)
            const userRole = response?.user?.role || "manager";

            // 3. Route them to their specific dashboard based on their role (e.g., "/manager")
            // (If you have dashes or underscores in roles like 'campaign_manager', you may need to format it to match your route, e.g. "/manager")
            let dashboardRoute = "/" + userRole;
            if (userRole === "campaign_manager") dashboardRoute = "/manager";
            
            router.push(dashboardRoute);
            
        } catch (error) {
            console.error("Login failed:", error.response?.data || error.message);
            alert("Login failed. Check console for details.");
        }
    };
    
       

        // There is no backend yet, so this calls
        // AuthContext's loginDemo() instead of the real
        // `login()` (which is still in AuthContext, wired
        // up to POST /auth/login, untouched and ready).

        // Once the backend exists, swap this block for:
    // and the backend's JWT response will determine
        // the user's role instead of the dropdown below.
        

        // loginDemo({
        //     name: email.split("@")[0] || "Demo User",
        //     email,
        //     role,
        // });

        // if (role === "manager") {
        //     router.push("/manager");
        // }

        // if (role === "executive") {
        //     router.push("/executive");
        // }

        // if (role === "client") {
        //     router.push("/client");
        // }

    const handleForgotPassword = () => {
        /*
        Later:

        POST /api/v1/auth/forgot-password
        (already implemented in src/lib/auth.js as forgotPassword())
        */

        alert(
            "Forgot password will call the backend once it exists."
        );
    };

    const handleResetPassword = () => {
        /*
        Later:

        POST /api/v1/auth/reset-password
        (already implemented in src/lib/auth.js as resetPassword())
        */

        alert(
            "Reset password will call the backend once it exists."
        );
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
                    <p> Sign in to pick up campaigns, leads and reports exactly where your team left them. </p>
                </div>
                <p className="auth-side-foot"> &copy; {new Date().getFullYear()} Lead Pulse </p>
            </div>

            <div className="auth-form-side">

                <div className="auth-card">

                    <h1>Welcome back</h1>

                    <p>
                        Sign in to your workspace.
                    </p>

                    {/* <div className="demo-note">
                        No backend yet — pick a role
                        below to preview that dashboard.
                    </div> */}

                    <form
                        onSubmit={handleSubmit}
                        className="form"
                    >

                        <label>
                            Email

                            <input
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="you@example.com"
                                required
                            />
                        </label>

                        <label>
                            Password

                            <input
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Password"
                                required
                            />
                        </label>

                        {/* <label>
                            Demo Role

                            <select
                                value={role}
                                onChange={(event) =>
                                    setRole(event.target.value)
                                }
                            >
                                <option value="manager">
                                    Campaign Manager
                                </option>

                                <option value="executive">
                                    Executive
                                </option>

                                <option value="client">
                                    Client
                                </option>
                            </select>
                        </label> */}

                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                        >
                            Login
                        </button>

                    </form>

                    <div className="auth-actions">

                        <button
                            onClick={handleForgotPassword}
                            className="link-button"
                        >
                            Forgot password?
                        </button>

                        <button
                            onClick={handleResetPassword}
                            className="link-button"
                        >
                            Reset password
                        </button>

                    </div>

                </div>

            </div>

        </main>
    );
}
