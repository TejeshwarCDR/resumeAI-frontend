export const EP = {
  register:        "/auth/register",
  login:           "/auth/login",
  logout:          "/auth/logout",
  forgotPassword:  "/auth/forgot-password",
  resetPassword:   "/auth/reset-password",

  // Profile — backend prefix is /profile, routes are /me, /personal, /career-goal, /onboarding-step, /completeness
  profile:         "/profile/me",
  profileUpdate:   "/profile/personal",
  careerGoal:      "/profile/career-goal",
  completeness:    "/profile/completeness",
  onboardingStep:  "/profile/onboarding-step",

  // Portfolio — backend prefix is /portfolio, items are under /items
  portfolio:       "/portfolio/items",
  portfolioItem:   (id: string) => `/portfolio/items/${id}`,
  portfolioUpload: "/portfolio/upload",
  portfolioType:   (type: string) => `/portfolio/items?type=${type}`,

  // Resume
  generate:        "/resume/generate",
  generateStatus:  (jobId: string) => `/resume/generate/status/${jobId}`,
  resumes:         "/resume/versions",
  resume:          (id: string) => `/resume/versions/${id}`,
  resumeContent:   (id: string) => `/resume/versions/${id}/content`,
  resumeExport:    (id: string) => `/resume/versions/${id}/export`,
  resumeEditor:    (id: string) => `/resume/versions/${id}/editor`,
  resumeRenderPdf: (id: string) => `/resume/versions/${id}/render-pdf`,
  // Cover letter — backend is /resume/:resumeId/cover-letter (NOT /resume/versions/:id)
  coverLetter:     (id: string) => `/resume/${id}/cover-letter`,

  // Analytics
  ats:             (id: string) => `/analytics/ats/${id}`,
  gapAnalysis:     "/analytics/gap-analysis",

  // Settings
  settingsAll:     "/settings",
  settingsProfile: "/settings/profile",
  settingsProfilePhoto: "/settings/profile-photo",
  settingsCareer:  "/settings/career-goal",
  settingsNotif:   "/settings/notifications",
  deleteAccount:   "/settings/account",
} as const;
