import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Upload, X, FileText, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import {
  extFromName,
  storageKeyFor,
  type FileCategory,
} from "@/lib/files";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({
    meta: [
      { title: "Upload — SmartVault" },
      { name: "description", content: "Add a new file or note to your vault." },
      { property: "og:title", content: "Upload — SmartVault" },
      { property: "og:description", content: "Upload files securely to your vault." },
    ],
  }),
  component: UploadPage,
});

const MAX_SIZES: Record<Exclude<FileCategory, "text">, number> = {
  image: 15 * 1024 * 1024,
  zip: 500 * 1024 * 1024,
  pdf: 100 * 1024 * 1024,
  video: 1024 * 1024 * 1024,
};

const ACCEPT: Record<Exclude<FileCategory, "text">, string> = {
  image: "image/*",
  zip: ".zip,application/zip,application/x-zip-compressed",
  pdf: "application/pdf",
  video: "video/*",
};

function UploadPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<FileCategory>("text");
  const [filename, setFilename] = useState("");
  const [noteText, setNoteText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const resetForNewCategory = (c: FileCategory) => {
    setCategory(c);
    setFiles([]);
    setNoteText("");
    setProgress(0);
  };

  const handlePickFiles = (list: FileList | null) => {
    if (!list) return;
    let arr = Array.from(list);
    if (category === "image") arr = arr.slice(0, 5);
    else arr = arr.slice(0, 1);
    const max = category !== "text" ? MAX_SIZES[category] : Infinity;
    const okFiles = arr.filter((f) => {
      if (f.size > max) {
        toast.error(`${f.name} is too large`);
        return false;
      }
      return true;
    });
    setFiles(okFiles);
  };

  const validate = () => {
    const nameOk = z.string().trim().min(1).max(120).safeParse(filename);
    if (!nameOk.success) {
      toast.error("Please enter a file name");
      return false;
    }
    if (category === "text") {
      if (!noteText.trim()) {
        toast.error("Note is empty");
        return false;
      }
      return true;
    }
    if (files.length === 0) {
      toast.error("Choose a file to upload");
      return false;
    }
    if (category === "image" && files.length > 5) {
      toast.error("Max 5 images");
      return false;
    }
    if (category !== "image" && files.length !== 1) {
      toast.error(`Only 1 ${category.toUpperCase()} allowed`);
      return false;
    }
    return true;
  };

  const doSave = async () => {
    if (!user) return;
    if (!validate()) return;
    setUploading(true);
    setProgress(5);

    try {
      if (category === "text") {
        const { error } = await supabase.from("files").insert({
          user_id: user.id,
          filename: filename.trim(),
          category: "text",
          text_content: noteText,
          file_size: new Blob([noteText]).size,
          mime_type: "text/plain",
        });
        if (error) throw error;
        setProgress(100);
      } else {
        const total = files.length;
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const ext = extFromName(f.name);
          const path = storageKeyFor(user.id, ext);
          const { error: upErr } = await supabase.storage.from("vault").upload(path, f, {
            contentType: f.type || undefined,
            upsert: false,
          });
          if (upErr) throw upErr;
          const displayName =
            files.length > 1 ? `${filename.trim()} (${i + 1})${ext}` : ensureExt(filename.trim(), ext);
          const { error: dbErr } = await supabase.from("files").insert({
            user_id: user.id,
            filename: displayName,
            category,
            storage_path: path,
            file_size: f.size,
            mime_type: f.type || null,
          });
          if (dbErr) {
            await supabase.storage.from("vault").remove([path]);
            throw dbErr;
          }
          setProgress(Math.round(((i + 1) / total) * 100));
        }
      }
      queryClient.invalidateQueries({ queryKey: ["files", user.id] });
      toast.success("Uploaded to your vault");
      navigate({ to: "/vault" });
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : "Unknown" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" aria-label="Back" onClick={() => navigate({ to: "/vault" })}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">Upload</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-32">
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="upload-name">File name</Label>
              <Input
                id="upload-name"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Give it a name"
                maxLength={120}
              />
            </div>

            <div className="space-y-1.5">
              <Label>File type</Label>
              <Select
                value={category}
                onValueChange={(v) => resetForNewCategory(v as FileCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text note</SelectItem>
                  <SelectItem value="image">Images (up to 5)</SelectItem>
                  <SelectItem value="zip">ZIP</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {category === "text" ? (
              <div className="space-y-1.5">
                <Label htmlFor="upload-note">Note</Label>
                <Textarea
                  id="upload-note"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Paste or type your note…"
                  className="min-h-64"
                />
                <p className="text-xs text-muted-foreground">
                  {new Blob([noteText]).size.toLocaleString()} bytes
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Choose {category === "image" ? "up to 5 images" : `1 ${category.toUpperCase()}`}</Label>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT[category]}
                  multiple={category === "image"}
                  hidden
                  onChange={(e) => handlePickFiles(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface px-6 py-10 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {category === "image" ? (
                    <ImagePlus className="size-6" />
                  ) : (
                    <Upload className="size-6" />
                  )}
                  <span>
                    Tap to select {category === "image" ? "images" : `a ${category.toUpperCase()}`}
                  </span>
                </button>

                {files.length > 0 ? (
                  <ul className="space-y-2 pt-1">
                    {files.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm"
                      >
                        <FileText className="size-4 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(f.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={`Remove ${f.name}`}
                          onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}

            {uploading ? (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => navigate({ to: "/vault" })} disabled={uploading}>
                Cancel
              </Button>
              <Button variant="cta" onClick={doSave} disabled={uploading}>
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                Save to vault
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ensureExt(name: string, ext: string) {
  if (!ext) return name;
  return name.toLowerCase().endsWith(ext.toLowerCase()) ? name : name + ext;
}
