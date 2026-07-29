import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldCheck, Cloud, Search, Lock, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartVault — Secure Everything. Access Anywhere." },
      {
        name: "description",
        content:
          "SmartVault is a private cloud workspace to upload, organize, search, and access your files from any device — securely.",
      },
      { property: "og:title", content: "SmartVault — Secure Cloud File Management" },
      {
        property: "og:description",
        content:
          "Your private cloud workspace. Upload, organize, and access files from any device — securely.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/vault", replace: true });
  }, [loading, user, navigate]);

  return (
    <main className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-soft">
            <ShieldCheck className="size-5" aria-hidden />
          </div>
          <span className="text-lg font-semibold tracking-tight">SmartVault</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild size="sm">
            <Link to="/auth" search={{ mode: "login" }}>
              Sign in
            </Link>
          </Button>
          <Button variant="cta" asChild size="sm">
            <Link to="/auth" search={{ mode: "signup" }}>
              Get started
            </Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
            <Lock className="size-3.5" aria-hidden />
            End-to-end encrypted transport
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Secure Everything.
            <br />
            <span className="text-primary">Access Anywhere.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            A premium cloud workspace to upload, organize, search, and access every file you own —
            from any device, in seconds.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="cta" size="lg" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                <UploadCloud className="size-4" /> Create your vault
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/auth" search={{ mode: "login" }}>
                I already have an account
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            {
              icon: Cloud,
              title: "Anywhere access",
              body: "Your files stay synced across every device you sign in on.",
            },
            {
              icon: Search,
              title: "Instant search",
              body: "Find any file by name or note contents as you type.",
            },
            {
              icon: ShieldCheck,
              title: "Private by design",
              body: "Row-level security keeps every file scoped to its owner.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border bg-card p-5 shadow-card"
            >
              <div className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
                <Icon className="size-5" aria-hidden />
              </div>
              <h3 className="mt-4 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} SmartVault</span>
          <span>Secure Everything. Access Anywhere.</span>
        </div>
      </footer>
    </main>
  );
}
