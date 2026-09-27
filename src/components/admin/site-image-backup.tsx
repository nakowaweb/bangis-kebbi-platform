import { useState } from "react";
import { toast } from "sonner";
import { ImageDown, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { registerMediaAsset } from "@/lib/content.functions";

type Media = { storage_path: string; name: string };
type SiteImage = { name: string; url: string };

const bundled = import.meta.glob("/src/assets/**/*.{png,jpg,jpeg,webp,avif,svg}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const pointers = import.meta.glob("/src/assets/**/*.asset.json", { eager: true, import: "default" }) as Record<string, { url: string; original_filename: string; content_type: string }>;

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", avif: "image/avif", svg: "image/svg+xml" };
const baseName = (path: string) => path.split("/").pop() ?? path;

/** Every picture the public website ships with (bundled files first, CDN-only pictures second), de-duplicated by file name. */
function siteImages(): SiteImage[] {
  const map = new Map<string, SiteImage>();
  for (const [path, url] of Object.entries(bundled)) map.set(baseName(path), { name: baseName(path), url });
  for (const pointer of Object.values(pointers)) {
    const name = pointer.original_filename;
    if (!map.has(name) && MIME[name.split(".").pop()?.toLowerCase() ?? ""]) map.set(name, { name, url: pointer.url });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function SiteImageBackup({ media, onDone }: { media: Media[]; onDone: () => void }) {
  const registerMedia = useServerFn(registerMediaAsset);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const saved = new Set(media.map((m) => m.storage_path));
  const missing = siteImages().filter((image) => !saved.has(`imported/${image.name}`));

  async function run() {
    setRunning(true);
    const failures: string[] = [];
    let done = 0;
    for (const image of missing) {
      setProgress(`${++done} / ${missing.length}`);
      try {
        const response = await fetch(image.url);
        if (!response.ok) throw new Error(`could not load (${response.status})`);
        const blob = await response.blob();
        const type = MIME[image.name.split(".").pop()?.toLowerCase() ?? ""] ?? blob.type;
        const path = `imported/${image.name}`;
        const { error } = await supabase.storage.from("site-media").upload(path, blob, { contentType: type, upsert: true });
        if (error) throw new Error(error.message);
        await registerMedia({ data: { name: image.name, storagePath: path, mimeType: type as "image/png", altText: image.name.replace(/\.\w+$/, "").replace(/[-_]/g, " "), byteSize: blob.size } });
      } catch (error) {
        failures.push(`${image.name}: ${error instanceof Error ? error.message : "failed"}`);
      }
    }
    setRunning(false);
    setProgress("");
    onDone();
    if (failures.length) toast.error(`${failures.length} image(s) could not be saved — ${failures[0]}`);
    else toast.success(`${missing.length} website images saved to the Media Library`);
  }

  if (missing.length === 0) return <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">All website images are saved in the Media Library.</p>;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <strong className="text-sm">Save all website images to the Media Library</strong>
      <p className="mt-1 text-sm text-muted-foreground">{missing.length} images currently used by the website are not yet in the Media Library. This copies the original files at full quality. Nothing on the website changes and no existing media is replaced.</p>
      <Button className="mt-3" onClick={run} disabled={running}>{running ? <Loader2 className="animate-spin" /> : <ImageDown />} {running ? `Saving ${progress}` : "Save all website images"}</Button>
    </div>
  );
}
