import { useServerFn } from "@tanstack/react-start";
import { Archive, Film, Image as ImageIcon, Loader2, Play, RefreshCw, RotateCcw, Search, ShieldCheck, Trash2, Unlink, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { archiveMediaAsset, deleteMediaAssetPermanently, getAdminWorkspace, registerMediaAsset, removeMediaFromContent, replaceMediaAsset, restoreMediaAsset } from "@/lib/content.functions";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml", "video/mp4", "video/webm", "video/quicktime"] as const;
const IMAGE_MAX = 10 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;

type MediaItem = Awaited<ReturnType<typeof getAdminWorkspace>>["media"][number];
type RegisterMedia = ReturnType<typeof useServerFn<typeof registerMediaAsset>>;

function mediaKind(type: string) { return type.startsWith("video/") ? "video" : "image"; }
function validateFile(file: File, expected?: "image" | "video") {
  const kind = mediaKind(file.type);
  if (!(ACCEPTED as readonly string[]).includes(file.type) || file.size > (kind === "video" ? VIDEO_MAX : IMAGE_MAX)) return "Choose a supported image (10 MB) or MP4/WebM/MOV video (50 MB).";
  if (expected && kind !== expected) return `Choose another ${expected} file.`;
  return null;
}
function formatSize(bytes: number) { return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`; }
function storedPath(value: string) { return value.replace(/^.*\/storage\/v1\/object\/(?:public|sign|authenticated)\/site-media\//, "").split("?")[0] ?? value; }

function useMediaPreviews(media: MediaItem[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = media.map((item) => `${item.storage_path}:${item.byte_size}:${item.name}`).join("|");
  useEffect(() => {
    let active = true;
    const paths = [...new Set(media.map((item) => storedPath(item.storage_path)))];
    if (!paths.length) { setUrls({}); return; }
    void supabase.storage.from("site-media").createSignedUrls(paths, 600).then(({ data }) => {
      if (!active) return;
      const next: Record<string, string> = {};
      for (const item of data ?? []) if (item.path && item.signedUrl) next[item.path] = item.signedUrl;
      setUrls(next);
    });
    return () => { active = false; };
  }, [key]);
  return urls;
}

export function MediaLibrary({ media, registerMedia, onChanged }: { media: MediaItem[]; registerMedia: RegisterMedia; onChanged: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("active");
  const previews = useMediaPreviews(media);
  const visible = useMemo(() => media.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesKind = kind === "all" || mediaKind(item.mime_type) === kind;
    const matchesStatus = status === "all" || (status === "archived" ? Boolean(item.deleted_at) : !item.deleted_at);
    return matchesQuery && matchesKind && matchesStatus;
  }), [media, query, kind, status]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("media") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    const invalid = validateFile(file);
    if (invalid) { toast.error(invalid); return; }
    setUploading(true);
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
    const path = `${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from("site-media").upload(path, file, { contentType: file.type, upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return; }
    try {
      const dimensions = await imageDimensions(file);
      await registerMedia({ data: { name: file.name, storagePath: path, mimeType: file.type as (typeof ACCEPTED)[number], altText: "", byteSize: file.size, ...dimensions } });
      form.reset();
      toast.success("Media uploaded");
      onChanged();
    } catch (errorValue) {
      await supabase.storage.from("site-media").remove([path]);
      toast.error(errorValue instanceof Error ? errorValue.message : "Upload could not be recorded");
    } finally { setUploading(false); }
  }

  return <section className="grid gap-5">
    <form onSubmit={upload} className="grid gap-3 rounded-lg border border-border bg-card p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <label className="grid min-w-0 gap-1.5"><span className="text-sm font-medium">Upload image or video</span><Input name="media" type="file" accept={ACCEPTED.join(",")} required /></label>
      <Button type="submit" disabled={uploading}>{uploading ? <Loader2 className="animate-spin" /> : <Upload />} {uploading ? "Uploading…" : "Upload"}</Button>
    </form>
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
      <label className="relative min-w-0"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search media by filename" aria-label="Search media" /></label>
      <Select value={kind} onValueChange={setKind}><SelectTrigger aria-label="Filter by media type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Images and videos</SelectItem><SelectItem value="image">Images</SelectItem><SelectItem value="video">Videos</SelectItem></SelectContent></Select>
      <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Filter by media status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem><SelectItem value="all">All statuses</SelectItem></SelectContent></Select>
    </div>
    {visible.length === 0 ? <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">No media matches this view.</div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map((item) => {
        const previewUrl = previews[storedPath(item.storage_path)];
        return <MediaCard key={item.id} item={item} {...(previewUrl ? { previewUrl } : {})} onChanged={onChanged} />;
      })}
    </div>}
  </section>;
}

