import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type FileCategory = "text" | "image" | "zip" | "pdf" | "video";
export type FileRow = Database["public"]["Tables"]["files"]["Row"];

export const CATEGORY_LABELS: Record<FileCategory, string> = {
  text: "Text",
  image: "Images",
  zip: "ZIP",
  pdf: "PDF",
  video: "Videos",
};

export const CATEGORY_MIME_PREFIX: Record<Exclude<FileCategory, "text">, string> = {
  image: "image/",
  zip: "application/zip",
  pdf: "application/pdf",
  video: "video/",
};

export function inferCategory(mime: string): FileCategory {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "pdf";
  if (
    mime === "application/zip" ||
    mime === "application/x-zip-compressed" ||
    mime === "application/x-zip"
  )
    return "zip";
  return "text";
}

export async function listFiles(opts: {
  userId: string;
  deleted: boolean;
  category?: FileCategory | "all";
  search?: string;
}): Promise<FileRow[]> {
  let q = supabase
    .from("files")
    .select("*")
    .eq("user_id", opts.userId)
    .eq("deleted", opts.deleted)
    .order("created_at", { ascending: false });

  if (opts.category && opts.category !== "all") q = q.eq("category", opts.category);
  if (opts.search && opts.search.trim()) {
    const term = `%${opts.search.trim()}%`;
    q = q.or(`filename.ilike.${term},text_content.ilike.${term}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function softDeleteFile(id: string) {
  const { error } = await supabase
    .from("files")
    .update({ deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function restoreFile(id: string) {
  const { error } = await supabase
    .from("files")
    .update({ deleted: false, deleted_at: null })
    .eq("id", id);
  if (error) throw error;
}

export async function permanentlyDeleteFile(row: FileRow) {
  if (row.storage_path) {
    const { data, error } = await supabase.storage.from("smartvault").download(row.storage_path);
  }
  const { error } = await supabase.from("files").delete().eq("id", row.id);
  if (error) throw error;
}

export async function renameFile(id: string, filename: string) {
  const { error } = await supabase.from("files").update({ filename }).eq("id", id);
  if (error) throw error;
}

export async function downloadFile(row: FileRow) {
  if (row.category === "text") {
    const blob = new Blob([row.text_content ?? ""], { type: "text/plain;charset=utf-8" });
    triggerDownload(blob, ensureExt(row.filename, ".txt"));
    return;
  }
  if (!row.storage_path) throw new Error("File missing storage path");
  const { data, error } = await supabase.storage.from("smartvault").download(row.storage_path);
  if (error) throw error;
  triggerDownload(data, row.filename);
}

function ensureExt(name: string, ext: string) {
  return name.toLowerCase().endsWith(ext) ? name : `${name}${ext}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function storageKeyFor(userId: string, ext: string) {
  const rand = crypto.randomUUID();
  return `${userId}/${Date.now()}-${rand}${ext ? (ext.startsWith(".") ? ext : "." + ext) : ""}`;
}

export function extFromName(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i) : "";
}
