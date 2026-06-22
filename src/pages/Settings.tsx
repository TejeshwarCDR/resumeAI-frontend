import React, { useState, useEffect, useRef } from "react";
import { ImageIcon, Check, Phone, Linkedin, Github, Globe, MapPin, AlertTriangle, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/data-display/Card";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { Switch } from "@/components/forms/Switch";
import { Avatar } from "@/components/data-display/Avatar";
import { useAuth } from "@/store/auth";
import { api } from "@/lib/api";
import { EP } from "@/lib/endpoints";

function Block({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink-900)" }}>{title}</div>
        {subtitle && <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-500)", marginTop: 2 }}>{subtitle}</div>}
      </div>
      <Card variant="raised" padding="24px">{children}</Card>
    </div>
  );
}

function NotifRow({ checked, onChange, title, desc }: { checked: boolean; onChange: (v: boolean) => void; title: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--ink-900)" }}>{title}</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>{desc}</div>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 200,
      background: type === "error" ? "var(--danger-600, #dc2626)" : "var(--ink-900)",
      color: "var(--paper-50)", fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 500,
      padding: "12px 18px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {type === "success" ? <Check size={15} strokeWidth={2} /> : <AlertTriangle size={15} strokeWidth={2} />}
      {msg}
    </div>
  );
}

interface SettingsPayload {
  full_name: string;
  email: string;
  university: string | null;
  graduation_year: number | null;
  target_role_category: string | null;
  career_goal: string | null;
  phone_number: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  location: string | null;
  profile_photo_s3_key: string | null;
  profile_photo_url?: string;
  writing_style: string | null;
  notif_gap_digest: boolean;
  notif_gen_complete: boolean;
  notif_sync_complete: boolean;
}

const WRITING_STYLES = [
  { value: "professional", label: "Professional — formal and authoritative" },
  { value: "concise",      label: "Concise — brief, high-impact bullets" },
  { value: "storytelling", label: "Storytelling — narrative-driven, engaging" },
  { value: "technical",    label: "Technical — depth-first, spec-heavy" },
];

