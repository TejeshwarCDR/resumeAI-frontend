import React, { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Seal } from "@/components/brand/Seal";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { useAuth } from "@/store/auth";
import { api } from "@/lib/api";
import { EP } from "@/lib/endpoints";
import { Mail, Lock, User, ArrowRight, ArrowLeft, KeyRound } from "lucide-react";

type Mode = "login" | "register" | "forgot" | "reset";

interface AuthPageProps {
  mode?: "login" | "register";
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div style={{
      fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--danger-600)",
      padding: "10px 14px", background: "var(--danger-100)", borderRadius: "var(--radius-md)",
    }}>
      {msg}
    </div>
  );
}

function SuccessBanner({ msg }: { msg: string }) {
  return (
    <div style={{
      fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--success-700, #15803d)",
      padding: "10px 14px", background: "var(--success-50, #f0fdf4)",
      border: "1px solid var(--success-200, #bbf7d0)", borderRadius: "var(--radius-md)",
    }}>
      {msg}
    </div>
  );
}

export function AuthPage({ mode: initialMode = "login" }: AuthPageProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);

  // Login / Register fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [gradYear, setGradYear] = useState("2025");

  // Forgot / Reset fields
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPasswordField] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [devToken, setDevToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isLogin = mode === "login";

  const handleLoginRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password !== confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }
        if (password.length < 8) { setError("Password must be at least 8 characters"); setLoading(false); return; }
        await register({ email, password, confirmPassword, full_name: fullName, university, graduation_year: parseInt(gradYear) });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const r = await api.post<{ message: string; resetToken?: string }>(EP.forgotPassword, { email: forgotEmail });
      setSuccess("If this email is registered, a reset token has been generated.");
      if (r.data.resetToken) {
        setDevToken(r.data.resetToken);
        setResetToken(r.data.resetToken);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (resetPassword !== resetConfirm) { setError("Passwords do not match"); return; }
    if (resetPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await api.post(EP.resetPassword, {
        token: resetToken,
        password: resetPassword,
        confirmPassword: resetConfirm,
      });
      setSuccess("Password reset successful! You can now sign in with your new password.");
      setTimeout(() => { setMode("login"); setSuccess(null); }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed. Token may have expired.");
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => String(2020 + i));

  const panelContent = (
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
  );

  if (mode === "forgot") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--paper-100)" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px 88px", maxWidth: 560 }}>
          <Logo variant="wordmark" size={36} />
          <button
            onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
            style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent", color: "var(--slate-500)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, marginTop: 28, marginBottom: 8, padding: 0 }}
          >
            <ArrowLeft size={14} strokeWidth={1.9} /> Back to sign in
          </button>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 36, color: "var(--ink-900)", margin: "12px 0 6px", letterSpacing: "-0.01em" }}>
            Reset your password
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--slate-700)", margin: "0 0 28px" }}>
            Enter your email and we'll generate a reset token.
          </p>

          {!success ? (
            <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input
                label="Email"
                type="email"
                placeholder="you@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                leading={<Mail size={16} strokeWidth={1.9} />}
                required
              />
              {error && <ErrorBanner msg={error} />}
              <Button type="submit" variant="gold" size="lg" block disabled={loading} iconRight={<ArrowRight size={18} strokeWidth={1.9} />}>
                {loading ? "Sending…" : "Request reset"}
              </Button>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <SuccessBanner msg={success} />
              {devToken && (
                <div style={{ padding: "12px 14px", background: "var(--paper-200)", borderRadius: "var(--radius-md)", border: "1px solid var(--line-300)" }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--slate-500)", marginBottom: 6 }}>
                    Dev mode — reset token
                  </div>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-700)", wordBreak: "break-all" }}>{devToken}</code>
                </div>
              )}
              <Button variant="primary" onClick={() => { setMode("reset"); setSuccess(null); setError(null); }}>
                Enter reset token
              </Button>
            </div>
          )}
        </div>
        {panelContent}
      </div>
    );
  }

  if (mode === "reset") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--paper-100)" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px 88px", maxWidth: 560 }}>
          <Logo variant="wordmark" size={36} />
          <button
            onClick={() => { setMode("forgot"); setError(null); setSuccess(null); }}
            style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent", color: "var(--slate-500)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, marginTop: 28, marginBottom: 8, padding: 0 }}
          >
            <ArrowLeft size={14} strokeWidth={1.9} /> Back
          </button>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 36, color: "var(--ink-900)", margin: "12px 0 6px", letterSpacing: "-0.01em" }}>
            Set new password
          </h1>

          {success ? (
            <SuccessBanner msg={success} />
          ) : (
            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
              <Input
                label="Reset token"
                placeholder="Paste your reset token"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                leading={<KeyRound size={16} strokeWidth={1.9} />}
                required
              />
              <Input
                label="New password"
                type="password"
                placeholder="At least 8 characters"
                value={resetPassword}
                onChange={(e) => setResetPasswordField(e.target.value)}
                leading={<Lock size={16} strokeWidth={1.9} />}
                required
              />
              <Input
                label="Confirm new password"
                type="password"
                placeholder="••••••••"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                leading={<Lock size={16} strokeWidth={1.9} />}
                required
              />
              {error && <ErrorBanner msg={error} />}
              <Button type="submit" variant="gold" size="lg" block disabled={loading} iconRight={<ArrowRight size={18} strokeWidth={1.9} />}>
                {loading ? "Resetting…" : "Set new password"}
              </Button>
            </form>
          )}
        </div>
        {panelContent}
      </div>
    );
  }

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

        <form onSubmit={handleLoginRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!isLogin && (
            <Input
              label="Full name"
              placeholder="Your full name"
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
                placeholder="Your university or college"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              />
              <Select
                label="Graduation year"
                options={years}
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
              />
            </>
          )}

          {error && <ErrorBanner msg={error} />}

          {isLogin && (
            <div style={{ textAlign: "right", marginTop: -4 }}>
              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(null); }}
                style={{ border: "none", background: "transparent", color: "var(--slate-500)", fontFamily: "var(--font-body)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <div style={{ marginTop: 4 }}>
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
            onClick={() => { setMode(isLogin ? "register" : "login"); setError(null); }}
            style={{ border: "none", background: "transparent", color: "var(--ink-600)", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "var(--font-body)" }}
          >
            {isLogin ? "Create your account" : "Sign in"}
          </button>
        </div>
      </div>

      {panelContent}
    </div>
  );
}
