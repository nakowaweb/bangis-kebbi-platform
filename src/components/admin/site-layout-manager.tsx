import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, RotateCcw, Save, Upload } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { registerMediaAsset } from "@/lib/content.functions";
import { DEFAULT_LAYOUT, SECTION_LABELS, SERVICE_MINI_SLUGS, TEXT_OVERRIDE_KEYS, TEXT_OVERRIDE_LABELS, type SiteLayout } from "@/lib/site-layout";
import { getAdminSiteLayout, saveSiteLayout } from "@/lib/site-layout.functions";
import miniAiWebDesign from "@/assets/service-mini/ai-web-design.webp";
import miniWebDevelopment from "@/assets/service-mini/web-development.webp";
import miniUiUx from "@/assets/service-mini/ui-ux-design.webp";
import miniWordpress from "@/assets/service-mini/wordpress-development.webp";
import miniBusiness from "@/assets/service-mini/digital-business-solutions.webp";
import miniMaintenance from "@/assets/service-mini/website-maintenance.webp";

const bundledMinis: Record<string, string> = { "ai-web-design": miniAiWebDesign, "web-development": miniWebDevelopment, "ui-ux-design": miniUiUx, "wordpress-development": miniWordpress, "digital-business-solutions": miniBusiness, "website-maintenance": miniMaintenance };
const titleOf = (slug: string) => slug.split("-").map((w) => (w === "ui" || w === "ux" ? w.toUpperCase() : w[0]?.toUpperCase() + w.slice(1))).join(" ");
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];

