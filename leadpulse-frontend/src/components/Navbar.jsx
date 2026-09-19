"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Hide the global dashboard navbar on client and executive SPA routes to preserve their custom layouts
  if (pathname?.startsWith("/client") || pathname?.startsWith("/executive")) {
    return null;
  }

  return (
    <header className="navbar">
      <Link href="/" className="brand">
        <Image src="/logo.png" alt="Lead Pulse" width={28} height={28} priority />
        <span>Lead Pulse</span>
      </Link>
      {user && (
        <div className="nav-right">
          <div className="nav-user">
            <span className="nav-user-name">{user.name || user.email}</span>
            <span className="role-chip">{user.role}</span>
          </div>
          <button
            onClick={logout}
            className="btn btn-secondary btn-sm"
            style={{ padding: "6px 14px", fontSize: "13px" }}
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
