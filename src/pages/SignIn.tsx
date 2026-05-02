import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

export default function SignIn() {
  useSEO({
    title: "Sign in | Peak Focus",
    description: "Sign in with your email to sync your data across devices.",
    canonical: "/sign-in",
  });

  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setError(null);
    const { error } = await signInWithEmail(email.trim());
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  };

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
          Sign in with email to sync habits, tasks, and mood across devices.
        </p>
      </div>

      {status === "sent" ? (
        <div className="w-full rounded-lg border bg-card p-4 text-center text-sm">
          <Mail className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
          <p className="mt-2 font-medium">Check your inbox</p>
          <p className="mt-1 text-xs text-muted-foreground">
            We sent a magic link to <strong>{email}</strong>. Tap it to sign in.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={status === "sending"}>
            {status === "sending" ? "Sending..." : "Send magic link"}
          </Button>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </form>
      )}

      <p className="text-center text-[10px] text-muted-foreground">
        By signing in you agree to store your data in our Supabase project. You
        can delete your account anytime from Settings.
      </p>
    </main>
  );
}
