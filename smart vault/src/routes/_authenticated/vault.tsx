import { useEffect, useMemo, useState } from "react";
import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Menu,
  Search,
  Plus,
  FileText,
  Image as ImageIcon,
  FileArchive,
  Film,
  FileType2,
  Files,
  CloudOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NavDrawer } from "@/components/nav-drawer";
import { FileCard } from "@/components/file-card";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import {
  CATEGORY_LABELS,
  downloadFile,
  listFiles,
  renameFile,
  softDeleteFile,
  type FileCategory,
} from "@/lib/files";

export const Route = createFileRoute("/_authenticated/vault")({
  head: () => ({
    meta: [
      { title: "My Vault — SmartVault" },
      { name: "description", content: "Your private cloud workspace." },
      { property: "og:title", content: "My Vault — SmartVault" },
      { property: "og:description", content: "Access your files from anywhere." },
    ],
  }),
  component: VaultPage,
});

const CATEGORIES: { value: FileCategory | "all"; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "all", label: "All Files", icon: Files },
  { value: "text", label: "Text", icon: FileText },
  { value: "image", label: "Images", icon: ImageIcon },
  { value: "zip", label: "ZIP", icon: FileArchive },
  { value: "pdf", label: "PDF", icon: FileType2 },
  { value: "video", label: "Videos", icon: Film },
];

function VaultPage() {
  const { user } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [category, setCategory] = useState<FileCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [online, setOnline] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const profileQ = useQuery({
    enabled: !!user,
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("email, full_name, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (
        data ?? {
          email: user!.email ?? null,
          full_name: (user!.user_metadata?.full_name as string | undefined) ?? null,
          avatar_url: (user!.user_metadata?.avatar_url as string | undefined) ?? null,
        }
      );
    },
  });

  const filesQ = useQuery({
    enabled: !!user,
    queryKey: ["files", user?.id, category, search],
    queryFn: () =>
      listFiles({ userId: user!.id, deleted: false, category, search }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["files", user?.id] });

  const files = filesQ.data ?? [];

  return (
    <div className="min-h-dvh bg-surface">
      <NavDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        profile={profileQ.data ?? { email: user?.email ?? null, full_name: null, avatar_url: null }}
      />

      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">My Vault</h1>
          <span className="ml-auto text-xs text-muted-foreground">
            {files.length} {files.length === 1 ? "file" : "files"}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-4">
        {!online ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm text-muted-foreground">
            <CloudOff className="size-4" /> You're offline. Changes will sync when back online.
          </div>
        ) : null}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files and notes…"
            className="h-11 pl-9"
            aria-label="Search files"
          />
        </div>

        <div className="mt-4 -mx-4 overflow-x-auto px-4 pb-1">
          <div className="flex gap-2">
            {CATEGORIES.map(({ value, label, icon: Icon }) => {
              const active = category === value;
              return (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  className={
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors " +
                    (active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground")
                  }
                  aria-pressed={active}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <section className="mt-6">
          {filesQ.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <EmptyState
              title={search ? "No matches" : "No files yet"}
              description={
                search
                  ? "Try a different search term."
                  : `Tap the ${CATEGORY_LABELS[category === "all" ? "text" : category]} upload button to add your first file.`
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onRename={async (id, n) => {
                    await renameFile(id, n);
                    invalidate();
                  }}
                  onDelete={async (f) => {
                    try {
                      await softDeleteFile(f.id);
                      toast.success("Moved to Bin");
                      invalidate();
                    } catch (e) {
                      toast.error("Couldn't delete", {
                        description: e instanceof Error ? e.message : "Unknown",
                      });
                    }
                  }}
                  onDownload={async (f) => {
                    try {
                      await downloadFile(f);
                    } catch (e) {
                      toast.error("Download failed", {
                        description: e instanceof Error ? e.message : "Unknown",
                      });
                    }
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <button
        onClick={() => navigate({ to: "/upload" })}
        aria-label="Upload"
        className="fixed bottom-6 left-6 z-30 grid size-14 place-items-center rounded-full bg-cta text-cta-foreground shadow-fab transition-transform hover:bg-cta-hover active:scale-95"
      >
        <Plus className="size-6" />
      </button>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
        <Files className="size-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
