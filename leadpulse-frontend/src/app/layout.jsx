import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import { AuthProvider } from "@/context/AuthContext";
import RecaptchaWrapper from "@/components/RecaptchaWrapper";

export const metadata = {
  title: "Lead Pulse",
  description: "Campaign management platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <AuthProvider>
          <RecaptchaWrapper>
            <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom px-4">
              <Link href="/" className="navbar-brand d-flex align-items-center gap-2">
                <Image src="/logo.png" alt="Lead Pulse Logo" width={32} height={32} priority />
                <span className="fw-bold">Lead Pulse</span>
              </Link>
            </nav>
            {children}
          </RecaptchaWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
