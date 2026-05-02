import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

type Mode = "signin" | "signup" | "magic";
type Status = "idle" | "submitting" | "sent" | "confirm" | "error";

export default function SignIn() {
  useSEO({
    title: "Sign in | Peak Focus",
    description: "Sign in to sync your data across devices.",
    canonical: "/sign-in",
  });

  const { signInWithEmail, signInWithPassword, signUpWithPassword } = useAuth();
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
      const { error, needsConfirmation } = await signUpWithPassword(
        email.trim(),
        password
      );
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

  if (status === "sent") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
        <div className="w-full rounded-lg border bg-card p-4 text-center text-sm">
          <Mail className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
          <p className="mt-2 font-medium">Check your inbox</p>
          <p className="mt-1 text-xs text-muted-foreground">
            We sent a magic link to <strong>{email}</strong>. Tap it to sign in.
          </p>
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className="mt-4 text-xs text-primary underline"
          >
            Back to sign in
          </button>
        </div>
      </main>
    );
  }

  if (status === "confirm") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
        <div className="w-full rounded-lg border bg-card p-4 text-center text-sm">
          <Mail className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
          <p className="mt-2 font-medium">Confirm your email</p>
          <p className="mt-1 text-xs text-muted-foreground">
            We sent a confirmation link to <strong>{email}</strong>. Open it to
            activate your account, then come back and sign in.
          </p>
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className="mt-4 text-xs text-primary underline"
          >
            Back to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          className="h-16 w-16"
          fill="none"
          stroke="#1E8DFF"
          strokeWidth={10}
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d="M12 84 L36 22 L50 52 L64 16 L88 84 Z" />
        </svg>
        <h1 className="text-3xl font-semibold tracking-tight">Peak Focus</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "signup"
            ? "Create an account to sync habits, tasks, and mood."
            : mode === "magic"
              ? "We'll email you a one-tap sign-in link."
              : "Sign in to sync habits, tasks, and mood across devices."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full space-y-3"
        method="post"
        action="#"
      >
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
        {mode !== "magic" && (
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
        <Button
          type="submit"
          className="w-full"
          disabled={status === "submitting"}
        >
          {status === "submitting"
            ? mode === "magic"
              ? "Sending..."
              : mode === "signup"
                ? "Creating account..."
                : "Signing in..."
            : mode === "magic"
              ? "Send magic link"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
        </Button>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </form>

      <div className="flex w-full flex-col items-center gap-2 text-xs text-muted-foreground">
        {mode === "signin" && (
          <>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="text-primary underline"
            >
              Create an account
            </button>
            <button
              type="button"
              onClick={() => switchMode("magic")}
              className="underline"
            >
              Or sign in with a magic link
            </button>
          </>
        )}
        {mode === "signup" && (
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className="text-primary underline"
          >
            Already have an account? Sign in
          </button>
        )}
        {mode === "magic" && (
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className="text-primary underline"
          >
            Use password instead
          </button>
        )}
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        By signing in you agree to store your data in our Supabase project. You
        can delete your account anytime from Settings.
      </p>
    </main>
  );
}
