import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Menu, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NavDrawer } from "@/components/nav-drawer";
import { FileCard } from "@/components/file-card";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { listFiles, permanentlyDeleteFile, restoreFile } from "@/lib/files";

export const Route = createFileRoute("/_authenticated/bin")({
  head: () => ({
    meta: [
      { title: "Bin — SmartVault" },
      { name: "description", content: "Restore or permanently delete files." },
      { property: "og:title", content: "Bin — SmartVault" },
      { property: "og:description", content: "Manage your deleted files." },
    ],
  }),
  component: BinPage,
});

function BinPage() {
  const { user } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const profileQ = useQuery({
    enabled: !!user,
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("email, full_name, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      return (
        data ?? {
          email: user!.email ?? null,
          full_name: null,
          avatar_url: null,
        }
      );
    },
  });

  const filesQ = useQuery({
    enabled: !!user,
    queryKey: ["files", user?.id, "bin"],
    queryFn: () => listFiles({ userId: user!.id, deleted: true }),
  });

  const files = filesQ.data ?? [];
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["files", user?.id] });
  };

  return (
    <div className="min-h-dvh bg-surface">
      <NavDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        profile={profileQ.data ?? { email: user?.email ?? null, full_name: null, avatar_url: null }}
      />

      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" aria-label="Back" onClick={() => navigate({ to: "/vault" })}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">Bin</h1>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">
        {filesQ.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Trash2 className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold">Bin is empty</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Deleted files will appear here. Restore or delete them forever.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                variant="bin"
                onRestore={async (f) => {
                  await restoreFile(f.id);
                  toast.success("Restored");
                  invalidate();
                }}
                onPurge={async (f) => {
                  await permanentlyDeleteFile(f);
                  invalidate();
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
