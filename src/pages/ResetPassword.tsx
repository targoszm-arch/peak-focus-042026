import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Shown when a password-recovery link lands the user back in the app —
    intercepts the session Supabase already established from the recovery
    token so they set a new password before going any further. */
export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error } = await updatePassword(password);
    setSubmitting(false);
    if (error) setError(error.message);
  };

  return (
    <main style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", background: "var(--surface-page)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>
            Set a new password
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
            Choose a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input
            type="password"
            name="new-password"
            autoComplete="new-password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Input
            type="password"
            name="confirm-password"
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Updating…" : "Update password"}
          </Button>
          {error && (
            <p style={{ fontSize: 13, color: "var(--status-danger)" }} role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
