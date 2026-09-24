import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { registerMediaAsset, saveContentEntry } from "@/lib/content.functions";
import { articles, projects, services } from "@/lib/portfolio-content";
import heroAi from "@/assets/hero-ai-workspace.jpg";
import heroBusiness from "@/assets/hero-business-solutions.jpg";
import heroCommunity from "@/assets/hero-community-connection.jpg";
import heroUmrah from "@/assets/hero-umrah-community-founder.jpg";

type Entry = { content_type: string; slug: string };
type Media = { storage_path: string; name: string };

type Item = {
  contentType: "service" | "project" | "blog_post" | "homepage";
  slug: string;
  title: string;
  summary: string;
  body?: string;
  category?: string;
  author?: string;
  image: string;
  imageAlt: string;
  sortOrder: number;
};

/** The content and pictures the public website already shows (built into the site), so they can be managed in the CMS. */
function currentSiteItems(): Item[] {
  return [
    ...services.map((s, i) => ({ contentType: "service" as const, slug: s.slug, title: s.title.en, summary: s.summary.en, body: [...s.canDo.en].join("\n"), image: s.image, imageAlt: s.imageAlt.en, sortOrder: i })),
    ...projects.map((p, i) => ({ contentType: "project" as const, slug: p.slug, title: p.title.en, summary: p.summary.en, body: p.sections.en.map((x) => `${x.title}\n${x.body}`).join("\n\n"), category: p.category.en, image: p.image, imageAlt: p.imageAlt.en, sortOrder: i })),
    ...articles.map((a, i) => ({ contentType: "blog_post" as const, slug: a.slug, title: a.title.en, summary: a.summary.en, body: a.body.en.join("\n\n"), category: a.category.en, author: a.author, image: a.image, imageAlt: a.title.en, sortOrder: i })),
    ...[
      { src: heroAi, label: "AI-assisted web design" },
      { src: heroBusiness, label: "Business website solutions" },
      { src: heroCommunity, label: "Community and collaboration" },
      { src: heroUmrah, label: "Umrah support community" },
    ].map((h, i) => ({ contentType: "homepage" as const, slug: `hero-slide-${i + 2}`, title: h.label, summary: "", category: "hero_carousel", image: h.src, imageAlt: h.label, sortOrder: i + 2 })),
  ];
}

const fileName = (url: string) => (url.split("/").pop() ?? "image").split("?")[0]!.replace(/-[A-Za-z0-9_]{8}(\.\w+)$/, "$1");

export function CurrentSiteImporter({ entries, media, onDone }: { entries: Entry[]; media: Media[]; onDone: () => void }) {
  const registerMedia = useServerFn(registerMediaAsset);
  const saveEntry = useServerFn(saveContentEntry);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");

  const items = currentSiteItems();
  const existing = new Set(entries.map((e) => `${e.content_type}:${e.slug}`));
  const missing = items.filter((item) => !existing.has(`${item.contentType}:${item.slug}`));

  async function run() {
    setRunning(true);
    const uploaded = new Map<string, string>(media.map((m) => [`imported/${m.name}`, m.storage_path]));
    const failures: string[] = [];
    let done = 0;
    for (const item of missing) {
      setProgress(`${++done} / ${missing.length}: ${item.title}`);
      try {
        const name = fileName(item.image);
        let path = uploaded.get(`imported/${name}`);
        if (!path) {
          const blob = await (await fetch(item.image)).blob();
          const type = blob.type || (name.endsWith(".jpg") ? "image/jpeg" : "image/webp");
          path = `imported/${name}`;
          const { error } = await supabase.storage.from("site-media").upload(path, blob, { contentType: type, upsert: true });
          if (error) throw new Error(`Image upload: ${error.message}`);
          await registerMedia({ data: { name, storagePath: path, mimeType: type as "image/jpeg", altText: item.imageAlt, byteSize: blob.size } });
          uploaded.set(`imported/${name}`, path);
        }
        await saveEntry({ data: {
          contentType: item.contentType, slug: item.slug, title: item.title, summary: item.summary.slice(0, 1000) || undefined,
          body: item.body, category: item.category, author: item.author, imagePath: path, imageAlt: item.imageAlt,
          status: "published", isEnabled: true, isFeatured: false, sortOrder: item.sortOrder, payload: {},
        } });
      } catch (error) {
        failures.push(`${item.title}: ${error instanceof Error ? error.message : "failed"}`);
      }
    }
    setRunning(false);
    setProgress("");
    onDone();
    if (failures.length) toast.error(`${failures.length} item(s) failed — ${failures[0]}`);
    else toast.success(`${missing.length} existing website items are now in the CMS`);
  }

  if (missing.length === 0) return null;
  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-4">
      <strong className="text-sm">Bring the current website into the CMS</strong>
      <p className="mt-1 text-sm text-muted-foreground">
        {missing.length} services, projects, blog posts and hero slides are shown on the website but are not yet in the CMS. This copies them (with their images) so you can edit, replace or remove them here. Nothing already in the CMS is changed.
      </p>
      <Button className="mt-3" onClick={run} disabled={running}>{running ? `Importing ${progress}` : "Import current website content"}</Button>
    </div>
  );
}
