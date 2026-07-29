import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — SmartVault" },
      { name: "description", content: "Reset your SmartVault password." },
      { property: "og:title", content: "Reset password — SmartVault" },
      { property: "og:description", content: "Set a new password for your SmartVault account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setIsRecovery(true);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" aria-hidden />
          </div>
          <span className="text-lg font-semibold tracking-tight">SmartVault</span>
        </Link>
        {isRecovery ? <SetNewPassword /> : <RequestReset />}
      </div>
    </main>
  );
}

const emailSchema = z.string().trim().email("Enter a valid email");
const pwSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

function RequestReset() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const parsed = emailSchema.safeParse(fd.get("email"));
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (err) {
      toast.error("Couldn't send email", { description: err.message });
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center shadow-card">
        <h1 className="text-xl font-semibold">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We've sent you a link to reset your password.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/auth" search={{ mode: "login" }}>
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <h1 className="text-xl font-semibold">Forgot password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email and we'll send you a reset link.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="reset-email">Email</Label>
          <Input id="reset-email" name="email" type="email" autoComplete="email" />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
        <Button type="submit" variant="cta" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Send reset link
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link to="/auth" search={{ mode: "login" }}>
            Back to sign in
          </Link>
        </Button>
      </form>
    </div>
  );
}

function SetNewPassword() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const parsed = pwSchema.safeParse(fd.get("password"));
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (err) {
      toast.error("Couldn't update password", { description: err.message });
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/vault", replace: true });
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <h1 className="text-xl font-semibold">Set a new password</h1>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" name="password" type="password" autoComplete="new-password" />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
        <Button type="submit" variant="cta" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Update password
        </Button>
      </form>
    </div>
  );
}
