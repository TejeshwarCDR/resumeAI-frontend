import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell }          from "@/layouts/AppShell";
import { AuthPage }          from "@/pages/Auth";
import { OnboardingPage }    from "@/pages/Onboarding";
import { DashboardPage }     from "@/pages/Dashboard";
import { PortfolioPage }     from "@/pages/Portfolio";
import { ResumesPage }       from "@/pages/Resumes";
import { GeneratePage }      from "@/pages/Generate";
import { ResumeDetailPage }  from "@/pages/ResumeDetail";
import { ResumeEditorPage }  from "@/pages/ResumeEditor";
import { GapAdvisorPage }    from "@/pages/GapAdvisor";
import { SettingsPage }      from "@/pages/Settings";
import { LoadingSpinner }    from "@/components/feedback/LoadingSpinner";
import { useAuth }           from "@/store/auth";

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "var(--paper-100)",
      }}>
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.onboarding_complete) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: "/login",    element: <AuthPage mode="login" /> },
  { path: "/register", element: <AuthPage mode="register" /> },
  {
    path: "/onboarding",
    element: (
      <OnboardingGuard>
        <OnboardingPage />
      </OnboardingGuard>
    ),
  },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true,               element: <DashboardPage /> },
      { path: "portfolio",         element: <PortfolioPage /> },
      { path: "resumes",           element: <ResumesPage /> },
      { path: "resumes/:id",       element: <ResumeDetailPage /> },
      { path: "resumes/:id/edit",  element: <ResumeEditorPage /> },
      { path: "generate",          element: <GeneratePage /> },
      { path: "gap",               element: <GapAdvisorPage /> },
      { path: "settings",          element: <SettingsPage /> },
    ],
  },
]);
