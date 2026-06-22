import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FolderOpen, FileText, Compass,
  Settings, Sparkles, LogOut, ChevronLeft,
} from "lucide-react";
import { Logo }          from "@/components/brand/Logo";
import { Seal }          from "@/components/brand/Seal";
import { Avatar }        from "@/components/data-display/Avatar";
import { LoadingSpinner} from "@/components/feedback/LoadingSpinner";
import { useAuth }       from "@/store/auth";

const NAV_ITEMS = [
  { path: "/",          label: "Dashboard",   icon: LayoutDashboard },
  { path: "/portfolio", label: "Portfolio",   icon: FolderOpen },
  { path: "/resumes",   label: "Resumes",     icon: FileText },
  { path: "/gap",       label: "Gap Advisor", icon: Compass },
  { path: "/settings",  label: "Settings",    icon: Settings },
];

const W_EXPANDED  = 244;
const W_COLLAPSED = 64;
const EASE = "0.25s cubic-bezier(0.4, 0, 0.2, 1)";

export function AppShell() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate("/login", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!loading && user !== null && !user.onboarding_complete) {
      navigate("/onboarding", { replace: true });
    }
  }, [loading, user, navigate]);

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper-100)" }}>
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (user && !user.onboarding_complete) return null;

  const sidebarW = collapsed ? W_COLLAPSED : W_EXPANDED;

  return (
    <div style={{ display: "flex", height: "100%", minHeight: "100vh" }}>

      {/* ── Sidebar ── */}
      <nav style={{
        width: sidebarW,
        flexShrink: 0,
        background: "var(--paper-50)",
        borderRight: "1.5px solid var(--line-300)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 10,
        overflow: "hidden",
        transition: `width ${EASE}`,
      }}>

        {/* ── COLLAPSED ── */}
        {collapsed && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            height: "100%",
            padding: "20px 0",
          }}>
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, lineHeight: 0 }}
            >
              <Seal size={36} distressed={false} rotate={0} />
            </button>

            <button
              onClick={() => setCollapsed(false)}
              title={user?.full_name || "Expand sidebar"}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, lineHeight: 0 }}
            >
              <Avatar name={user?.full_name || "User"} src={user?.profile_photo_url} size={36} ring />
            </button>
          </div>
        )}

        {/* ── EXPANDED ── */}
        {!collapsed && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: "22px 16px",
          }}>
            {/* Header: logo + collapse button */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 8px", marginBottom: 22,
            }}>
              <div style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
                <Logo variant="wordmark" size={30} />
              </div>
              <button
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 26, height: 26,
                  background: "transparent",
                  border: "1px solid var(--line-300)",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  color: "var(--slate-400)",
                  flexShrink: 0,
                }}
              >
                <ChevronLeft size={14} strokeWidth={2} />
              </button>
            </div>

            {/* Craft a resume CTA */}
            <button
              onClick={() => navigate("/generate")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                height: 44, marginBottom: 18,
                background: "var(--brass-500)", color: "var(--ink-900)",
                border: "none", borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14,
                cursor: "pointer", boxShadow: "var(--shadow-gold)",
                whiteSpace: "nowrap",
              }}
            >
              <Sparkles size={16} strokeWidth={1.9} />
              Craft a resume
            </button>

            {/* Nav items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
                const isActive = path === "/"
                  ? location.pathname === "/"
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
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Icon size={18} strokeWidth={1.9} color={isActive ? "var(--ink-700)" : "var(--slate-500)"} />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Footer: user info + logout */}
            <div style={{ marginTop: "auto", borderTop: "1px solid var(--line-200)", paddingTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 8px" }}>
                <Avatar name={user?.full_name || "User"} src={user?.profile_photo_url} size={36} ring />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 700,
                    color: "var(--ink-900)", whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {user?.full_name || "Your name"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--slate-500)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user?.email || ""}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "9px 12px", border: "none", borderRadius: "var(--radius-sm)",
                  cursor: "pointer", background: "transparent", color: "var(--slate-600)",
                  fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500,
                }}
              >
                <LogOut size={16} strokeWidth={1.9} color="var(--slate-500)" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        marginLeft: sidebarW,
        overflowY: "auto",
        background: "var(--bg-page)",
        padding: "40px 48px",
        minHeight: "100vh",
        transition: `margin-left ${EASE}`,
      }}>
        <Outlet />
      </main>
    </div>
  );
}
