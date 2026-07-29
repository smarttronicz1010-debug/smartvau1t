import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Account settings — SmartVault" },
      { name: "description", content: "Manage your SmartVault account." },
      { property: "og:title", content: "Account settings — SmartVault" },
      { property: "og:description", content: "Update your account details." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState<string>("");

  const profileQ = useQuery({
    enabled: !!user,
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("email, full_name, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      const profile = data ?? {
        email: user!.email ?? null,
        full_name: null as string | null,
        avatar_url: null as string | null,
      };
      setName(profile.full_name ?? "");
      return profile;
    },
  });

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: name.trim() || null, email: user.email ?? null });
    setSaving(false);
    if (error) {
      toast.error("Couldn't save", { description: error.message });
      return;
    }
    toast.success("Saved");
    queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "login" }, replace: true });
  };

  const initials = (profileQ.data?.full_name ?? user?.email ?? "U")
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" aria-label="Back" onClick={() => navigate({ to: "/vault" })}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">Account settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {profileQ.data?.avatar_url ? <AvatarImage src={profileQ.data.avatar_url} alt="" /> : null}
              <AvatarFallback className="bg-primary-soft text-lg text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {profileQ.data?.full_name ?? "Your account"}
              </p>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullname">Full name</Label>
              <Input
                id="fullname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-ro">Email</Label>
              <Input id="email-ro" value={user?.email ?? ""} readOnly disabled />
            </div>
            <Button variant="cta" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save changes
            </Button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="text-sm font-semibold">Session</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign out on this device.
          </p>
          <Button variant="outline" className="mt-3" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </main>
    </div>
  );
}
