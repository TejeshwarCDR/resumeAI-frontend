import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stepper } from "@/components/navigation/Stepper";
import { Card } from "@/components/data-display/Card";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { Tag } from "@/components/data-display/Tag";
import { Seal } from "@/components/brand/Seal";
import { ProgressMeter } from "@/components/data-display/ProgressMeter";
import { Logo } from "@/components/brand/Logo";
import { api } from "@/lib/api";
import { EP } from "@/lib/endpoints";
import { useAuth } from "@/store/auth";
import { ArrowLeft, ArrowRight, Plus, X, Phone, MapPin, Linkedin, Github, Globe, Upload, Loader2 } from "lucide-react";

const STEP_TITLES = [
  "Tell us about you",
  "Your contact details",
  "Where you've worked",
  "What you're great at",
  "What you've built",
  "Where you're headed",
];
const STEP_LABELS = ["Personal", "Contact", "Experience", "Skills", "Projects", "Your goal"];

interface ExperienceEntry {
  type: "experience" | "education";
  title: string;
  company_or_institution: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  degree?: string;
  gpa?: string;
}

function ExperienceModal({ onClose, onAdded }: { onClose: () => void; onAdded: (e: ExperienceEntry) => void }) {
  const [type, setType] = useState<"experience" | "education">("experience");
  const [title, setTitle] = useState("");
  const [org, setOrg] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [degree, setDegree] = useState("");
  const [gpa, setGpa] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !org.trim()) return;
    onAdded({ type, title: title.trim(), company_or_institution: org.trim(), start_date: startDate, end_date: endDate, is_current: isCurrent, degree: degree.trim() || undefined, gpa: gpa.trim() || undefined });
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 500, background: "var(--paper-50)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: "32px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}>
          <X size={20} strokeWidth={1.9} />
        </button>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--ink-900)", margin: "0 0 20px" }}>
          Add experience or education
        </h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {(["experience", "education"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)} style={{ flex: 1, padding: "9px", fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600, background: type === t ? "var(--ink-600)" : "transparent", color: type === t ? "var(--paper-50)" : "var(--slate-700)", border: `1.5px solid ${type === t ? "var(--ink-600)" : "var(--line-300)"}`, borderRadius: "var(--radius-md)", cursor: "pointer" }}>
                {t === "experience" ? "Work Experience" : "Education"}
              </button>
            ))}
          </div>
          <Input label={type === "experience" ? "Job title" : "Degree / Program"} placeholder={type === "experience" ? "Software Engineer" : "Bachelor of Science"} value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label={type === "experience" ? "Company" : "Institution"} placeholder={type === "experience" ? "Company name" : "University or college"} value={org} onChange={(e) => setOrg(e.target.value)} required />
          {type === "education" && (
            <>
              <Input label="Major / Field of study" placeholder="Computer Science" value={degree} onChange={(e) => setDegree(e.target.value)} />
              <Input label="GPA / CGPA (optional)" placeholder="3.8 / 4.0" value={gpa} onChange={(e) => setGpa(e.target.value)} />
            </>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Start year" placeholder="2021" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            {!isCurrent && <Input label="End year" placeholder="2023" value={endDate} onChange={(e) => setEndDate(e.target.value)} />}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-700)", cursor: "pointer" }}>
            <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} style={{ width: 16, height: 16 }} />
            {type === "experience" ? "Currently working here" : "Currently enrolled"}
          </label>
          <Button type="submit" variant="primary">Add</Button>
        </form>
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  // Resume from the last saved step (onboarding_step is 1-indexed, step state is 0-indexed)
  const [step, setStep] = useState(() => {
    const saved = (user?.onboarding_step ?? 1) - 1;
    return Math.max(0, Math.min(saved, STEP_LABELS.length - 1));
  });
  const last = STEP_LABELS.length - 1;

  // Step 0: Personal
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [university, setUniversity] = useState(user?.university || "");
  const [gradYear, setGradYear] = useState(String(user?.graduation_year || new Date().getFullYear() + 1));
  const [roleCategory, setRoleCategory] = useState(user?.target_role_category || "Software Engineering");

  // Step 1: Contact
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [location, setLocation] = useState(user?.location || "");
  const [linkedin, setLinkedin] = useState(user?.linkedin_url || "");
  const [github, setGithub] = useState(user?.github_url || "");
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolio_url || "");

  // Step 2: Experience
  const [experienceEntries, setExperienceEntries] = useState<ExperienceEntry[]>([]);
  const [showExpModal, setShowExpModal] = useState(false);

  // Step 3: Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Step 5: Career goal
  const [careerGoal, setCareerGoal] = useState(user?.career_goal || "");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [projectTechInput, setProjectTechInput] = useState("");
  const [projectTech, setProjectTech] = useState<string[]>([]);
  const [projectSaved, setProjectSaved] = useState<string[]>([]);
  const [savingProject, setSavingProject] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingStep, setSavingStep] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) { setSkills([...skills, s]); setSkillInput(""); }
  };

  const addProjectTech = () => {
    const tech = projectTechInput.trim();
    if (tech && !projectTech.includes(tech)) {
      setProjectTech([...projectTech, tech]);
      setProjectTechInput("");
    }
  };

  const addExperienceEntry = async (entry: ExperienceEntry) => {
    setSaveError(null);
    try {
      const payload: Record<string, unknown> = {
        type: entry.type, source: "manual", title: entry.title, is_current: entry.is_current,
        start_date: entry.start_date ? `${entry.start_date}-01-01` : undefined,
        end_date: entry.is_current ? undefined : (entry.end_date ? `${entry.end_date}-12-31` : undefined),
      };
      if (entry.type === "experience") { payload.company_name = entry.company_or_institution; }
      else {
        payload.institution_name = entry.company_or_institution;
        payload.degree = entry.degree || entry.title;
        if (entry.gpa) payload.gpa = entry.gpa;
      }
      await api.post(EP.portfolio, payload);
      setExperienceEntries((prev) => [...prev, entry]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save this item. Please try again.");
    }
  };

  const saveProject = async () => {
    if (!projectTitle.trim()) {
      setSaveError("Project title is required.");
      return;
    }
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

  const uploadDocument = async (file: File) => {
    setUploadingDoc(true);
    setUploadResult(null);
    setSaveError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const r = await api.post<{ extractedItemCount: number }>(
        EP.portfolioUpload,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setUploadResult(`${r.data.extractedItemCount} portfolio items imported from ${file.name}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not upload this document. Please try again.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const advance = async () => {
    if (savingStep) return;
    setSavingStep(true);
    setSaveError(null);
    try {
      if (step === 0) {
        await api.patch(EP.profileUpdate, {
          full_name: fullName, university, graduation_year: parseInt(gradYear) || undefined, target_role_category: roleCategory,
        });
      } else if (step === 1) {
        // Save contact details
        await api.patch(EP.settingsProfile, {
          phone_number:  phone || null,
          location:      location || null,
          linkedin_url:  linkedin || null,
          github_url:    github || null,
          portfolio_url: portfolioUrl || null,
        });
        // Also update local user state
        if (user) setUser({ ...user, phone_number: phone || undefined, location: location || undefined, linkedin_url: linkedin || undefined, github_url: github || undefined, portfolio_url: portfolioUrl || undefined });
      } else if (step === 3 && skills.length > 0) {
        const results = await Promise.allSettled(
          skills.map((s) => api.post(EP.portfolio, { type: "skill", source: "manual", title: s, skill_name: s }))
        );
        const failed = results.find((result) => result.status === "rejected");
        if (failed) throw new Error("Could not save every skill. Please try again.");
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <div style={{ gridColumn: "1 / -1", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-500)", background: "var(--paper-100)", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: "10px 14px", lineHeight: 1.5 }}>
                We've pre-filled what you shared during sign-up — adjust anything as needed.
              </div>
              <Input label="Full name" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <Input label="University" placeholder="Your university or college" value={university} onChange={(e) => setUniversity(e.target.value)} />
              <Input label="Graduation year" placeholder={String(new Date().getFullYear() + 1)} value={gradYear} onChange={(e) => setGradYear(e.target.value)} />
              <div style={{ gridColumn: "1 / -1" }}>
                <Select label="Target role category" options={["Software Engineering", "Data Science", "Product Management", "Design", "Finance", "Marketing", "Operations", "Other"]} value={roleCategory} onChange={(e) => setRoleCategory(e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 1: Contact details */}
          {step === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-600)", marginBottom: 4, lineHeight: 1.5 }}>
                These details appear on every resume header. You can skip any fields and add them later from Settings.
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

          {/* Step 2: Experience */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {experienceEntries.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px 0", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-500)", lineHeight: 1.6 }}>
                  Add your work experience and education. You can also add more later from the Portfolio page.
                </div>
              )}
              {experienceEntries.map((entry, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "var(--paper-100)", border: "1px solid var(--line-300)", borderRadius: "var(--radius-md)" }}>
                  <span style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--ink-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
                    {entry.type === "experience" ? "💼" : "🎓"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{entry.title} · {entry.company_or_institution}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>
                      {entry.start_date}{entry.start_date && " — "}{entry.is_current ? "Present" : entry.end_date}
                    </div>
                  </div>
                  <button onClick={() => setExperienceEntries((prev) => prev.filter((_, j) => j !== i))} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}>
                    <X size={16} strokeWidth={1.9} />
                  </button>
                </div>
              ))}
              <button onClick={() => setShowExpModal(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "transparent", border: "1.5px dashed var(--line-300)", borderRadius: "var(--radius-md)", color: "var(--ink-600)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={16} strokeWidth={1.9} /> Add experience or education
              </button>
            </div>
          )}

          {/* Step 3: Skills */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--slate-700)", marginBottom: 10 }}>Your skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {skills.map((s) => (
                    <Tag key={s} tone="blue" onRemove={() => setSkills(skills.filter((x) => x !== s))}>{s}</Tag>
                  ))}
                  {skills.length === 0 && <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-400)" }}>No skills added yet — type one below.</span>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Input placeholder="Type a skill and press Enter" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} style={{ flex: 1 }} />
                  <Button variant="secondary" onClick={addSkill} size="md">Add</Button>
                </div>
              </div>
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
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button variant="primary" onClick={saveProject} disabled={savingProject}>
                  {savingProject ? "Saving…" : "Save project"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadDocument(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  variant="secondary"
                  iconLeft={uploadingDoc ? <Loader2 size={15} strokeWidth={1.9} style={{ animation: "sig-spin 1s linear infinite" }} /> : <Upload size={15} strokeWidth={1.9} />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDoc}
                >
                  {uploadingDoc ? "Uploading…" : "Upload resume"}
                </Button>
              </div>
              {(projectSaved.length > 0 || uploadResult) && (
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--success-700, #15803d)", lineHeight: 1.5 }}>
                  {projectSaved.length > 0 && <div>Saved: {projectSaved.join(", ")}</div>}
                  {uploadResult && <div>{uploadResult}</div>}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Career goal */}
          {step === 5 && (
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

      {showExpModal && <ExperienceModal onClose={() => setShowExpModal(false)} onAdded={addExperienceEntry} />}
    </div>
  );
}
