import React, { useState } from "react";
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
import { ArrowLeft, ArrowRight, Stamp, UploadCloud, Briefcase, GraduationCap, CheckCircle2, Plus } from "lucide-react";

const STEP_TITLES = [
  "Tell us about you",
  "Where you've worked",
  "What you're great at",
  "What you've built",
  "Where you're headed",
];
const STEP_LABELS = ["Personal", "Experience", "Skills", "Projects", "Your goal"];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const last = STEP_LABELS.length - 1;

  const [fullName, setFullName] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [university, setUniversity] = useState("");
  const [gradYear, setGradYear] = useState("2025");
  const [roleCategory, setRoleCategory] = useState("Software Engineering");
  const [careerGoal, setCareerGoal] = useState("");
  const [skills, setSkills] = useState<string[]>(["Systems Design", "TypeScript", "Go"]);
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const advance = async () => {
    try {
      if (step === 0) {
        await api.patch(EP.profileUpdate, { full_name: fullName, university, graduation_year: parseInt(gradYear), target_role_category: roleCategory });
      } else if (step === 1) {
        // experience step — handled by user entering manually
      } else if (step === 2) {
        await api.post(EP.portfolio, { type: "skills", items: skills });
      } else if (step === 3) {
        // projects step
      } else if (step === 4) {
        await api.patch(EP.careerGoal, { career_goal: careerGoal });
        await api.patch(EP.profileUpdate, { onboarding_completed: true });
        navigate("/");
        return;
      }
      await api.patch(EP.onboardingStep, { step: step + 1 });
    } catch {
      // proceed even if API isn't up yet
    }
    if (step < last) setStep(step + 1);
  };

  const pct = Math.round(((step) / last) * 100);

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
          {step === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <Input label="Full name" placeholder="Ada Lovelace" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Input label="Email" type="email" placeholder="you@email.com" value={emailVal} onChange={(e) => setEmailVal(e.target.value)} />
              <Input label="University" placeholder="University of London" value={university} onChange={(e) => setUniversity(e.target.value)} />
              <Input label="Graduation year" placeholder="2025" value={gradYear} onChange={(e) => setGradYear(e.target.value)} />
              <div style={{ gridColumn: "1 / -1" }}>
                <Select
                  label="Target role category"
                  options={["Software Engineering", "Data Science", "Product Management", "Design"]}
                  value={roleCategory}
                  onChange={(e) => setRoleCategory(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <OnboardingRow icon={<Briefcase size={18} strokeWidth={1.9} color="var(--ink-700)" />} title="Software Engineer · Babbage Labs" meta="Full-time · 2023 — Present" />
              <OnboardingRow icon={<Briefcase size={18} strokeWidth={1.9} color="var(--ink-700)" />} title="Engineering Intern · Analytical Engines Co." meta="Internship · 2022" />
              <OnboardingRow icon={<GraduationCap size={18} strokeWidth={1.9} color="var(--ink-700)" />} title="BSc Computer Science · University of London" meta="First Class · 2021 — 2025" />
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "transparent", border: "1.5px dashed var(--line-300)", borderRadius: "var(--radius-md)", color: "var(--ink-600)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={16} strokeWidth={1.9} /> Add experience or education
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--slate-700)", marginBottom: 10 }}>Your skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {skills.map((s) => (
                    <Tag key={s} tone="blue" onRemove={() => setSkills(skills.filter((x) => x !== s))}>{s}</Tag>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Input
                    placeholder="Add a skill…"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    style={{ flex: 1 }}
                  />
                  <Button variant="secondary" onClick={addSkill} size="md">Add</Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "28px", background: "var(--paper-50)", border: "1.5px dashed var(--brass-400)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <UploadCloud size={30} strokeWidth={1.9} color="var(--brass-600)" />
                <div style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>Drop in an existing resume</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-500)", maxWidth: 360 }}>
                  PDF or DOCX. We'll read it and pull out your experience, projects and skills automatically.
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--slate-400)", fontSize: 12, fontFamily: "var(--font-body)" }}>
                <span style={{ flex: 1, height: 1, background: "var(--line-300)" }} /> or add manually <span style={{ flex: 1, height: 1, background: "var(--line-300)" }} />
              </div>
              <OnboardingRow icon={<Briefcase size={18} strokeWidth={1.9} color="var(--ink-700)" />} title="Lovelace Notation Engine" meta="Developer Tools · TypeScript, Rust, WASM" />
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "transparent", border: "1.5px dashed var(--line-300)", borderRadius: "var(--radius-md)", color: "var(--ink-600)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={16} strokeWidth={1.9} /> Add a project
              </button>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Textarea
                label="What's your career goal?"
                rows={3}
                placeholder="Become a Staff Software Engineer working on developer platforms…"
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                hint="Signuture uses this to find gaps and tailor every resume."
              />
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: "var(--brass-100)", borderRadius: "var(--radius-md)", border: "1px solid var(--brass-200)" }}>
                <Seal size={56} distressed={false} rotate={0} />
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--brass-800)", lineHeight: 1.5 }}>
                  That's everything. We'll seal your portfolio and you can craft your first resume.
                </div>
              </div>
            </div>
          )}
        </Card>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
          <Button
            variant="ghost"
            onClick={() => step > 0 && setStep(step - 1)}
            disabled={step === 0}
            iconLeft={<ArrowLeft size={16} strokeWidth={1.9} />}
          >
            Back
          </Button>
          <Button
            variant={step === last ? "gold" : "primary"}
            onClick={advance}
            iconRight={<ArrowRight size={16} strokeWidth={1.9} />}
          >
            {step === last ? "Seal & finish" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function OnboardingRow({ icon, title, meta }: { icon: React.ReactNode; title: string; meta: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "var(--paper-100)", border: "1px solid var(--line-300)", borderRadius: "var(--radius-md)" }}>
      <span style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--ink-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{title}</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>{meta}</div>
      </div>
      <CheckCircle2 size={18} strokeWidth={1.9} color="var(--success-600)" />
    </div>
  );
}
