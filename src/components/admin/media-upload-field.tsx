import { useServerFn } from "@tanstack/react-start";
import { ImageIcon, Loader2, Trash2, Upload, Video } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />} {uploading ? "Uploading…" : value ? `Replace ${kind}` : `Upload ${kind}`}
          </Button>
          {value ? (
            <Button type="button" size="sm" variant="ghost" disabled={uploading} onClick={() => onChange("")}>
              <Trash2 /> Remove
            </Button>
          ) : null}
        </div>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}
