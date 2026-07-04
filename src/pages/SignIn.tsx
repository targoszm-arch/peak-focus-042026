import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

type Mode = "signin" | "signup" | "magic" | "reset";
type Status = "idle" | "submitting" | "sent" | "confirm" | "error";

const logo = "/brand/peak-focus-logo-white.png";

export default function SignIn() {
  useSEO({
    title: "Sign in | Peak Focus",
    description: "Sign in to sync your data across devices.",
    canonical: "/sign-in",
  });

  const { signInWithEmail, signInWithPassword, signUpWithPassword, resetPasswordForEmail } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("submitting");
    setError(null);

    if (mode === "magic") {
      const { error } = await signInWithEmail(email.trim());
      if (error) {
        setStatus("error");
        setError(error.message);
      } else {
        setStatus("sent");
      }
      return;
    }

    if (mode === "reset") {
      const { error } = await resetPasswordForEmail(email.trim());
      if (error) {
        setStatus("error");
        setError(error.message);
      } else {
        setStatus("sent");
      }
      return;
    }

    if (!password) {
      setStatus("error");
      setError("Password required");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setStatus("error");
        setError("Password must be at least 6 characters");
        return;
      }
      const { error, needsConfirmation } = await signUpWithPassword(email.trim(), password);
      if (error) {
        setStatus("error");
        setError(error.message);
      } else if (needsConfirmation) {
        setStatus("confirm");
      } else {
        setStatus("idle");
      }
      return;
    }

    const { error } = await signInWithPassword(email.trim(), password);
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("idle");
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setStatus("idle");
    setError(null);
  };

  const notice = (title: string, body: React.ReactNode) => (
    <div
      style={{
        width: "100%",
        maxWidth: 380,
        background: "var(--surface-card)",
        border: "1px solid var(--border-soft)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-sm)",
        padding: 28,
        textAlign: "center",
      }}
    >
      <Mail className="mx-auto h-7 w-7" style={{ color: "var(--primary-500)" }} aria-hidden />
      <p style={{ marginTop: 10, fontWeight: 700, color: "var(--text-primary)" }}>{title}</p>
      <p style={{ marginTop: 6, fontSize: 13, color: "var(--text-secondary)" }}>{body}</p>
      <button
        type="button"
        onClick={() => switchMode("signin")}
        style={{ marginTop: 16, fontSize: 13, color: "var(--primary-500)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
      >
        Back to sign in
      </button>
    </div>
  );

  const formPanel = (
    <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
          {mode === "signup"
            ? "Start planning the work, then working the plan."
            : mode === "magic"
            ? "We'll email you a one-tap sign-in link."
            : mode === "reset"
            ? "Enter your email and we'll send you a password reset link."
            : "Sign in to continue to your workspace."}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {mode !== "magic" && mode !== "reset" && (
          <Input
            type="password"
            name="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        )}
        {mode === "signin" && (
          <button
            type="button"
            onClick={() => switchMode("reset")}
            style={{ alignSelf: "flex-end", fontSize: 12.5, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer" }}
          >
            Forgot password?
          </button>
        )}
        <Button type="submit" className="w-full" disabled={status === "submitting"}>
          {status === "submitting"
            ? mode === "magic"
              ? "Sending…"
              : mode === "signup"
              ? "Creating account…"
              : mode === "reset"
              ? "Sending…"
              : "Signing in…"
            : mode === "magic"
            ? "Send magic link"
            : mode === "signup"
            ? "Create account"
            : mode === "reset"
            ? "Send reset link"
            : "Sign in"}
        </Button>
        {error && (
          <p style={{ fontSize: 13, color: "var(--status-danger)" }} role="alert">
            {error}
          </p>
        )}
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
        {mode === "signin" && (
          <>
            <button type="button" onClick={() => switchMode("signup")} style={{ color: "var(--primary-500)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              Create an account
            </button>
            <button type="button" onClick={() => switchMode("magic")} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", color: "var(--text-secondary)" }}>
              Or sign in with a magic link
            </button>
          </>
        )}
        {mode === "signup" && (
          <button type="button" onClick={() => switchMode("signin")} style={{ color: "var(--primary-500)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
            Already have an account? Sign in
          </button>
        )}
        {(mode === "magic" || mode === "reset") && (
          <button type="button" onClick={() => switchMode("signin")} style={{ color: "var(--primary-500)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
            {mode === "reset" ? "Back to sign in" : "Use password instead"}
          </button>
        )}
      </div>

      <p style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
        By signing in you agree to store your data in our Supabase project. You can delete your account anytime from Settings.
      </p>
    </div>
  );

  return (
    <main style={{ display: "flex", minHeight: "100dvh", background: "var(--surface-page)" }}>
      {/* brand panel — the one gradient in the system */}
      <div
        className="pf-hide-narrow"
        style={{
          flex: "0 0 44%",
          maxWidth: 560,
          background: "linear-gradient(150deg, var(--primary-500) 0%, var(--primary-600) 45%, var(--secondary-500) 130%)",
          color: "#fff",
          padding: "48px 44px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={logo} alt="Peak Focus" style={{ height: 30 }} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20 }}>Peak Focus</span>
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 800, lineHeight: 1.15, margin: 0 }}>
            Plan the work.<br />Then work the plan.
          </h2>
          <p style={{ marginTop: 14, fontSize: 15, opacity: 0.9, maxWidth: 360 }}>
            Your calm workspace for projects, tasks, focus and health — all climbing toward one daily summit.
          </p>
        </div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>12 active tasks across 4 projects · one clear peak.</div>
      </div>

      {/* form / notice */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        {status === "sent"
          ? mode === "reset"
            ? notice("Check your inbox", <>We sent a password reset link to <strong>{email}</strong>. Open it to choose a new password.</>)
            : notice("Check your inbox", <>We sent a magic link to <strong>{email}</strong>. Tap it to sign in.</>)
          : status === "confirm"
          ? notice("Confirm your email", <>We sent a confirmation link to <strong>{email}</strong>. Open it, then come back and sign in.</>)
          : formPanel}
      </div>
    </main>
  );
}