function MediaCard({ item, previewUrl, onChanged }: { item: MediaItem; previewUrl?: string; onChanged: () => void }) {
  const archiveMedia = useServerFn(archiveMediaAsset);
  const restoreMedia = useServerFn(restoreMediaAsset);
  const replaceMedia = useServerFn(replaceMediaAsset);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const isVideo = mediaKind(item.mime_type) === "video";

  async function replace(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    const invalid = validateFile(file, isVideo ? "video" : "image");
    if (invalid) { toast.error(invalid); return; }
    setBusy(true);
    try {
      const { error } = await supabase.storage.from("site-media").update(storedPath(item.storage_path), file, { contentType: file.type, upsert: true });
      if (error) throw error;
      const dimensions = await imageDimensions(file);
      await replaceMedia({ data: { id: item.id, name: file.name, mimeType: file.type as (typeof ACCEPTED)[number], byteSize: file.size, ...dimensions } });
      toast.success("Media replaced"); onChanged();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Media could not be replaced"); }
    finally { setBusy(false); }
  }

  async function toggleArchive() {
    setBusy(true);
    try { if (item.deleted_at) { await restoreMedia({ data: { id: item.id } }); toast.success("Media restored"); } else { await archiveMedia({ data: { id: item.id } }); toast.success("Media archived"); } onChanged(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Media could not be updated"); }
    finally { setBusy(false); }
  }

  return <article className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm">
    <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
      {previewUrl ? isVideo ? <VideoPreview src={previewUrl} name={item.name} /> : <img src={previewUrl} alt={item.alt_text || item.name} className="size-full object-cover transition duration-300 group-hover:scale-[1.02]" loading="lazy" /> : <div className="grid size-full place-items-center text-muted-foreground">{isVideo ? <Film className="size-10" /> : <ImageIcon className="size-10" />}</div>}
      <div className="absolute left-2 top-2 flex gap-2">{item.deleted_at ? <Badge variant="secondary">Archived</Badge> : null}{item.is_protected ? <Badge><ShieldCheck /> Protected</Badge> : null}</div>
    </div>
    <div className="grid gap-3 p-4">
      <div className="min-w-0"><strong className="block truncate text-sm" title={item.name}>{item.name}</strong><span className="mt-1 block text-xs text-muted-foreground">{formatSize(item.byte_size)}</span></div>
      <div className="grid grid-cols-2 gap-2">
        <input ref={inputRef} type="file" className="hidden" accept={isVideo ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/avif,image/svg+xml"} onChange={replace} aria-label={`Replace ${item.name}`} />
        <Button size="sm" variant="outline" disabled={busy || Boolean(item.deleted_at)} onClick={() => inputRef.current?.click()}><RefreshCw /> Replace</Button>
        <RemoveFromContentDialog item={item} onChanged={onChanged} />
        <Button size="sm" variant="outline" disabled={busy || item.is_protected} onClick={toggleArchive}>{item.deleted_at ? <><RotateCcw /> Restore</> : <><Archive /> Archive</>}</Button>
        {item.deleted_at && !item.is_protected ? <DeleteMediaDialog id={item.id} name={item.name} onDeleted={onChanged} /> : null}
      </div>
    </div>
  </article>;
}

function VideoPreview({ src, name }: { src: string; name: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  return <div className="relative size-full"><video ref={videoRef} src={src} controls={playing} preload="metadata" className="size-full object-cover" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />{!playing ? <Button type="button" size="icon" className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-platform" aria-label={`Play ${name}`} onClick={() => void videoRef.current?.play()}><Play className="size-5 fill-current" /></Button> : null}</div>;
}

function RemoveFromContentDialog({ item, onChanged }: { item: MediaItem; onChanged: () => void }) {
  const removeMedia = useServerFn(removeMediaFromContent);
  const [busy, setBusy] = useState(false);
  async function run() { setBusy(true); try { const result = await removeMedia({ data: { id: item.id, confirmed: true } }); toast.success(result.removedReferences ? `Removed from ${result.removedReferences} content item(s)` : "This media was not attached to content"); onChanged(); } catch (error) { toast.error(error instanceof Error ? error.message : "References could not be removed"); } finally { setBusy(false); } }
  return <AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="outline" className="col-span-2" disabled={busy || Boolean(item.deleted_at)}><Unlink /> Remove from content</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove this media from content?</AlertDialogTitle><AlertDialogDescription>This clears this file from every public content item currently using it. The file stays in the Media Library.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => void run()}>Remove from content</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

function DeleteMediaDialog({ id, name, onDeleted }: { id: string; name: string; onDeleted: () => void }) {
  const deleteMedia = useServerFn(deleteMediaAssetPermanently);
  const [open, setOpen] = useState(false); const [typed, setTyped] = useState(""); const [busy, setBusy] = useState(false); const [dependencies, setDependencies] = useState<{ titles: string[]; usage: number } | null>(null); const [confirmDeps, setConfirmDeps] = useState(false);
  function reset(next: boolean) { setOpen(next); if (!next) { setTyped(""); setDependencies(null); setConfirmDeps(false); } }
  async function run() { setBusy(true); try { const result = await deleteMedia({ data: { id, confirmName: typed, removeDependencies: confirmDeps } }); if (!result.ok) { setDependencies({ titles: result.dependencies, usage: result.usageCount }); toast.error("This media is still in use. Confirm reference removal to continue."); return; } toast.success(result.removedReferences ? `Media deleted and ${result.removedReferences} reference(s) removed` : "Media permanently deleted"); reset(false); onDeleted(); } catch (error) { toast.error(error instanceof Error ? error.message : "Media could not be deleted"); } finally { setBusy(false); } }
  return <AlertDialog open={open} onOpenChange={reset}><AlertDialogTrigger asChild><Button size="sm" variant="destructive" className="col-span-2"><Trash2 /> Delete Permanently</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Permanently delete this media?</AlertDialogTitle><AlertDialogDescription>This removes the file from storage and the Media Library. Type <strong className="break-all text-foreground">{name}</strong> to confirm.</AlertDialogDescription></AlertDialogHeader><Input value={typed} onChange={(event) => setTyped(event.target.value)} placeholder={name} aria-label="Type the file name to confirm" />{dependencies ? <div className="rounded-md border border-destructive/40 p-3 text-sm"><p className="font-semibold">Still referenced{dependencies.usage ? ` (usage count ${dependencies.usage})` : ""}:</p>{dependencies.titles.length ? <ul className="mt-1 list-disc pl-5 text-muted-foreground">{dependencies.titles.slice(0, 8).map((title) => <li key={title}>{title}</li>)}</ul> : null}<label className="mt-3 flex items-center gap-2"><Switch checked={confirmDeps} onCheckedChange={setConfirmDeps} /> Remove these references and delete anyway</label></div> : null}<AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel><Button variant="destructive" disabled={busy || typed.trim() !== name || (dependencies !== null && !confirmDeps)} onClick={run}><Trash2 /> {busy ? "Deleting…" : "Delete Permanently"}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

async function imageDimensions(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return {};
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return {};
  const result = { width: bitmap.width, height: bitmap.height }; bitmap.close(); return result;
}