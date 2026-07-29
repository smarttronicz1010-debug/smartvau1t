import { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  FileArchive,
  Film,
  FileType2,
  MoreVertical,
  Download,
  Pencil,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FileCategory, FileRow } from "@/lib/files";
import { formatBytes, formatDate } from "@/lib/format";

const CATEGORY_ICON: Record<FileCategory, React.ComponentType<{ className?: string }>> = {
  text: FileText,
  image: ImageIcon,
  zip: FileArchive,
  pdf: FileType2,
  video: Film,
};

const CATEGORY_TINT: Record<FileCategory, string> = {
  text: "bg-primary-soft text-primary",
  image: "bg-[oklch(0.95_0.05_150)] text-[oklch(0.45_0.12_150)] dark:bg-[oklch(0.3_0.06_150)] dark:text-[oklch(0.85_0.1_150)]",
  zip: "bg-[oklch(0.95_0.05_300)] text-[oklch(0.5_0.15_300)] dark:bg-[oklch(0.3_0.06_300)] dark:text-[oklch(0.85_0.1_300)]",
  pdf: "bg-[oklch(0.95_0.05_25)] text-[oklch(0.55_0.2_25)] dark:bg-[oklch(0.3_0.06_25)] dark:text-[oklch(0.8_0.13_25)]",
  video: "bg-accent text-accent-foreground",
};

export function FileCard({
  file,
  onRename,
  onDelete,
  onDownload,
  onRestore,
  onPurge,
  variant = "active",
}: {
  file: FileRow;
  onRename?: (id: string, name: string) => Promise<void> | void;
  onDelete?: (file: FileRow) => Promise<void> | void;
  onDownload?: (file: FileRow) => Promise<void> | void;
  onRestore?: (file: FileRow) => Promise<void> | void;
  onPurge?: (file: FileRow) => Promise<void> | void;
  variant?: "active" | "bin";
}) {
  const [renaming, setRenaming] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [name, setName] = useState(file.filename);
  const Icon = CATEGORY_ICON[file.category as FileCategory];

  const doRename = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Filename can't be empty");
      return;
    }
    try {
      await onRename?.(file.id, trimmed);
      setRenaming(false);
      toast.success("Renamed");
    } catch (e) {
      toast.error("Rename failed", { description: e instanceof Error ? e.message : "Unknown" });
    }
  };

  return (
    <>
      <div className="group flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-card transition-shadow hover:shadow-soft">
        <div
          className={
            "grid size-11 shrink-0 place-items-center rounded-xl " +
            CATEGORY_TINT[file.category as FileCategory]
          }
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{file.filename}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDate(file.created_at)} · {(file.category as string).toUpperCase()} ·{" "}
            {formatBytes(Number(file.file_size))}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 opacity-70 group-hover:opacity-100"
              aria-label="File actions"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {variant === "active" ? (
              <>
                <DropdownMenuItem onSelect={() => onDownload?.(file)}>
                  <Download className="size-4" /> Download
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRenaming(true)}>
                  <Pencil className="size-4" /> Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => onDelete?.(file)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" /> Move to Bin
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onSelect={() => onRestore?.(file)}>
                  <RotateCcw className="size-4" /> Restore
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setPurgeOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" /> Delete forever
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename file</DialogTitle>
            <DialogDescription>Give this file a new name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rename-input">Filename</Label>
            <Input
              id="rename-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") doRename();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(false)}>
              Cancel
            </Button>
            <Button variant="cta" onClick={doRename}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={purgeOpen} onOpenChange={setPurgeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file forever?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the file from your vault. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await onPurge?.(file);
                  toast.success("File deleted");
                } catch (e) {
                  toast.error("Delete failed", {
                    description: e instanceof Error ? e.message : "Unknown",
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
