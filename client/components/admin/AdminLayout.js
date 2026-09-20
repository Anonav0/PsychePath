"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import authService from "../../services/authService";

export default function AdminLayout({ children, title, subtitle }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    setUser(currentUser);
    setLoading(false);
  }, [router, pathname]);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "5rem",
          color: "var(--text-muted)",
        }}
      >
        Verifying administrator credentials...
      </div>
    );
  }

  // Access Denied if authenticated user is not an ADMIN
  if (user && user.role !== "ADMIN") {
    return (
      <div
        style={{
          maxWidth: "500px",
          margin: "4rem auto",
          padding: "2.5rem",
          background: "var(--bg-surface)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚫</div>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "#f87171",
            marginBottom: "0.5rem",
          }}
        >
          Access Denied
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.95rem",
            lineHeight: 1.5,
            marginBottom: "1.5rem",
          }}
        >
          You do not have administrative permissions to view or manage this
          section. This area is strictly reserved for platform administrators.
        </p>
        <Link href="/dashboard" className="btn-primary-small">
          Return to Student Dashboard
        </Link>
      </div>
    );
  }

  const navItems = [
    { label: "Overview", href: "/admin", icon: "📊" },
    { label: "Learners", href: "/admin/learners", icon: "👥" },
    { label: "Assessments", href: "/admin/assessments", icon: "📋" },
    { label: "Curriculum", href: "/admin/curriculum", icon: "📚" },
  ];

  const isNavActive = (href) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div
      className="admin-container"
      style={{ display: "flex", minHeight: "calc(100vh - 70px)" }}
    >
      {/* Admin Sidebar */}
      <aside
        style={{
          width: "240px",
          background: "var(--bg-surface, #1e293b)",
          borderRight: "1px solid var(--border-color, #334155)",
          padding: "1.5rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 0.5rem" }}>
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              letterSpacing: "0.05em",
              fontWeight: 700,
              marginBottom: "0.25rem",
            }}
          >
            Admin Console
          </div>
          <div
            style={{
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            Management
          </div>
        </div>

        <nav
          style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
        >
          {navItems.map((item) => {
            const active = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: active ? 700 : 500,
                  color: active ? "#ffffff" : "var(--text-secondary)",
                  backgroundColor: active
                    ? "var(--primary, #6366f1)"
                    : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            marginTop: "auto",
            borderTop: "1px solid var(--border-color)",
            paddingTop: "1rem",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              textDecoration: "none",
            }}
          >
            <span>↩</span>
            <span>Exit to Student App</span>
          </Link>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main
        style={{
          flex: 1,
          padding: "2rem",
          overflowX: "auto",
          background: "var(--bg-main, #0f172a)",
        }}
      >
        {(title || subtitle) && (
          <div style={{ marginBottom: "2rem" }}>
            {title && (
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: "0 0 0.25rem 0",
                }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                  margin: 0,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