export function SettingsPage() {
  const { user, logout, setUser } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [university, setUniversity] = useState(user?.university || "");
  const [gradYear, setGradYear] = useState(String(user?.graduation_year || new Date().getFullYear() + 1));
  const [roleCategory, setRoleCategory] = useState(user?.target_role_category || "Software Engineering");
  const [careerGoal, setCareerGoal] = useState(user?.career_goal || "");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [linkedin, setLinkedin] = useState(user?.linkedin_url || "");
  const [github, setGithub] = useState(user?.github_url || "");
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolio_url || "");
  const [location, setLocation] = useState(user?.location || "");
  const [writingStyle, setWritingStyle] = useState("professional");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.profile_photo_url || "");
  const [photoUploading, setPhotoUploading] = useState(false);

  const [notifWeekly, setNotifWeekly] = useState(true);
  const [notifGen, setNotifGen] = useState(false);
  const [notifSync, setNotifSync] = useState(true);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Delete account flow
  const [deleteStage, setDeleteStage] = useState<"idle" | "confirm" | "final">("idle");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteTyped, setDeleteTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const DELETE_PHRASE = "DELETE MY ACCOUNT";

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.get<{ settings: SettingsPayload }>(EP.settingsAll)
      .then((r) => {
        const p = r.data.settings;
        if (p.full_name)            setFullName(p.full_name);
        if (p.university)           setUniversity(p.university);
        if (p.graduation_year)      setGradYear(String(p.graduation_year));
        if (p.target_role_category) setRoleCategory(p.target_role_category);
        if (p.career_goal)          setCareerGoal(p.career_goal);
        if (p.phone_number)         setPhone(p.phone_number);
        if (p.linkedin_url)         setLinkedin(p.linkedin_url);
        if (p.github_url)           setGithub(p.github_url);
        if (p.portfolio_url)        setPortfolioUrl(p.portfolio_url);
        if (p.location)             setLocation(p.location);
        if (p.profile_photo_url)    setProfilePhotoUrl(p.profile_photo_url);
        if (p.writing_style)        setWritingStyle(p.writing_style);
        setNotifWeekly(p.notif_gap_digest ?? true);
        setNotifGen(p.notif_gen_complete ?? false);
        setNotifSync(p.notif_sync_complete ?? true);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    if (!fullName.trim()) { showToast("Full name is required.", "error"); return; }
    if (careerGoal && careerGoal.length > 0 && careerGoal.length < 10) {
      showToast("Career goal must be at least 10 characters.", "error"); return;
    }
    setSaving(true);
    try {
      await api.patch(EP.settingsProfile, {
        full_name:            fullName,
        university:           university || null,
        graduation_year:      parseInt(gradYear) || null,
        target_role_category: roleCategory || null,
        phone_number:         phone || null,
        linkedin_url:         linkedin || null,
        github_url:           github || null,
        portfolio_url:        portfolioUrl || null,
        location:             location || null,
        writing_style:        writingStyle || null,
      });
      if (careerGoal.length >= 10) {
        await api.patch(EP.settingsCareer, { career_goal: careerGoal });
      }
      await api.patch(EP.settingsNotif, {
        notif_gap_digest:    notifWeekly,
        notif_gen_complete:  notifGen,
        notif_sync_complete: notifSync,
      });
      // Sync user in auth context so resume previews pick up new name/contact
      if (user) {
        setUser({
          ...user,
          full_name:            fullName,
          university:           university || undefined,
          graduation_year:      parseInt(gradYear) || undefined,
          target_role_category: roleCategory || undefined,
          career_goal:          careerGoal || undefined,
          phone_number:         phone || undefined,
          linkedin_url:         linkedin || undefined,
          github_url:           github || undefined,
          portfolio_url:        portfolioUrl || undefined,
          location:             location || undefined,
        });
      }
      showToast("Settings saved successfully.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoClick = () => photoInputRef.current?.click();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Please select an image file.", "error"); return; }
    if (file.size > 5 * 1024 * 1024) { showToast("Photo must be under 5 MB.", "error"); return; }
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const r = await api.post<{ settings: SettingsPayload }>(
        EP.settingsProfilePhoto,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const nextUrl = r.data.settings.profile_photo_url || "";
      setProfilePhotoUrl(nextUrl);
      if (user) {
        setUser({
          ...user,
          profile_photo_s3_key: r.data.settings.profile_photo_s3_key,
          profile_photo_url: nextUrl,
        });
      }
      showToast("Profile photo updated.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Photo upload failed. Please try again.", "error");
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  const deleteAccount = async () => {
    if (deleteStage === "idle") { setDeleteStage("confirm"); return; }
    if (deleteStage === "confirm") {
      if (!deletePassword || deletePassword.length < 8) { showToast("Password must be at least 8 characters.", "error"); return; }
      setDeleteStage("final"); return;
    }
    if (deleteTyped !== DELETE_PHRASE) { showToast(`Type "${DELETE_PHRASE}" exactly to confirm.`, "error"); return; }
    setDeleting(true);
    try {
      await api.delete(EP.deleteAccount, { data: { password: deletePassword, confirmText: DELETE_PHRASE } });
      localStorage.removeItem("sig_token");
      logout();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Account deletion failed. Check your password and try again.", "error");
      setDeleting(false);
    }
  };

  const cancelDelete = () => { setDeleteStage("idle"); setDeletePassword(""); setDeleteTyped(""); };

  const years = Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() - 4 + i));

  return (
    <div style={{ maxWidth: 760 }}>
      <PageHeader overline="Account" title="Settings" />

      <Block title="Profile" subtitle="Your public identity used across all resumes">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <Avatar name={fullName || user?.full_name || "User"} src={profilePhotoUrl || user?.profile_photo_url} size={64} ring />
          <div>
            <Button variant="secondary" size="sm" iconLeft={<ImageIcon size={14} strokeWidth={1.9} />} onClick={handlePhotoClick} disabled={photoUploading}>
              {photoUploading ? "Uploading…" : "Change photo"}
            </Button>
            <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
            <div style={{ fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--slate-400)", marginTop: 4 }}>
              JPG, PNG or WebP, max 5 MB
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required />
          <Input label="Email" type="email" value={user?.email || ""} disabled style={{ opacity: 0.6 }} placeholder="you@email.com" />
          <Input label="University" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="Your university" />
          <Select label="Graduation year" options={years} value={gradYear} onChange={(e) => setGradYear(e.target.value)} />
          <div style={{ gridColumn: "1 / -1" }}>
            <Select
              label="Target role category"
              options={["Software Engineering", "Data Science", "Product Management", "Design", "Finance", "Marketing", "Operations", "Other"]}
              value={roleCategory}
              onChange={(e) => setRoleCategory(e.target.value)}
            />
          </div>
        </div>
      </Block>

      <Block title="Contact & Links" subtitle="Displayed on your resume header and shared with recruiters">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" leading={<Phone size={15} strokeWidth={1.9} />} />
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" leading={<MapPin size={15} strokeWidth={1.9} />} />
          <Input label="LinkedIn URL" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/in/yourprofile" leading={<Linkedin size={15} strokeWidth={1.9} />} />
          <Input label="GitHub URL" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="github.com/yourusername" leading={<Github size={15} strokeWidth={1.9} />} />
          <div style={{ gridColumn: "1 / -1" }}>
            <Input label="Portfolio / Website" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="yourwebsite.com" leading={<Globe size={15} strokeWidth={1.9} />} />
          </div>
        </div>
      </Block>

      <Block title="Career goal" subtitle="Powers Gap Advisor and tailors every generated resume">
        <Textarea
          rows={3}
          value={careerGoal}
          onChange={(e) => setCareerGoal(e.target.value)}
          placeholder="Describe the role, level, and impact you're aiming for. E.g. 'Become a senior software engineer at a product-led startup building developer tools.'"
          hint="Minimum 10 characters when set."
        />
      </Block>

      <Block title="Writing style" subtitle="How Signuture shapes the language of your generated resumes">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {WRITING_STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setWritingStyle(s.value)}
              style={{
                textAlign: "left", padding: "14px 16px", cursor: "pointer",
                background: writingStyle === s.value ? "var(--brass-100)" : "var(--paper-50)",
                border: `1.5px solid ${writingStyle === s.value ? "var(--brass-500)" : "var(--line-300)"}`,
                borderRadius: "var(--radius-md)",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)" }}>
                  {s.label.split("—")[0].trim()}
                </span>
                {writingStyle === s.value && <Check size={15} strokeWidth={2} color="var(--brass-600)" />}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-500)", marginTop: 2 }}>
                {s.label.split("—")[1]?.trim()}
              </div>
            </button>
          ))}
        </div>
      </Block>

      <Block title="Notifications" subtitle="Choose what triggers an email from Signuture">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <NotifRow checked={notifWeekly} onChange={setNotifWeekly} title="Weekly gap digest" desc="A short email on skills to build next." />
          <NotifRow checked={notifGen} onChange={setNotifGen} title="Generation complete" desc="Email me when a resume finishes crafting." />
          <NotifRow checked={notifSync} onChange={setNotifSync} title="Document sync complete" desc="Email me when an upload is parsed." />
        </div>
      </Block>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 36 }}>
        <Button variant="ghost" onClick={() => window.location.reload()}>Revert</Button>
        <Button variant="primary" iconLeft={<Check size={15} strokeWidth={1.9} />} disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      {/* Danger zone */}
      <div style={{ borderTop: "1.5px solid var(--line-200)", paddingTop: 24, marginBottom: 40 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--danger-600, #dc2626)", marginBottom: 12 }}>
          Danger zone
        </div>
        <Card padding="20px 22px" style={{ border: "1.5px solid var(--danger-200, #fecaca)", background: "var(--danger-50, #fef2f2)" }}>
          {deleteStage === "idle" && (
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 700, color: "var(--danger-700, #b91c1c)" }}>Delete account</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-700)", marginTop: 2 }}>
                  Permanently remove your portfolio, resumes, and all data. This cannot be undone.
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={deleteAccount}>Delete account</Button>
            </div>
          )}

          {deleteStage === "confirm" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 700, color: "var(--danger-700, #b91c1c)" }}>Confirm your password</div>
                <button onClick={cancelDelete} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}><X size={18} strokeWidth={1.9} /></button>
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-600)", marginBottom: 14 }}>
                Enter your current password to proceed to final confirmation.
              </div>
              <Input
                type="password"
                label="Current password"
                placeholder="Enter your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                style={{ maxWidth: 320, marginBottom: 14 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="ghost" size="sm" onClick={cancelDelete}>Cancel</Button>
                <Button variant="danger" size="sm" onClick={deleteAccount} disabled={deletePassword.length < 8}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {deleteStage === "final" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 700, color: "var(--danger-700, #b91c1c)" }}>Final confirmation</div>
                <button onClick={cancelDelete} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}><X size={18} strokeWidth={1.9} /></button>
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-600)", marginBottom: 14 }}>
                This will permanently delete your account and all associated data. Type{" "}
                <strong style={{ fontFamily: "var(--font-mono)", color: "var(--danger-700, #b91c1c)" }}>{DELETE_PHRASE}</strong> to confirm.
              </div>
              <Input
                label={`Type "${DELETE_PHRASE}" to confirm`}
                placeholder={DELETE_PHRASE}
                value={deleteTyped}
                onChange={(e) => setDeleteTyped(e.target.value)}
                style={{ maxWidth: 360, marginBottom: 14 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="ghost" size="sm" onClick={cancelDelete}>Cancel</Button>
                <Button variant="danger" size="sm" onClick={deleteAccount} disabled={deleteTyped !== DELETE_PHRASE || deleting}>
                  {deleting ? "Deleting…" : "Yes, permanently delete my account"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
