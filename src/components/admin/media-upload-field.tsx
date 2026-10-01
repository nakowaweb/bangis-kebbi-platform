import { useServerFn } from "@tanstack/react-start";
import { Check, ImageIcon, Images, Loader2, Trash2, Upload, Video } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { registerMediaAsset } from "@/lib/content.functions";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"] as const;
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
const IMAGE_MAX = 10 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;

type Kind = "image" | "video";

function isExternal(value: string) {
  return /^(https?:)?\/\//i.test(value) || value.startsWith("/") || value.startsWith("data:");
}

/** Resolves a stored media value to something previewable: storage paths get a short-lived signed link. */
function usePreviewUrl(value: string) {
  const [url, setUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let alive = true;
    setMissing(false);
    if (!value) { setUrl(null); return; }
    if (isExternal(value)) { setUrl(value); return; }
    const path = value.replace(/^.*\/storage\/v1\/object\/(?:public|sign)\/site-media\//, "").split("?")[0] ?? value;
    supabase.storage.from("site-media").createSignedUrl(path, 600).then(({ data, error }) => {
      if (!alive) return;
      if (error || !data?.signedUrl) { setUrl(null); setMissing(true); } else setUrl(data.signedUrl);
    });
    return () => { alive = false; };
  }, [value]);
  return { url, missing };
}

/**
 * Upload-from-computer media field for CMS content. Files go to the private site-media
 * storage, are recorded in the Media Library, and are previewed through signed links.
 */
export function MediaUploadField({ label, value, onChange, kind = "image", hint }: { label: string; value: string; onChange: (path: string) => void; kind?: Kind; hint?: string }) {
  const registerMedia = useServerFn(registerMediaAsset);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { url, missing } = usePreviewUrl(value);
  const types: readonly string[] = kind === "image" ? IMAGE_TYPES : VIDEO_TYPES;
  const max = kind === "image" ? IMAGE_MAX : VIDEO_MAX;

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!types.includes(file.type) || file.size > max) {
      toast.error(kind === "image" ? "Choose a JPG, PNG, WebP, AVIF or SVG image up to 10 MB." : "Choose an MP4, WebM or MOV video up to 50 MB.");
      return;
    }
    setUploading(true);
    const path = `${crypto.randomUUID()}-${file.name.toLowerCase().replace(/[^a-z0-9.-]/g, "-")}`;
    const { error } = await supabase.storage.from("site-media").upload(path, file, { contentType: file.type, upsert: false });
    if (error) { toast.error(`Upload failed: ${error.message}`); setUploading(false); return; }
    try {
      let width: number | undefined;
      let height: number | undefined;
      if (kind === "image" && file.type !== "image/svg+xml") {
        const bitmap = await createImageBitmap(file).catch(() => null);
        if (bitmap) { width = bitmap.width; height = bitmap.height; bitmap.close(); }
      }
      await registerMedia({ data: { name: file.name, storagePath: path, mimeType: file.type as (typeof IMAGE_TYPES)[number] | (typeof VIDEO_TYPES)[number], altText: "", byteSize: file.size, ...(width ? { width } : {}), ...(height ? { height } : {}) } });
      onChange(path);
      toast.success(`${kind === "image" ? "Image" : "Video"} uploaded as a draft. Publish it in Media before using it publicly.`);
    } catch (errorValue) {
      await supabase.storage.from("site-media").remove([path]);
      toast.error(errorValue instanceof Error ? errorValue.message : "Upload could not be recorded.");
    }
    setUploading(false);
  }

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="grid gap-3 rounded-md border border-border bg-secondary/40 p-3">
        {value ? (
          url ? (
            kind === "image" ? (
              <img src={url} alt="" className="max-h-44 w-full rounded object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            ) : (
              <video src={url} controls preload="metadata" className="max-h-44 w-full rounded" />
            )
          ) : missing ? (
            <p className="text-xs text-destructive">This file could not be found in storage. Upload it again to replace it.</p>
          ) : (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">{kind === "image" ? <ImageIcon className="size-4" /> : <Video className="size-4" />} No {kind} selected</div>
        )}
        {value ? <p className="truncate text-xs text-muted-foreground" title={value}>{value}</p> : null}
        <div className="flex flex-wrap gap-2">
          <input ref={inputRef} type="file" className="hidden" accept={types.join(",")} onChange={handleFile} aria-label={`Upload ${label}`} />
          <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />} {uploading ? "Uploading…" : "Upload from device"}
          </Button>
          {kind === "image" ? <LibraryChooser onPick={onChange} /> : null}
          {value ? (
            <Button type="button" size="sm" variant="ghost" disabled={uploading} onClick={() => onChange("")}>
              <Trash2 /> Remove from this content
            </Button>
          ) : null}
        </div>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

type LibraryAsset = { id: string; name: string; storage_path: string; alt_text: string };

/** Single-image chooser over the Media Library. Picking never moves or deletes the library file. */
function LibraryChooser({ onPick }: { onPick: (path: string) => void }) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<LibraryAsset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const filtered = (assets ?? []).filter((a) => `${a.name} ${a.alt_text}`.toLowerCase().includes(query.toLowerCase())).slice(0, 60);
  const key = filtered.map((a) => a.storage_path).join("|");

  useEffect(() => {
    if (!open || filtered.length === 0) return;
    let alive = true;
    supabase.storage.from("site-media").createSignedUrls(filtered.map((a) => a.storage_path), 600).then(({ data }) => {
      if (!alive) return;
      const next: Record<string, string> = {};
      for (const item of data ?? []) if (item.path && item.signedUrl) next[item.path] = item.signedUrl;
      setUrls((prev) => ({ ...prev, ...next }));
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

  async function openChooser() {
    setOpen(true); setPicked(null); setQuery(""); setError(null);
    const { data, error: err } = await supabase.from("media_assets").select("id,name,storage_path,alt_text").is("deleted_at", null).like("mime_type", "image/%").order("created_at", { ascending: false }).limit(300);
    if (err) { setError(err.message); setAssets([]); return; }
    setAssets(data ?? []);
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => void openChooser()}><Images /> Choose from Media Library</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Choose from Media Library</DialogTitle></DialogHeader>
          <Input placeholder="Search images" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search images" />
          <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-4">
            {assets === null ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : null}
            {error ? <p className="col-span-full text-sm text-destructive">{error}</p> : null}
            {assets && !error && filtered.length === 0 ? <p className="col-span-full text-sm text-muted-foreground">No images found.</p> : null}
            {filtered.map((a) => (
              <button key={a.id} type="button" aria-pressed={picked === a.storage_path} onClick={() => setPicked(a.storage_path)} className={`relative overflow-hidden rounded-md border-2 text-left ${picked === a.storage_path ? "border-primary" : "border-transparent"}`}>
                <div className="aspect-square bg-secondary">{urls[a.storage_path] ? <img src={urls[a.storage_path]} alt={a.alt_text} loading="lazy" className="size-full object-cover" /> : null}</div>
                <p className="truncate p-1 text-xs">{a.name}</p>
                {picked === a.storage_path ? <span className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-4" /></span> : null}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" disabled={!picked} onClick={() => { if (picked) { onPick(picked); setOpen(false); } }}>Use selected image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
