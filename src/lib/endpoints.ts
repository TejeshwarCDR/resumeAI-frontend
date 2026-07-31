export const EP = {
  register: "/auth/register",
  login: "/auth/login",
  logout: "/auth/logout",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",

  // Profile — backend prefix is /profile, routes are /me, /personal, /career-goal, /onboarding-step, /completeness
  profile: "/profile/me",
  profileUpdate: "/profile/personal",
  careerGoal: "/profile/career-goal",
  completeness: "/profile/completeness",
  onboardingStep: "/profile/onboarding-step",

  // Portfolio — backend prefix is /portfolio, items are under /items
  portfolio: "/portfolio/items",
  portfolioItem: (id: string) => `/portfolio/items/${id}`,
  portfolioUpload: "/portfolio/upload",
  portfolioType: (type: string) => `/portfolio/items?type=${type}`,

  // Resume
  generate: "/resume/generate",
  generateStatus: (jobId: string) => `/resume/generate/status/${jobId}`,
  resumes: "/resume/versions",
  resume: (id: string) => `/resume/versions/${id}`,
  resumeContent: (id: string) => `/resume/versions/${id}/content`,
  resumeExport: (id: string) => `/resume/versions/${id}/export`,
  resumeEditor: (id: string) => `/resume/versions/${id}/editor`,
  resumeRenderPdf: (id: string) => `/resume/versions/${id}/render-pdf`,
  // Cover letter — backend is /resume/:resumeId/cover-letter (NOT /resume/versions/:id)
  coverLetter: (id: string) => `/resume/${id}/cover-letter`,

  // Analytics
  ats: (id: string) => `/analytics/ats/${id}`,
  gapAnalysis: "/analytics/gap-analysis",
  projectRanking: "/analytics/gap-analysis/project-ranking",
  atsBenchmark: (id: string) => `/analytics/ats/${id}/benchmark`,

  // Job targets
  jobTargets: "/job-targets",
  jobTarget: (id: string) => `/job-targets/${id}`,
  jobTargetImport: "/job-targets/import",

  // Applications
  applications: "/applications",
  application: (id: string) => `/applications/${id}`,

  // LinkedIn import
  linkedinUpload: "/linkedin-import/upload",
  linkedinImport: (id: string) => `/linkedin-import/${id}`,
  linkedinApply: (id: string) => `/linkedin-import/${id}/apply`,

  // Resume import (upload → review → apply)
  resumeImportUpload: "/resume-import/upload",
  resumeImportStatus: (id: string) => `/resume-import/${id}/status`,
  resumeImportApply: (id: string) => `/resume-import/${id}/apply`,
  resumeImportRetry: (id: string) => `/resume-import/${id}/retry`,
  resumeImportDelete: (id: string) => `/resume-import/${id}`,
  resumeImportList: "/resume-import",

  // Settings
  settingsAll: "/settings",
  settingsProfile: "/settings/profile",
  settingsProfilePhoto: "/settings/profile-photo",
  settingsCareer: "/settings/career-goal",
  settingsNotif: "/settings/notifications",
  deleteAccount: "/settings/account",
} as const;
