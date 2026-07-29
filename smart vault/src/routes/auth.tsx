import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSession } from "@/lib/session";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional().default("login"),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — SmartVault" },
      { name: "description", content: "Sign in or create your SmartVault account." },
      { property: "og:title", content: "Sign in — SmartVault" },
      { property: "og:description", content: "Access your private cloud workspace." },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { user, loading } = useSession();

  useEffect(() => {
    if (!loading && user) navigate({ to: search.redirect ?? "/vault", replace: true });
  }, [loading, user, navigate, search.redirect]);

  return (
    <main className="grid min-h-dvh bg-surface lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-white/15">
            <ShieldCheck className="size-5" aria-hidden />
          </div>
          <span className="text-lg font-semibold tracking-tight">SmartVault</span>
        </Link>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            Your private cloud workspace.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-primary-foreground/80">
            Upload, organize, and access your files from any device — securely.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} SmartVault · Secure Everything. Access Anywhere.
        </p>
      </aside>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" aria-hidden />
            </div>
            <span className="text-lg font-semibold tracking-tight">SmartVault</span>
          </Link>

          <Tabs
            defaultValue={search.mode}
            onValueChange={(v) => navigate({ to: "/auth", search: { mode: v as "login" | "signup", redirect: search.redirect } })}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <LoginForm redirect={search.redirect} />
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <SignupForm redirect={search.redirect} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}

function GoogleButton({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setBusy(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/vault`,
        },
      });

      if (error) {
        toast.error("Google sign in failed", {
          description: error.message,
        });
        setBusy(false);
      }
    } catch (e) {
      toast.error("Google sign in failed", {
        description:
          e instanceof Error ? e.message : "Unknown error",
      });
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handle}
      disabled={busy}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <GoogleIcon />
      )}
      <span>{label}</span>
    </Button>
  );
}
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12S6.6 21.7 12 21.7c6.9 0 9.6-4.8 9.6-9 0-.6-.1-1-.1-1.5H12z"/>
    </svg>
  );
}

function LoginForm({ redirect }: { redirect?: string }) {
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      toast.error("Couldn't sign in", { description: error.message });
      return;
    }
    toast.success("Welcome back");
    navigate({ to: redirect ?? "/vault", replace: true });
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to your vault.</p>

      <div className="mt-5">
        <GoogleButton label="Continue with Google" />
      </div>

      <Divider />

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent"
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox id="remember" defaultChecked />
            <span>Remember me</span>
          </label>
          <Link to="/reset-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="cta" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>
    </div>
  );
}

function SignupForm({ redirect }: { redirect?: string }) {
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
      confirm: fd.get("confirm"),
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't create account", { description: error.message });
      return;
    }
    toast.success("Account created", { description: "You're signed in." });
    navigate({ to: redirect ?? "/vault", replace: true });
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <h1 className="text-xl font-semibold tracking-tight">Create your vault</h1>
      <p className="mt-1 text-sm text-muted-foreground">Secure Everything. Access Anywhere.</p>

      <div className="mt-5">
        <GoogleButton label="Sign up with Google" />
      </div>

      <Divider />

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="s-email" error={errors.email}>
          <Input id="s-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        </Field>
        <Field label="Password" htmlFor="s-password" error={errors.password}>
          <div className="relative">
            <Input
              id="s-password"
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent"
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm password" htmlFor="s-confirm" error={errors.confirm}>
          <Input
            id="s-confirm"
            name="confirm"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
          />
        </Field>

        <Button type="submit" variant="cta" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Create account
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our terms and privacy policy.
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
