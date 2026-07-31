import React, { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Stepper } from "@/components/navigation/Stepper";
import { Card } from "@/components/data-display/Card";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { Tag } from "@/components/data-display/Tag";
import { Avatar } from "@/components/data-display/Avatar";
import { Seal } from "@/components/brand/Seal";
import { ProgressMeter } from "@/components/data-display/ProgressMeter";
import { Logo } from "@/components/brand/Logo";
import { api } from "@/lib/api";
import { EP } from "@/lib/endpoints";
import { useAuth } from "@/store/auth";
import { usePolling } from "@/lib/hooks/usePolling";
import { isValidArxivUrl, isValidDoi, isValidPhone, isValidUrl, isValidYear } from "@/lib/validation";
import { ArrowLeft, ArrowRight, Plus, X, Phone, MapPin, Linkedin, Github, Globe, Upload, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { ResumeReviewModal, type ParsedResumeData } from "@/components/resume/ResumeReviewModal";

interface ParseDocStatus {
  docId: string;
  status: "pending" | "processing" | "completed" | "failed";
  filename: string;
  parsedData?: ParsedResumeData;
  parsingError?: string;
}

const STEP_TITLES = [
  "Tell us about you",
  "Your contact details",
  "Your education",
  "Your work experience",
  "What you've built",
  "Your research papers",
  "Your skills",
  "Where you're headed",
];
const STEP_LABELS = ["Personal", "Contact", "Academic", "Experience", "Projects", "Research", "Skills", "Goals"];

const ROLE_SKILL_SUGGESTIONS: Record<string, string[]> = {
  "Software Engineering": ["JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL", "Git", "REST APIs", "Docker", "AWS", "System Design", "Algorithms & Data Structures", "CI/CD", "Agile/Scrum"],
  "Data Science": ["Python", "R", "SQL", "Machine Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Statistics", "Data Visualization", "Scikit-learn", "Tableau", "Deep Learning"],
  "Product Management": ["Product Strategy", "Roadmapping", "User Research", "Agile/Scrum", "Jira", "Data Analysis", "A/B Testing", "Stakeholder Management", "SQL", "Figma", "Market Research"],
  "Design": ["Figma", "Adobe XD", "Sketch", "User Research", "Prototyping", "Wireframing", "UI Design", "UX Design", "Design Systems", "Typography", "Accessibility", "After Effects"],
  "Finance": ["Financial Modeling", "Excel", "Valuation", "DCF Analysis", "Financial Reporting", "Python", "SQL", "Risk Management", "Bloomberg Terminal", "Portfolio Management"],
  "Marketing": ["SEO/SEM", "Google Analytics", "Social Media Marketing", "Content Marketing", "Email Marketing", "HubSpot", "A/B Testing", "Copywriting", "Campaign Management", "Salesforce"],
  "Operations": ["Process Optimization", "Supply Chain Management", "Project Management", "Lean/Six Sigma", "Excel", "ERP Systems", "Data Analysis", "Risk Management", "Stakeholder Management"],
  "Other": ["Communication", "Problem Solving", "Leadership", "Project Management", "Microsoft Office", "Data Analysis", "Teamwork", "Critical Thinking", "Time Management"],
};

interface EducationEntry {
  institution_name: string;
  degree: string;
  field_of_study: string;
  gpa: string;
  start_year: string;
  end_year: string;
  is_current: boolean;
}

interface WorkEntry {
  company_name: string;
  title: string;
  start_year: string;
  end_year: string;
  is_current: boolean;
  description: string;
}

interface ResearchPaperEntry {
  id?: string;
  title: string;
  authors: string;
  venue: string;
  year: string;
  doi: string;
  arxivUrl: string;
  publicationUrl: string;
  githubUrl: string;
  description: string;
  status: string;
}

function EducationModal({ onClose, onAdded }: { onClose: () => void; onAdded: (e: EducationEntry) => void }) {
  const [institutionName, setInstitutionName] = useState("");
  const [degree, setDegree] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [gpa, setGpa] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionName.trim() || !degree.trim()) return;
    onAdded({
      institution_name: institutionName.trim(),
      degree: degree.trim(),
      field_of_study: fieldOfStudy.trim(),
      gpa: gpa.trim(),
      start_year: startYear,
      end_year: endYear,
      is_current: isCurrent,
    });
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 500, background: "var(--paper-50)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: "32px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}>
          <X size={20} strokeWidth={1.9} />
        </button>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--ink-900)", margin: "0 0 20px" }}>Add education</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Institution" placeholder="University or college name" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} required />
          <Input label="Degree" placeholder="Bachelor of Science, Master of Engineering…" value={degree} onChange={(e) => setDegree(e.target.value)} required />
          <Input label="Field of study" placeholder="Computer Science, Finance…" value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} />
          <Input label="GPA / CGPA (optional)" placeholder="3.8 / 4.0" value={gpa} onChange={(e) => setGpa(e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Start year" placeholder="2021" value={startYear} onChange={(e) => setStartYear(e.target.value)} />
            {!isCurrent && <Input label="End year" placeholder="2025" value={endYear} onChange={(e) => setEndYear(e.target.value)} />}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-700)", cursor: "pointer" }}>
            <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} style={{ width: 16, height: 16 }} />
            Currently enrolled
          </label>
          <Button type="submit" variant="primary">Add</Button>
        </form>
      </div>
    </div>
  );
}

