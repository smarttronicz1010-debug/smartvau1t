import { Link, useRouter, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, Trash2, X, ShieldCheck, Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";
import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/components/theme-provider";
import { useQueryClient } from "@tanstack/react-query";

type Profile = {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export function NavDrawer({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: Profile;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const initials = (profile.full_name ?? profile.email ?? "U")
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.invalidate();
    navigate({ to: "/auth", search: { mode: "login" }, replace: true });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] p-0 sm:w-[340px]">
        <SheetHeader className="border-b px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="size-5" aria-hidden />
              </div>
              <SheetTitle className="text-base font-semibold">SmartVault</SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close menu"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <SheetDescription className="sr-only">Main navigation</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-1 px-3 py-3">
          <DrawerItem to="/vault" icon={<ShieldCheck className="size-4" />} onNavigate={() => onOpenChange(false)}>
            My Vault
          </DrawerItem>
          <DrawerItem to="/bin" icon={<Trash2 className="size-4" />} onNavigate={() => onOpenChange(false)}>
            Bin
          </DrawerItem>
          <DrawerItem to="/settings" icon={<Settings className="size-4" />} onNavigate={() => onOpenChange(false)}>
            Account settings
          </DrawerItem>
        </div>

        <Separator />

        <div className="px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Theme
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <ThemeButton active={theme === "light"} onClick={() => setTheme("light")} icon={<Sun className="size-4" />} label="Light" />
            <ThemeButton active={theme === "dark"} onClick={() => setTheme("dark")} icon={<Moon className="size-4" />} label="Dark" />
            <ThemeButton active={theme === "system"} onClick={() => setTheme("system")} icon={<Monitor className="size-4" />} label="Auto" />
          </div>
        </div>

        <Separator />

        <div className="mt-auto px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
              <AvatarFallback className="bg-primary-soft text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{profile.full_name ?? "Your account"}</p>
              <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <Button variant="outline" className="mt-3 w-full" onClick={handleLogout}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DrawerItem({
  to,
  icon,
  children,
  onNavigate,
}: {
  to: string;
  icon: ReactNode;
  children: ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[status=active]:bg-primary-soft data-[status=active]:text-primary"
      activeOptions={{ exact: true }}
    >
      <span className="text-muted-foreground [[data-status=active]_&]:text-primary">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}

function ThemeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors " +
        (active
          ? "border-primary bg-primary-soft text-primary"
          : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground")
      }
    >
      {icon}
      {label}
    </button>
  );
}
