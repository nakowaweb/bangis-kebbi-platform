import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Check, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { registerMediaAsset } from "@/lib/content.functions";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"] as const;
const IMAGE_MAX = 10 * 1024 * 1024;
const MAX_ITEMS = 20;

type Asset = { id: string; name: string; storage_path: string; alt_text: string; status?: string };

function toPath(value: string) {
  return value.replace(/^.*\/storage\/v1\/object\/(?:public|sign|authenticated)\/site-media\//, "").split("?")[0] ?? value;
}
function isExternal(value: string) {
  return /^(https?:)?\/\//i.test(value) || value.startsWith("/") || value.startsWith("data:");
}

/** Signs a list of stored paths for admin previews only; signed links are never saved. */
function useSignedPreviews(values: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = values.join("|");
  useEffect(() => {
    let alive = true;
    const stored = [...new Set(values.filter((v) => !isExternal(v)).map(toPath))];
    const direct: Record<string, string> = {};
    values.filter(isExternal).forEach((v) => { direct[v] = v; });
    if (stored.length === 0) { setUrls(direct); return; }
    supabase.storage.from("site-media").createSignedUrls(stored, 600).then(({ data }) => {
      if (!alive) return;
      const next = { ...direct };
      for (const item of data ?? []) if (item.path && item.signedUrl) next[item.path] = item.signedUrl;
      setUrls(next);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (value: string) => urls[isExternal(value) ? value : toPath(value)];
}

/**
 * Gallery editor backed by the Media Library. Stores only storage paths (comma separated
 * in editor state); secure links are generated when the gallery is displayed.
 */
export function GalleryPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const items = useMemo(() => value.split(",").map((v) => v.trim()).filter(Boolean), [value]);
  const set = (next: string[]) => onChange(next.slice(0, MAX_ITEMS).join(", "));
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const registerMedia = useServerFn(registerMediaAsset);
  const filtered = (assets ?? []).filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
  const preview = useSignedPreviews([...items, ...(open ? filtered.slice(0, 60).map((a) => a.storage_path) : [])]);

  async function loadAssets() {
    setLoadError(null);
    const { data, error } = await supabase.from("media_assets").select("id,name,storage_path,alt_text,mime_type,status").is("deleted_at", null).eq("status", "published").like("mime_type", "image/%").order("created_at", { ascending: false }).limit(300);
    if (error) { setLoadError(error.message); setAssets([]); return; }
    setAssets(data ?? []);
  }

  function openPicker() { setPicked([]); setQuery(""); setOpen(true); void loadAssets(); }

  function move(index: number, dir: -1 | 1) {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    set(next);
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    const added: string[] = [];
    for (const file of files) {
      if (!(IMAGE_TYPES as readonly string[]).includes(file.type) || file.size > IMAGE_MAX) { toast.error(`${file.name}: choose a JPG, PNG, WebP, AVIF or SVG image up to 10 MB.`); continue; }
      const path = `${crypto.randomUUID()}-${file.name.toLowerCase().replace(/[^a-z0-9.-]/g, "-")}`;
      const { error } = await supabase.storage.from("site-media").upload(path, file, { contentType: file.type, upsert: false });
      if (error) { toast.error(`Upload failed: ${error.message}`); continue; }
      try {
        let width: number | undefined; let height: number | undefined;
        if (file.type !== "image/svg+xml") { const b = await createImageBitmap(file).catch(() => null); if (b) { width = b.width; height = b.height; b.close(); } }
        await registerMedia({ data: { name: file.name, storagePath: path, mimeType: file.type as (typeof IMAGE_TYPES)[number], altText: "", byteSize: file.size, ...(width ? { width } : {}), ...(height ? { height } : {}) } });
        added.push(path);
      } catch (e) {
        await supabase.storage.from("site-media").remove([path]);
        toast.error(e instanceof Error ? e.message : "Upload could not be recorded.");
      }
    }
    setUploading(false);
    if (added.length) {
      set([...items, ...added.filter((p) => !items.includes(p))]);
      toast.success(`${added.length} image${added.length > 1 ? "s" : ""} uploaded as draft. Publish in Media before selecting.`);
      if (open) void loadAssets();
    }
  }

  function addPicked() {
    set([...items, ...picked.filter((p) => !items.includes(p))]);
    setOpen(false);
  }

  return (
    <div className="grid gap-2">
      <Label>Gallery images</Label>
      <div className="grid gap-3 rounded-md border border-border bg-secondary/40 p-3">
        {items.length === 0 ? <p className="text-xs text-muted-foreground">No gallery images selected.</p> : (
          <ul className="grid gap-2">
            {items.map((item, index) => (
              <li key={item} className="flex items-center gap-3 rounded border border-border bg-card p-2">
                <div className="size-14 shrink-0 overflow-hidden rounded bg-secondary">
                  {preview(item) ? <img src={preview(item)} alt="" className="size-full object-cover" /> : <Loader2 className="m-4 size-4 animate-spin text-muted-foreground" />}
                </div>
                <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={item}>{item}</p>
                <Button type="button" size="icon" variant="ghost" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp /></Button>
                <Button type="button" size="icon" variant="ghost" aria-label="Move down" disabled={index === items.length - 1} onClick={() => move(index, 1)}><ArrowDown /></Button>
                <Button type="button" size="icon" variant="ghost" aria-label="Remove from gallery" onClick={() => set(items.filter((v) => v !== item))}><Trash2 /></Button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={openPicker} disabled={items.length >= MAX_ITEMS}><ImagePlus /> Choose from Media Library</Button>
          <input ref={inputRef} type="file" multiple className="hidden" accept={IMAGE_TYPES.join(",")} onChange={handleUpload} aria-label="Upload gallery images" />
          <Button type="button" size="sm" variant="outline" disabled={uploading || items.length >= MAX_ITEMS} onClick={() => inputRef.current?.click()}>{uploading ? <Loader2 className="animate-spin" /> : <Upload />} {uploading ? "Uploading…" : "Upload new images"}</Button>
        </div>
        <p className="text-xs text-muted-foreground">Up to {MAX_ITEMS} images. Only file references are saved; secure links are created when the gallery is shown.</p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Choose gallery images</DialogTitle></DialogHeader>
          <Input placeholder="Search by file name" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="max-h-[55vh] overflow-y-auto">
            {assets === null ? <Loader2 className="m-6 size-5 animate-spin text-muted-foreground" /> : loadError ? <p className="p-4 text-sm text-destructive">Could not load the Media Library: {loadError}</p> : filtered.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No images found. Upload new images instead.</p> : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {filtered.slice(0, 60).map((asset) => {
                  const already = items.includes(asset.storage_path);
                  const isPicked = picked.includes(asset.storage_path);
                  return (
                    <button key={asset.id} type="button" disabled={already} onClick={() => setPicked((p) => isPicked ? p.filter((v) => v !== asset.storage_path) : [...p, asset.storage_path])} className={`relative overflow-hidden rounded-md border text-left disabled:opacity-50 ${isPicked ? "border-primary ring-2 ring-primary" : "border-border"}`}>
                      <div className="aspect-square bg-secondary">{preview(asset.storage_path) ? <img src={preview(asset.storage_path)} alt={asset.alt_text} className="size-full object-cover" loading="lazy" /> : null}</div>
                      <p className="truncate p-1.5 text-xs">{asset.name}</p>
                      {isPicked || already ? <span className="absolute right-1 top-1 rounded-full bg-primary p-1 text-primary-foreground"><Check className="size-3" /></span> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" disabled={picked.length === 0} onClick={addPicked}>Add {picked.length || ""} selected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
