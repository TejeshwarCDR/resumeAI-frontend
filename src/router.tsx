import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppShell }         from "@/layouts/AppShell";
import { AuthPage }         from "@/pages/Auth";
import { OnboardingPage }   from "@/pages/Onboarding";
import { DashboardPage }    from "@/pages/Dashboard";
import { PortfolioPage }    from "@/pages/Portfolio";
import { ResumesPage }      from "@/pages/Resumes";
import { GeneratePage }     from "@/pages/Generate";
import { ResumeDetailPage } from "@/pages/ResumeDetail";
import { GapAdvisorPage }   from "@/pages/GapAdvisor";
import { SettingsPage }     from "@/pages/Settings";

export const router = createBrowserRouter([
  { path: "/login",    element: <AuthPage mode="login" /> },
  { path: "/register", element: <AuthPage mode="register" /> },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true,          element: <DashboardPage /> },
      { path: "portfolio",    element: <PortfolioPage /> },
      { path: "resumes",      element: <ResumesPage /> },
      { path: "resumes/:id",  element: <ResumeDetailPage /> },
      { path: "generate",     element: <GeneratePage /> },
      { path: "gap",          element: <GapAdvisorPage /> },
      { path: "settings",     element: <SettingsPage /> },
      { path: "onboarding",   element: <OnboardingPage /> },
    ],
  },
]);
