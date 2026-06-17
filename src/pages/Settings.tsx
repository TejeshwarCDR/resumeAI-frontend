import React, { useState } from "react";
import { ImageIcon, Check } from "lucide-react";
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

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink-900)", marginBottom: 12 }}>{title}</div>
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

export function SettingsPage() {
  const { user, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || "Ada Lovelace");
  const [email, setEmail] = useState(user?.email || "ada@signuture.com");
  const [university, setUniversity] = useState(user?.university || "University of London");
  const [gradYear, setGradYear] = useState(String(user?.graduation_year || "2025"));
  const [roleCategory, setRoleCategory] = useState(user?.target_role_category || "Software Engineering");
  const [careerGoal, setCareerGoal] = useState(user?.career_goal || "Become a Staff Software Engineer working on developer platforms within 3 years.");

  const [notifWeekly, setNotifWeekly] = useState(true);
  const [notifGen, setNotifGen] = useState(true);
  const [notifSync, setNotifSync] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(EP.settingsProfile, { full_name: fullName, email, university, graduation_year: parseInt(gradYear), target_role_category: roleCategory });
      await api.patch(EP.settingsCareer, { career_goal: careerGoal });
      await api.patch(EP.settingsNotif, { weekly_digest: notifWeekly, generation_complete: notifGen, document_sync: notifSync });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const deleteAccount = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      await api.delete(EP.deleteAccount);
      logout();
    } catch {}
  };

  const years = Array.from({ length: 10 }, (_, i) => String(2020 + i));

  return (
    <div style={{ maxWidth: 760 }}>
      <PageHeader overline="Account" title="Settings" />

      <Block title="Profile">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <Avatar name={fullName} size={64} ring />
          <Button variant="secondary" size="sm" iconLeft={<ImageIcon size={14} strokeWidth={1.9} />}>Change photo</Button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="University" value={university} onChange={(e) => setUniversity(e.target.value)} />
          <Select label="Graduation year" options={years} value={gradYear} onChange={(e) => setGradYear(e.target.value)} />
          <div style={{ gridColumn: "1 / -1" }}>
            <Select label="Target role category" options={["Software Engineering", "Data Science", "Product Management", "Design"]} value={roleCategory} onChange={(e) => setRoleCategory(e.target.value)} />
          </div>
        </div>
      </Block>

      <Block title="Career goal">
        <Textarea
          rows={3}
          value={careerGoal}
          onChange={(e) => setCareerGoal(e.target.value)}
          hint="Powers Gap Advisor and tailors every resume."
        />
      </Block>

      <Block title="Notifications">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <NotifRow checked={notifWeekly} onChange={setNotifWeekly} title="Weekly gap digest" desc="A short email on skills to build next." />
          <NotifRow checked={notifGen} onChange={setNotifGen} title="Generation complete" desc="Email me when a resume finishes crafting." />
          <NotifRow checked={notifSync} onChange={setNotifSync} title="Document sync complete" desc="Email me when an upload is parsed." />
        </div>
      </Block>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 32 }}>
        <Button variant="ghost" onClick={() => {}}>Cancel</Button>
        <Button variant="primary" iconLeft={saved ? <Check size={15} strokeWidth={1.9} /> : undefined} disabled={saving} onClick={save}>
          {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
        </Button>
      </div>

      <Card padding="20px 22px" style={{ border: "1.5px solid var(--danger-100)", background: "var(--danger-100)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 700, color: "var(--danger-600)" }}>Delete account</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-700)", marginTop: 2 }}>
              {confirmDelete ? "Are you sure? This cannot be undone." : "Permanently remove your portfolio, resumes and data."}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {confirmDelete && <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>}
            <Button variant="danger" size="sm" onClick={deleteAccount}>
              {confirmDelete ? "Yes, delete" : "Delete account"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
