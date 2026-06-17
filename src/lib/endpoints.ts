export const EP = {
  register:        "/auth/register",
  login:           "/auth/login",
  logout:          "/auth/logout",

  profile:         "/profile",
  profileUpdate:   "/profile",
  careerGoal:      "/profile/career-goal",
  completeness:    "/profile/completeness",
  onboardingStep:  "/profile/onboarding-step",

  portfolio:       "/portfolio",
  portfolioItem:   (id: string) => `/portfolio/${id}`,
  portfolioUpload: "/portfolio/upload",
  portfolioType:   (type: string) => `/portfolio?type=${type}`,

  generate:        "/resume/generate",
  generateStatus:  (jobId: string) => `/resume/generate/status/${jobId}`,
  resumes:         "/resume/versions",
  resume:          (id: string) => `/resume/versions/${id}`,
  resumeExport:    (id: string) => `/resume/versions/${id}/export`,
  coverLetter:     (id: string) => `/resume/versions/${id}/cover-letter`,

  ats:             (id: string) => `/analytics/ats/${id}`,
  gapAnalysis:     "/analytics/gap-analysis",

  settingsProfile: "/settings/profile",
  settingsCareer:  "/settings/career-goal",
  settingsNotif:   "/settings/notifications",
  deleteAccount:   "/settings/account",
} as const;