export function SiteLayoutManager({ onChanged }: { onChanged?: () => void }) {
  const load = useServerFn(getAdminSiteLayout);
  const save = useServerFn(saveSiteLayout);
  const registerMedia = useServerFn(registerMediaAsset);
  const query = useQuery({ queryKey: ["admin-site-layout"], queryFn: () => load() });
  const [layout, setLayout] = useState<SiteLayout>(DEFAULT_LAYOUT);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) return;
    const { miniUrls, ...rest } = query.data;
    setLayout(rest);
    setPreviews(miniUrls);
  }, [query.data]);

  function move(index: number, delta: number) {
    const order = [...layout.order];
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target]!, order[index]!];
    setLayout({ ...layout, order });
  }

  async function persist(next: SiteLayout, message = "Site layout saved") {
    setBusy("save");
    try {
      await save({ data: { sections: next.sections, order: next.order, motion: next.motion, text: next.text as never, minis: next.minis as never } });
      toast.success(message);
      await query.refetch();
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally { setBusy(null); }
  }

  async function storeMini(slug: string, blob: Blob, type: string, name: string) {
    const ext = type.split("/")[1]?.replace("jpeg", "jpg") ?? "webp";
    const path = `service-mini/${slug}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("site-media").upload(path, blob, { contentType: type, upsert: false });
    if (error) throw new Error(error.message);
    await registerMedia({ data: { name, storagePath: path, mimeType: type as "image/png", altText: `${titleOf(slug)} service illustration`, byteSize: blob.size } });
    const next = { ...layout, minis: { ...layout.minis, [slug]: path } };
    setLayout(next);
    await persist(next, `${titleOf(slug)} illustration saved to the Media Gallery`);
  }

  async function importBundled(slug: string) {
    setBusy(slug);
    try {
      const response = await fetch(bundledMinis[slug]!);
      const blob = await response.blob();
      await storeMini(slug, blob, "image/webp", `service-${slug}.webp`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not add"); } finally { setBusy(null); }
  }

  async function importAll() {
    for (const slug of SERVICE_MINI_SLUGS) if (!layout.minis[slug]) await importBundled(slug);
  }

  async function replace(slug: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type) || file.size > 10 * 1024 * 1024) { toast.error("Use a PNG, JPG, WEBP or AVIF image under 10 MB."); return; }
    setBusy(slug);
    try { await storeMini(slug, file, file.type, file.name); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not replace"); } finally { setBusy(null); }
  }

  function setText(key: (typeof TEXT_OVERRIDE_KEYS)[number], lang: "en" | "ar" | "ha", value: string) {
    const current = layout.text[key] ?? { en: "", ar: "", ha: "" };
    setLayout({ ...layout, text: { ...layout.text, [key]: { ...current, [lang]: value } } });
  }

  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading site layout…</p>;

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader><CardTitle>Homepage sections</CardTitle><CardDescription>Show, hide and reorder the sections below the hero. Hidden sections are never deleted.</CardDescription></CardHeader>
        <CardContent className="grid gap-2">
          {layout.order.map((key, index) => (
            <div key={key} className="flex items-center gap-3 rounded-md border border-border p-3">
              <span className="w-6 text-xs text-muted-foreground">{index + 1}</span>
              <span className="flex-1 text-sm font-semibold">{SECTION_LABELS[key]}</span>
              <Button size="icon" variant="ghost" aria-label={`Move ${SECTION_LABELS[key]} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp /></Button>
              <Button size="icon" variant="ghost" aria-label={`Move ${SECTION_LABELS[key]} down`} disabled={index === layout.order.length - 1} onClick={() => move(index, 1)}><ArrowDown /></Button>
              <Switch aria-label={`Show ${SECTION_LABELS[key]}`} checked={layout.sections[key]} onCheckedChange={(value) => setLayout({ ...layout, sections: { ...layout.sections, [key]: value } })} />
            </div>
          ))}
          <label className="mt-3 grid gap-1 text-sm font-semibold">Motion
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={layout.motion} onChange={(e) => setLayout({ ...layout, motion: e.target.value as SiteLayout["motion"] })}>
              <option value="full">Full (gentle animations)</option>
              <option value="reduced">Reduced (no looping motion)</option>
              <option value="off">Off (no animation)</option>
            </select>
          </label>
          <p className="text-xs text-muted-foreground">Visitors who ask their device for reduced motion always get reduced motion. Social platform order is set in the Social links tab.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Site text (English, Arabic, Hausa)</CardTitle><CardDescription>Leave a box empty to use the reviewed default wording for that language.</CardDescription></CardHeader>
        <CardContent className="grid gap-4">
          {TEXT_OVERRIDE_KEYS.map((key) => (
            <fieldset key={key} className="grid gap-2 rounded-md border border-border p-3">
              <legend className="px-1 text-sm font-semibold">{TEXT_OVERRIDE_LABELS[key]}</legend>
              <Input aria-label={`${TEXT_OVERRIDE_LABELS[key]} English`} placeholder="English" value={layout.text[key]?.en ?? ""} onChange={(e) => setText(key, "en", e.target.value)} />
              <Input dir="rtl" aria-label={`${TEXT_OVERRIDE_LABELS[key]} Arabic`} placeholder="العربية" value={layout.text[key]?.ar ?? ""} onChange={(e) => setText(key, "ar", e.target.value)} />
              <Input aria-label={`${TEXT_OVERRIDE_LABELS[key]} Hausa`} placeholder="Hausa" value={layout.text[key]?.ha ?? ""} onChange={(e) => setText(key, "ha", e.target.value)} />
            </fieldset>
          ))}
        </CardContent>
      </Card>

      <div><Button onClick={() => persist(layout)} disabled={busy !== null}>{busy === "save" ? <Loader2 className="animate-spin" /> : <Save />} Save layout and text</Button></div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div><CardTitle>Service illustrations</CardTitle><CardDescription>Each is stored in the Media Gallery. Replacing one updates the homepage; old files stay in the gallery.</CardDescription></div>
          <Button variant="outline" size="sm" disabled={busy !== null || SERVICE_MINI_SLUGS.every((s) => layout.minis[s])} onClick={importAll}><ImagePlus /> Add all to Media Gallery</Button>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_MINI_SLUGS.map((slug) => {
            const saved = layout.minis[slug];
            return (
              <div key={slug} className="grid gap-2 rounded-md border border-border p-3">
                <img src={(saved && previews[slug]) || bundledMinis[slug]} alt={`${titleOf(slug)} illustration`} className="mx-auto size-24 object-contain" />
                <p className="text-sm font-semibold">{titleOf(slug)}</p>
                <p className="text-xs text-muted-foreground">{saved ? "In Media Gallery" : "Built-in file (not yet in Media Gallery)"}</p>
                <div className="flex flex-wrap gap-2">
                  {!saved ? <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => importBundled(slug)}><ImagePlus /> Add</Button> : null}
                  <Button size="sm" variant="outline" disabled={busy !== null} asChild><label className="cursor-pointer">{busy === slug ? <Loader2 className="animate-spin" /> : <Upload />} Replace<input type="file" accept={IMAGE_TYPES.join(",")} className="sr-only" onChange={(e) => replace(slug, e)} /></label></Button>
                  {saved ? <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => { const minis = { ...layout.minis }; delete minis[slug]; const next = { ...layout, minis }; setLayout(next); void persist(next, "Restored the built-in illustration"); }}><RotateCcw /> Use built-in</Button> : null}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
