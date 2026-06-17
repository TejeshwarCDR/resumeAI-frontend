import React, { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Seal } from "@/components/brand/Seal";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { useAuth } from "@/store/auth";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

interface AuthPageProps {
  mode?: "login" | "register";
}

export function AuthPage({ mode: initialMode = "login" }: AuthPageProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [gradYear, setGradYear] = useState("2025");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ email, password, full_name: fullName, university, graduation_year: parseInt(gradYear) });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => String(2020 + i));

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--paper-100)" }}>
      {/* form panel */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px 88px", maxWidth: 560 }}>
        <Logo variant="wordmark" size={36} />

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 40, color: "var(--ink-900)", margin: "40px 0 6px", letterSpacing: "-0.01em" }}>
          {isLogin ? "Welcome back." : "Begin your Signuture."}
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15.5, color: "var(--slate-700)", margin: "0 0 28px" }}>
          {isLogin ? "Pick up where your story left off." : "A few details, and we'll start crafting around you."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!isLogin && (
            <Input
              label="Full name"
              placeholder="Ada Lovelace"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leading={<User size={16} strokeWidth={1.9} />}
              required
            />
          )}
          <Input
            label="Email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leading={<Mail size={16} strokeWidth={1.9} />}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leading={<Lock size={16} strokeWidth={1.9} />}
            required
          />
          {!isLogin && (
            <>
              <Input
                label="Confirm password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leading={<Lock size={16} strokeWidth={1.9} />}
                required
              />
              <Input
                label="University"
                placeholder="University of London"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                required
              />
              <Select
                label="Graduation year"
                options={years}
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
              />
            </>
          )}

          {error && (
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--danger-600)", padding: "10px 14px", background: "var(--danger-100)", borderRadius: "var(--radius-md)" }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <Button
              type="submit"
              variant="gold"
              size="lg"
              block
              disabled={loading}
              iconRight={<ArrowRight size={18} strokeWidth={1.9} />}
            >
              {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
            </Button>
          </div>
        </form>

        <div style={{ marginTop: 20, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--slate-700)" }}>
          {isLogin ? "New to Signuture? " : "Already have an account? "}
          <button
            onClick={() => setMode(isLogin ? "register" : "login")}
            style={{ border: "none", background: "transparent", color: "var(--ink-600)", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "var(--font-body)" }}
          >
            {isLogin ? "Create your account" : "Sign in"}
          </button>
        </div>
      </div>

      {/* seal panel */}
      <div style={{
        background: "var(--grad-atelier)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 30, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(var(--panel-dot) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, var(--panel-glow), transparent 68%)", top: -80, right: -80 }} />
        <Seal size={230} color="var(--brass-600)" ink="var(--ink-900)" />
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 23, color: "var(--ink-700)", textAlign: "center", maxWidth: 340, lineHeight: 1.35, zIndex: 1 }}>
          "Crafted around who you are. Signed for who you'll become."
        </div>
      </div>
    </div>
  );
}