function WorkModal({ onClose, onAdded }: { onClose: () => void; onAdded: (e: WorkEntry) => void }) {
  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !title.trim()) return;
    onAdded({
      company_name: companyName.trim(),
      title: title.trim(),
      start_year: startYear,
      end_year: endYear,
      is_current: isCurrent,
      description: description.trim(),
    });
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 500, background: "var(--paper-50)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: "32px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}>
          <X size={20} strokeWidth={1.9} />
        </button>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--ink-900)", margin: "0 0 20px" }}>Add work experience</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Job title" placeholder="Software Engineer, Product Manager…" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Company" placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Start year" placeholder="2022" value={startYear} onChange={(e) => setStartYear(e.target.value)} />
            {!isCurrent && <Input label="End year" placeholder="2024" value={endYear} onChange={(e) => setEndYear(e.target.value)} />}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-700)", cursor: "pointer" }}>
            <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} style={{ width: 16, height: 16 }} />
            Currently working here
          </label>
          <Textarea label="Description (optional)" rows={3} placeholder="Key responsibilities and achievements…" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button type="submit" variant="primary">Add</Button>
        </form>
      </div>
    </div>
  );
}

const RESEARCH_STATUSES = ["published", "accepted", "submitted", "under_review", "preprint", "unknown"];

const emptyResearchPaper = (): ResearchPaperEntry => ({
  title: "",
  authors: "",
  venue: "",
  year: "",
  doi: "",
  arxivUrl: "",
  publicationUrl: "",
  githubUrl: "",
  description: "",
  status: "unknown",
});

const validateResearchPaper = (paper: ResearchPaperEntry): string => {
  if (!paper.title.trim()) return "Paper title is required.";
  if (!isValidYear(paper.year)) return "Use a valid publication year.";
  if (!isValidDoi(paper.doi)) return "Use a valid DOI.";
  if (!isValidArxivUrl(paper.arxivUrl)) return "Use a valid arXiv URL.";
  if (!isValidUrl(paper.publicationUrl)) return "Use a valid publication URL.";
  if (!isValidUrl(paper.githubUrl)) return "Use a valid GitHub/code URL.";
  if (paper.githubUrl.trim() && !/github\.com/i.test(paper.githubUrl)) return "GitHub/code URL must be a GitHub URL.";
  return "";
};

const researchPaperPayload = (paper: ResearchPaperEntry) => {
  const doi = paper.doi.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  const primaryUrl = paper.publicationUrl.trim() || paper.arxivUrl.trim() || (doi ? `https://doi.org/${doi}` : "");
  return {
    type: "research_paper",
    source: "manual",
    title: paper.title.trim(),
    description: paper.description.trim() || undefined,
    project_url: primaryUrl || undefined,
    domain_category: "research",
    start_date: paper.year.trim() ? `${paper.year.trim()}-01-01` : undefined,
    extra: {
      authors: paper.authors.split(",").map((author) => author.trim()).filter(Boolean),
      venue: paper.venue.trim() || null,
      year: paper.year.trim() || null,
      doi: doi || null,
      arxivUrl: paper.arxivUrl.trim() || null,
      publicationUrl: paper.publicationUrl.trim() || null,
      githubUrl: paper.githubUrl.trim() || null,
      keywords: [],
      status: paper.status || "unknown",
      source: "manual",
    },
  };
};

function ResearchPaperModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: ResearchPaperEntry;
  onClose: () => void;
  onSaved: (paper: ResearchPaperEntry) => void;
}) {
  const [paper, setPaper] = useState<ResearchPaperEntry>(initial ?? emptyResearchPaper());
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateResearchPaper(paper);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSaved({
      ...paper,
      title: paper.title.trim(),
      authors: paper.authors.trim(),
      venue: paper.venue.trim(),
      year: paper.year.trim(),
      doi: paper.doi.trim(),
      arxivUrl: paper.arxivUrl.trim(),
      publicationUrl: paper.publicationUrl.trim(),
      githubUrl: paper.githubUrl.trim(),
      description: paper.description.trim(),
    });
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 560, background: "var(--paper-50)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: "32px", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}>
          <X size={20} strokeWidth={1.9} />
        </button>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--ink-900)", margin: "0 0 20px" }}>{initial ? "Edit research paper" : "Add research paper"}</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Paper title" placeholder="Paper title" value={paper.title} onChange={(e) => setPaper((prev) => ({ ...prev, title: e.target.value }))} required />
          <Input label="Authors" placeholder="Ada Lovelace, Grace Hopper" value={paper.authors} onChange={(e) => setPaper((prev) => ({ ...prev, authors: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Venue" placeholder="Conference or journal" value={paper.venue} onChange={(e) => setPaper((prev) => ({ ...prev, venue: e.target.value }))} />
            <Input label="Year" placeholder="2026" value={paper.year} onChange={(e) => setPaper((prev) => ({ ...prev, year: e.target.value }))} />
          </div>
          <Input label="DOI" placeholder="10.xxxx/..." value={paper.doi} onChange={(e) => setPaper((prev) => ({ ...prev, doi: e.target.value }))} />
          <Input label="arXiv URL" placeholder="https://arxiv.org/abs/2501.12345" value={paper.arxivUrl} onChange={(e) => setPaper((prev) => ({ ...prev, arxivUrl: e.target.value }))} />
          <Input label="Publication URL" placeholder="Publisher or paper page" value={paper.publicationUrl} onChange={(e) => setPaper((prev) => ({ ...prev, publicationUrl: e.target.value }))} />
          <Input label="GitHub / code URL" placeholder="github.com/you/paper-code" value={paper.githubUrl} onChange={(e) => setPaper((prev) => ({ ...prev, githubUrl: e.target.value }))} />
          <Textarea label="Description / abstract" rows={3} value={paper.description} onChange={(e) => setPaper((prev) => ({ ...prev, description: e.target.value }))} />
          <Select label="Status" options={RESEARCH_STATUSES} value={paper.status} onChange={(e) => setPaper((prev) => ({ ...prev, status: e.target.value }))} />
          {error && <div style={{ color: "var(--danger-600)", fontFamily: "var(--font-body)", fontSize: 13 }}>{error}</div>}
          <Button type="submit" variant="primary">{initial ? "Save changes" : "Add paper"}</Button>
        </form>
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(() => {
    const saved = (user?.onboarding_step ?? 1) - 1;
    return Math.max(0, Math.min(saved, STEP_LABELS.length - 1));
  });
  const last = STEP_LABELS.length - 1;

  // Step 0: Personal
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [roleCategory, setRoleCategory] = useState(user?.target_role_category || "Software Engineering");

  // Step 1: Contact
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [location, setLocation] = useState(user?.location || "");
  const [linkedin, setLinkedin] = useState(user?.linkedin_url || "");
  const [github, setGithub] = useState(user?.github_url || "");
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolio_url || "");

  // Step 2: Academic
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);
  const [showEduModal, setShowEduModal] = useState(false);

  // Step 3: Experience
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [showWorkModal, setShowWorkModal] = useState(false);

  // Step 4: Projects
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [projectTechInput, setProjectTechInput] = useState("");
  const [projectTech, setProjectTech] = useState<string[]>([]);
  const [projectSaved, setProjectSaved] = useState<string[]>([]);
  const [allProjectTechs, setAllProjectTechs] = useState<string[]>([]);
  const [savingProject, setSavingProject] = useState(false);
  const [researchPapers, setResearchPapers] = useState<ResearchPaperEntry[]>([]);
  const [researchModalIndex, setResearchModalIndex] = useState<number | "new" | null>(null);
  const [savingResearchPaper, setSavingResearchPaper] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadReview, setUploadReview] = useState<{ docId: string; filename: string; parsedData: ParsedResumeData } | null>(null);
  const [uploadApplied, setUploadApplied] = useState<string | null>(null);
  const [pollingDoc, setPollingDoc] = useState<{ docId: string; filename: string } | null>(null);
  const [importedSkills, setImportedSkills] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Step 5: Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Step 6: Goals
  const [careerGoal, setCareerGoal] = useState(user?.career_goal || "");

  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingStep, setSavingStep] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.profile_photo_url || "");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const skillSuggestions = useMemo(() => {
    const roleSuggestions = ROLE_SKILL_SUGGESTIONS[roleCategory] || ROLE_SKILL_SUGGESTIONS["Other"];
    const combined = [...new Set([...allProjectTechs, ...roleSuggestions])];
    return combined.filter((s) => !skills.includes(s)).slice(0, 24);
  }, [roleCategory, allProjectTechs, skills]);

  const addSkill = (skill?: string) => {
    const s = (skill ?? skillInput).trim();
    const normalized = s.toLowerCase().replace(/\s+/g, " ");
    const exists = skills.some((item) => item.trim().toLowerCase().replace(/\s+/g, " ") === normalized);
    if (s && !exists) {
      setSkills((prev) => [...prev, s]);
      if (!skill) setSkillInput("");
    }
  };

  const addProjectTech = () => {
    const tech = projectTechInput.trim();
    if (tech && !projectTech.includes(tech)) {
      setProjectTech((prev) => [...prev, tech]);
      setProjectTechInput("");
    }
  };

  const uploadProfilePhoto = async (file: File) => {
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Profile photo must be under 5 MB.");
      return;
    }
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post<{ settings: { profile_photo_s3_key?: string | null; profile_photo_url?: string } }>(
        EP.settingsProfilePhoto,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const nextUrl = response.data.settings.profile_photo_url || "";
      setProfilePhotoUrl(nextUrl);
      if (user) setUser({ ...user, profile_photo_s3_key: response.data.settings.profile_photo_s3_key, profile_photo_url: nextUrl });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Photo upload failed. Please try again.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const removeProfilePhoto = async () => {
    setPhotoError(null);
    setProfilePhotoUrl("");
    try {
      await api.patch(EP.settingsProfile, { profile_photo_s3_key: null });
      if (user) setUser({ ...user, profile_photo_s3_key: null, profile_photo_url: "" });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Could not remove photo. Please try again.");
    }
  };

  const addEducationEntry = async (entry: EducationEntry) => {
    setSaveError(null);
    try {
      await api.post(EP.portfolio, {
        type: "education",
        source: "manual",
        title: entry.degree,
        degree: entry.degree,
        field_of_study: entry.field_of_study || undefined,
        institution_name: entry.institution_name,
        gpa: entry.gpa || undefined,
        start_date: entry.start_year ? `${entry.start_year}-01-01` : undefined,
        end_date: entry.is_current ? undefined : (entry.end_year ? `${entry.end_year}-12-31` : undefined),
        is_current: entry.is_current,
      });
      setEducationEntries((prev) => [...prev, entry]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save education. Please try again.");
    }
  };

  const addWorkEntry = async (entry: WorkEntry) => {
    setSaveError(null);
    try {
      await api.post(EP.portfolio, {
        type: "experience",
        source: "manual",
        title: entry.title,
        company_name: entry.company_name,
        start_date: entry.start_year ? `${entry.start_year}-01-01` : undefined,
        end_date: entry.is_current ? undefined : (entry.end_year ? `${entry.end_year}-12-31` : undefined),
        is_current: entry.is_current,
        description: entry.description || undefined,
      });
      setWorkEntries((prev) => [...prev, entry]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save experience. Please try again.");
    }
  };

  const saveProject = async () => {
    if (!projectTitle.trim()) { setSaveError("Project title is required."); return; }
    setSavingProject(true);
    setSaveError(null);
    try {
      await api.post(EP.portfolio, {
        type: "project",
        source: "manual",
        title: projectTitle.trim(),
        description: projectDesc.trim() || undefined,
        project_url: projectUrl.trim() || undefined,
        tech_stack: projectTech,
      });
      setProjectSaved((prev) => [...prev, projectTitle.trim()]);
      setAllProjectTechs((prev) => [...new Set([...prev, ...projectTech])]);
      setProjectTitle("");
      setProjectDesc("");
      setProjectUrl("");
      setProjectTech([]);
      setProjectTechInput("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save the project. Please try again.");
    } finally {
      setSavingProject(false);
    }
  };

  const saveResearchPaper = async (paper: ResearchPaperEntry) => {
    setSavingResearchPaper(true);
    setSaveError(null);
    try {
      if (paper.id) {
        await api.patch(EP.portfolioItem(paper.id), { ...researchPaperPayload(paper), type: "research_paper" });
        setResearchPapers((prev) => prev.map((item) => item.id === paper.id ? paper : item));
      } else {
        const response = await api.post<{ id: string }>(EP.portfolio, researchPaperPayload(paper));
        setResearchPapers((prev) => [...prev, { ...paper, id: response.data.id }]);
      }
      setResearchModalIndex(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save research paper. Please try again.");
    } finally {
      setSavingResearchPaper(false);
    }
  };

  const deleteResearchPaper = async (paper: ResearchPaperEntry, index: number) => {
    setSaveError(null);
    try {
      if (paper.id) await api.delete(EP.portfolioItem(paper.id));
      setResearchPapers((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not delete research paper. Please try again.");
    }
  };

  const uploadDocument = useCallback(async (file: File) => {
    setUploadingDoc(true);
    setUploadError(null);
    setUploadApplied(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const r = await api.post<{ docId: string; filename: string; status: string; parsedData?: ParsedResumeData }>(
        EP.resumeImportUpload,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      if (r.data.status === "completed" && r.data.parsedData) {
        setUploadReview({ docId: r.data.docId, parsedData: r.data.parsedData, filename: r.data.filename || file.name });
        setUploadingDoc(false);
      } else {
        setPollingDoc({ docId: r.data.docId, filename: r.data.filename || file.name });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not upload this document. Please try again.");
      setUploadingDoc(false);
    }
  }, []);

  const pollEndpoint = pollingDoc ? EP.resumeImportStatus(pollingDoc.docId) : null;
  const { data: pollData, done: pollDone } = usePolling<ParseDocStatus>(
    pollEndpoint,
    2500,
    (d) => d.status === "completed" || d.status === "failed",
  );

  useEffect(() => {
    if (!pollDone || !pollData || !pollingDoc) return;
    setUploadingDoc(false);
    if (pollData.status === "completed" && pollData.parsedData) {
      setUploadReview({ docId: pollingDoc.docId, parsedData: pollData.parsedData, filename: pollingDoc.filename });
    } else {
      setUploadError(pollData.parsingError ?? "AI parsing failed. Please try again.");
    }
    setPollingDoc(null);
  }, [pollDone, pollData]);

  const advance = async () => {
    if (savingStep) return;
    setSavingStep(true);
    setSaveError(null);
    try {
      if (step === 0) {
        await api.patch(EP.profileUpdate, { full_name: fullName, target_role_category: roleCategory });
      } else if (step === 1) {
        if (!isValidPhone(phone)) throw new Error("Enter a valid phone number or leave it blank.");
        if (!isValidUrl(linkedin)) throw new Error("Enter a valid LinkedIn URL or leave it blank.");
        if (!isValidUrl(github)) throw new Error("Enter a valid GitHub URL or leave it blank.");
        if (!isValidUrl(portfolioUrl)) throw new Error("Enter a valid portfolio URL or leave it blank.");
        await api.patch(EP.settingsProfile, {
          phone_number: phone || null,
          location: location || null,
          linkedin_url: linkedin || null,
          github_url: github || null,
          portfolio_url: portfolioUrl || null,
        });
        if (user) setUser({ ...user, phone_number: phone || undefined, location: location || undefined, linkedin_url: linkedin || undefined, github_url: github || undefined, portfolio_url: portfolioUrl || undefined });
      } else if (step === 6 && skills.length > 0) {
        const skillsToSave = skills.filter((s) => !importedSkills.has(s));
        if (skillsToSave.length > 0) {
          const results = await Promise.allSettled(
            skillsToSave.map((s) => api.post(EP.portfolio, { type: "skill", source: "manual", title: s, skill_name: s }))
          );
          const failed = results.find((r) => r.status === "rejected");
          if (failed) {
            const reason = failed.reason;
            throw new Error(reason instanceof Error ? reason.message : "Could not save every skill. Please try again.");
          }
        }
      } else if (step === last) {
        if (careerGoal.trim().length < 10) throw new Error("Career goal must be at least 10 characters.");
        await api.patch(EP.careerGoal, { career_goal: careerGoal });
        await api.patch(EP.onboardingStep, { onboarding_step: last + 1, onboarding_complete: true });
        if (user) setUser({ ...user, onboarding_complete: true, onboarding_step: last + 1 });
        navigate("/");
        return;
      }
      await api.patch(EP.onboardingStep, { onboarding_step: step + 2 });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save this step. Please try again.");
      setSavingStep(false);
      return;
    }
    setSavingStep(false);
    if (step < last) setStep(step + 1);
  };

  const pct = Math.round((step / last) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper-100)", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px 64px" }}>
      <div style={{ width: "100%", maxWidth: 720 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <Logo variant="wordmark" size={28} />
          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-500)" }}>Step {step + 1} of {STEP_LABELS.length}</div>
        </div>

        <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--brass-700)", marginBottom: 6 }}>
          Let's build your portfolio
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 38, color: "var(--ink-900)", margin: "0 0 20px", letterSpacing: "-0.01em" }}>
          {STEP_TITLES[step]}
        </h1>

        <ProgressMeter value={pct} showValue={false} height={6} style={{ marginBottom: 24 }} />
        <Stepper steps={STEP_LABELS} current={step} style={{ marginBottom: 32 }} />

        <Card variant="raised" padding="32px">

          {/* Step 0: Personal */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ padding: "14px 16px", background: "var(--brass-50, #fdf8ee)", border: "1.5px solid var(--brass-200, #e8d5a3)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 700, color: "var(--brass-800, #7a5c1e)", marginBottom: 2 }}>
                    Skip the manual setup
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--brass-700, #9a7230)" }}>
                    Upload your resume and we'll pre-fill everything for you.
                  </div>
                </div>
                <Button
                  variant="gold"
                  size="sm"
                  iconLeft={(uploadingDoc || pollingDoc) ? <Loader2 size={14} strokeWidth={1.9} style={{ animation: "sig-spin 1s linear infinite" }} /> : <Upload size={14} strokeWidth={1.9} />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDoc || !!pollingDoc}
                >
                  {uploadingDoc ? "Uploading…" : pollingDoc ? "Parsing…" : "Import resume"}
                </Button>
              </div>
              {uploadError && (
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--danger-600)", background: "var(--danger-100)", borderRadius: "var(--radius-md)", padding: "8px 12px" }}>
                  {uploadError}
                </div>
              )}
              {uploadApplied && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--success-600)", background: "var(--success-50, #f0fdf4)", borderRadius: "var(--radius-md)", padding: "8px 12px", border: "1px solid var(--success-200, #bbf7d0)" }}>
                  <CheckCircle2 size={15} strokeWidth={2} /> {uploadApplied}
                </div>
              )}
              <Input label="Full name" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <Select
                label="Target role category"
                options={["Software Engineering", "Data Science", "Product Management", "Design", "Finance", "Marketing", "Operations", "Other"]}
                value={roleCategory}
                onChange={(e) => setRoleCategory(e.target.value)}
              />
            </div>
          )}

          {/* Step 1: Contact */}
          {step === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-600)", marginBottom: 4, lineHeight: 1.5 }}>
                These details appear on every resume header. You can skip any fields and add them later from Settings.
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", background: "var(--paper-100)", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)" }}>
                <Avatar name={fullName || user?.full_name || "User"} src={profilePhotoUrl || user?.profile_photo_url} size={62} ring />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)" }}>Profile photo</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)", marginTop: 2 }}>
                    Used in your dashboard and profile. Some resume templates may include it.
                  </div>
                  {photoError && <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--danger-600)", marginTop: 5 }}>{photoError}</div>}
                </div>
                <Button variant="secondary" size="sm" disabled={photoUploading} onClick={() => photoInputRef.current?.click()}>
                  {photoUploading ? "Uploading…" : profilePhotoUrl ? "Replace" : "Upload"}
                </Button>
                {profilePhotoUrl && (
                  <Button variant="ghost" size="sm" onClick={() => void removeProfilePhoto()}>
                    Remove
                  </Button>
                )}
              </div>
              <Input label="Phone number" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} leading={<Phone size={15} strokeWidth={1.9} />} />
              <Input label="City, Country" placeholder="San Francisco, USA" value={location} onChange={(e) => setLocation(e.target.value)} leading={<MapPin size={15} strokeWidth={1.9} />} />
              <Input label="LinkedIn" placeholder="linkedin.com/in/yourprofile" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} leading={<Linkedin size={15} strokeWidth={1.9} />} />
              <Input label="GitHub" placeholder="github.com/yourusername" value={github} onChange={(e) => setGithub(e.target.value)} leading={<Github size={15} strokeWidth={1.9} />} />
              <div style={{ gridColumn: "1 / -1" }}>
                <Input label="Portfolio / Website (optional)" placeholder="yourwebsite.com" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} leading={<Globe size={15} strokeWidth={1.9} />} />
              </div>
            </div>
          )}

          {/* Step 2: Academic */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {educationEntries.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px 0", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-500)", lineHeight: 1.6 }}>
                  Add your degrees, diplomas, and certifications. You can add more later from the Portfolio page.
                </div>
              )}
              {educationEntries.map((entry, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "var(--paper-100)", border: "1px solid var(--line-300)", borderRadius: "var(--radius-md)" }}>
                  <span style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--ink-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>🎓</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>
                      {entry.degree}{entry.field_of_study ? ` · ${entry.field_of_study}` : ""}
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>
                      {entry.institution_name}{entry.start_year ? ` · ${entry.start_year}${entry.is_current ? " — Present" : entry.end_year ? ` — ${entry.end_year}` : ""}` : ""}
                      {entry.gpa ? ` · GPA ${entry.gpa}` : ""}
                    </div>
                  </div>
                  <button onClick={() => setEducationEntries((prev) => prev.filter((_, j) => j !== i))} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}>
                    <X size={16} strokeWidth={1.9} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setShowEduModal(true)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "transparent", border: "1.5px dashed var(--line-300)", borderRadius: "var(--radius-md)", color: "var(--ink-600)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                <Plus size={16} strokeWidth={1.9} /> Add education
              </button>
            </div>
          )}

          {/* Step 3: Experience */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {workEntries.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px 0", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-500)", lineHeight: 1.6 }}>
                  Add your internships, full-time roles, and freelance work. You can add more later from the Portfolio page.
                </div>
              )}
              {workEntries.map((entry, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "var(--paper-100)", border: "1px solid var(--line-300)", borderRadius: "var(--radius-md)" }}>
                  <span style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--ink-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>💼</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{entry.title} · {entry.company_name}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>
                      {entry.start_year}{entry.start_year && " — "}{entry.is_current ? "Present" : entry.end_year}
                    </div>
                  </div>
                  <button onClick={() => setWorkEntries((prev) => prev.filter((_, j) => j !== i))} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}>
                    <X size={16} strokeWidth={1.9} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setShowWorkModal(true)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "transparent", border: "1.5px dashed var(--line-300)", borderRadius: "var(--radius-md)", color: "var(--ink-600)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                <Plus size={16} strokeWidth={1.9} /> Add work experience
              </button>
            </div>
          )}

          {/* Step 4: Projects */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Input label="Project title" placeholder="Portfolio site, ML classifier…" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
                <Input label="Project URL (optional)" placeholder="github.com/you/project" value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} />
                <div style={{ gridColumn: "1 / -1" }}>
                  <Textarea label="Description (optional)" rows={3} placeholder="What did you build, and what changed because of it?" value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {projectTech.map((tech) => (
                      <Tag key={tech} tone="blue" onRemove={() => setProjectTech(projectTech.filter((item) => item !== tech))}>{tech}</Tag>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Input
                      placeholder="React, Python, SQL…"
                      value={projectTechInput}
                      onChange={(e) => setProjectTechInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addProjectTech())}
                      style={{ flex: 1 }}
                    />
                    <Button variant="secondary" onClick={addProjectTech}>Add tech</Button>
                  </div>
                </div>
              </div>
              <Button variant="primary" onClick={saveProject} disabled={savingProject}>
                {savingProject ? "Saving…" : "Save project"}
              </Button>
              {projectSaved.length > 0 && (
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--success-600)", lineHeight: 1.5 }}>
                  Saved: {projectSaved.join(", ")}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Research Papers */}
          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {researchPapers.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px 0", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-500)", lineHeight: 1.6 }}>
                  Add publications, preprints, conference papers, or manuscripts. You can skip this and add papers later from the Portfolio page.
                </div>
              )}
              {researchPapers.map((paper, i) => (
                <div key={paper.id ?? i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "var(--paper-100)", border: "1px solid var(--line-300)", borderRadius: "var(--radius-md)" }}>
                  <span style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--ink-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>§</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{paper.title}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>
                      {[paper.authors, paper.venue, paper.year].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setResearchModalIndex(i)}>Edit</Button>
                  <button onClick={() => void deleteResearchPaper(paper, i)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}>
                    <X size={16} strokeWidth={1.9} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setResearchModalIndex("new")}
                disabled={savingResearchPaper}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "transparent", border: "1.5px dashed var(--line-300)", borderRadius: "var(--radius-md)", color: "var(--ink-600)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                <Plus size={16} strokeWidth={1.9} /> Add research paper
              </button>
            </div>
          )}

          {/* Step 6: Skills */}
          {step === 6 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--slate-700)", marginBottom: 10 }}>Your skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, minHeight: 32 }}>
                  {skills.map((s) => (
                    <Tag key={s} tone="blue" onRemove={() => setSkills(skills.filter((x) => x !== s))}>{s}</Tag>
                  ))}
                  {skills.length === 0 && <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-400)" }}>No skills added yet — type one below or pick from suggestions.</span>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Input
                    placeholder="Type a skill and press Enter"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    style={{ flex: 1 }}
                  />
                  <Button variant="secondary" onClick={() => addSkill()} size="md">Add</Button>
                </div>
              </div>
              {skillSuggestions.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, color: "var(--brass-700)", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    <Sparkles size={13} strokeWidth={1.9} /> Suggested for you
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {skillSuggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => addSkill(s)}
                        style={{ padding: "5px 12px", fontFamily: "var(--font-body)", fontSize: 13, background: "var(--paper-50)", border: "1.5px solid var(--line-300)", borderRadius: "var(--radius-full)", color: "var(--ink-700)", cursor: "pointer" }}
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 7: Goals */}
          {step === 7 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Textarea
                label="What's your career goal?"
                rows={3}
                placeholder="Describe the role, level, and impact you're aiming for. E.g. 'Become a senior product manager at a high-growth B2B SaaS company.'"
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                hint="Signuture uses this to find skill gaps and tailor every resume."
              />
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: "var(--brass-100)", borderRadius: "var(--radius-md)", border: "1px solid var(--brass-200)" }}>
                <Seal size={56} distressed={false} rotate={0} />
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--brass-800)", lineHeight: 1.5 }}>
                  That's everything. We'll seal your portfolio and you can craft your first resume.
                </div>
              </div>
            </div>
          )}

          {saveError && (
            <div style={{ marginTop: 16, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--danger-600)", background: "var(--danger-100)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
              {saveError}
            </div>
          )}
        </Card>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
          <Button variant="ghost" onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0} iconLeft={<ArrowLeft size={16} strokeWidth={1.9} />}>
            Back
          </Button>
          <Button variant={step === last ? "gold" : "primary"} onClick={advance} disabled={savingStep} iconRight={<ArrowRight size={16} strokeWidth={1.9} />}>
            {savingStep ? "Saving…" : step === last ? "Seal & finish" : "Continue"}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: "none" }}
        onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadDocument(file); e.target.value = ""; }}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadProfilePhoto(file); e.target.value = ""; }}
      />

      {showEduModal && <EducationModal onClose={() => setShowEduModal(false)} onAdded={addEducationEntry} />}
      {showWorkModal && <WorkModal onClose={() => setShowWorkModal(false)} onAdded={addWorkEntry} />}
      {researchModalIndex !== null && (
        <ResearchPaperModal
          initial={researchModalIndex === "new" ? undefined : researchPapers[researchModalIndex]}
          onClose={() => setResearchModalIndex(null)}
          onSaved={(paper) => void saveResearchPaper(researchModalIndex === "new" ? paper : { ...paper, id: researchPapers[researchModalIndex]?.id })}
        />
      )}
      {uploadReview && (
        <ResumeReviewModal
          docId={uploadReview.docId}
          filename={uploadReview.filename}
          parsedData={uploadReview.parsedData}
          onClose={() => setUploadReview(null)}
          onApplied={() => {
            const data = uploadReview.parsedData;

            // Pre-populate personal info fields
            if (data.personal?.full_name) setFullName(data.personal.full_name);
            if (data.personal?.phone) setPhone(data.personal.phone);
            if (data.personal?.location) setLocation(data.personal.location);
            if (data.personal?.linkedin_url) setLinkedin(data.personal.linkedin_url);
            if (data.personal?.github_url) setGithub(data.personal.github_url);
            if (data.personal?.portfolio_url) setPortfolioUrl(data.personal.portfolio_url);

            // Pre-populate education for display (already saved to DB by modal)
            if (data.education?.length) {
              setEducationEntries(data.education.map((e) => ({
                institution_name: e.institution_name || "",
                degree: e.degree || e.title,
                field_of_study: e.field_of_study || "",
                gpa: e.gpa || "",
                start_year: e.start_date?.slice(0, 4) || "",
                end_year: e.end_date?.slice(0, 4) || "",
                is_current: e.is_current || false,
              })));
            }

            // Pre-populate work experience for display (already saved to DB by modal)
            if (data.experience?.length) {
              setWorkEntries(data.experience.map((e) => ({
                company_name: e.company_name || "",
                title: e.title,
                start_year: e.start_date?.slice(0, 4) || "",
                end_year: e.end_date?.slice(0, 4) || "",
                is_current: e.is_current || false,
                description: e.description || "",
              })));
            }

            // Track imported skills to avoid double-saving on step 5
            if (data.skills?.length) {
              const names = data.skills.map((s) => s.skill_name || s.title);
              setImportedSkills(new Set(names));
              setSkills((prev) => [...new Set([...prev, ...names])]);
            }

            if (data.projects?.length) {
              const techs = data.projects.flatMap((p) => p.tech_stack ?? []);
              setAllProjectTechs((prev) => [...new Set([...prev, ...techs])]);
            }

            if (data.researchPapers?.length) {
              setResearchPapers(data.researchPapers.map((paper) => ({
                title: paper.title,
                authors: paper.authors?.join(", ") ?? "",
                venue: paper.venue ?? "",
                year: paper.year ?? "",
                doi: paper.doi ?? "",
                arxivUrl: paper.arxivUrl ?? "",
                publicationUrl: paper.publicationUrl ?? "",
                githubUrl: paper.githubUrl ?? "",
                description: paper.abstract ?? "",
                status: paper.status ?? "unknown",
              })));
            }

            setUploadApplied("Resume imported — your details have been pre-filled. Review and edit before continuing.");
            setUploadReview(null);
          }}
        />
      )}
    </div>
  );
}
