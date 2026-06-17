import React from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { LayoutDashboard, FolderOpen, FileText, Compass, Settings, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/data-display/Avatar";
import { useAuth } from "@/store/auth";

const navItems = [
  { path: "/",          label: "Dashboard",   icon: LayoutDashboard },
  { path: "/portfolio", label: "Portfolio",   icon: FolderOpen },
  { path: "/resumes",   label: "Resumes",     icon: FileText },
  { path: "/gap",       label: "Gap Advisor", icon: Compass },
  { path: "/settings",  label: "Settings",    icon: Settings },
];

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div style={{ display: "flex", height: "100%", minHeight: "100vh" }}>
      <nav style={{
        width: 244,
        flexShrink: 0,
        background: "var(--paper-50)",
        borderRight: "1.5px solid var(--line-300)",
        display: "flex",
        flexDirection: "column",
        padding: "22px 16px",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 10,
      }}>
        <div style={{ padding: "0 8px 22px", cursor: "pointer" }} onClick={() => navigate("/")}>
          <Logo variant="wordmark" size={30} />
        </div>

        <button
          onClick={() => navigate("/generate")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            height: 44, marginBottom: 18,
            background: "var(--brass-500)", color: "var(--ink-900)",
            border: "none", borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14,
            cursor: "pointer", boxShadow: "var(--shadow-gold)",
          }}
        >
          <Sparkles size={16} strokeWidth={1.9} /> Craft a resume
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = path === "/"
              ? location.pathname === "/" || location.pathname === "/onboarding"
              : location.pathname.startsWith(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  display: "flex", alignItems: "center", gap: 11,
                  padding: "10px 12px", border: "none",
                  borderRadius: "var(--radius-sm)", cursor: "pointer", textAlign: "left",
                  background: isActive ? "var(--ink-100)" : "transparent",
                  color: isActive ? "var(--ink-900)" : "var(--slate-700)",
                  fontFamily: "var(--font-body)", fontSize: 14.5,
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                <Icon size={18} strokeWidth={1.9} color={isActive ? "var(--ink-700)" : "var(--slate-500)"} />
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10, padding: "12px 8px 0", borderTop: "1px solid var(--line-200)" }}>
          <Avatar name={user?.full_name || "User"} size={36} ring />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.full_name || "Your name"}
            </div>
            <div style={{ fontSize: 12, color: "var(--slate-500)" }}>Premium</div>
          </div>
        </div>
      </nav>

      <main style={{
        flex: 1,
        marginLeft: 244,
        overflowY: "auto",
        background: "var(--bg-page)",
        padding: "40px 48px",
        minHeight: "100vh",
      }}>
        <Outlet />
      </main>
    </div>
  );
}
