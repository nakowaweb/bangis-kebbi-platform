import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { registerMediaAsset, saveContentEntry } from "@/lib/content.functions";
import { articles, projects, services } from "@/lib/portfolio-content";
import heroDigitalSolutions from "@/assets/hero-digital-solutions.jpg";
import heroCommunitySupport from "@/assets/hero-community-support.jpg";
import heroUmrahSupport from "@/assets/hero-umrah-support.jpg";
import heroGlobalPlatform from "@/assets/hero-global-platform.jpg";
import supportCommunityRelief from "@/assets/support-community-relief.jpg";
import supportEmergencyRelief from "@/assets/support-emergency-relief.jpg";
import supportEssentialEducation from "@/assets/support-essential-education.jpg";
import supportFoodAssistance from "@/assets/support-food-assistance.jpg";
import supportHardship from "@/assets/support-hardship.jpg";
import supportInKind from "@/assets/support-in-kind.jpg";
import supportLowIncomeFamilies from "@/assets/support-low-income-families.jpg";
import supportMedicalCoordination from "@/assets/support-medical-coordination.jpg";
import supportOrphans from "@/assets/support-orphans.jpg";
import supportZakatSadaqah from "@/assets/support-zakat-sadaqah.jpg";
import supportMission from "@/assets/support-mission.jpg";
import supportVision from "@/assets/support-vision.jpg";

type Entry = { content_type: string; slug: string };
type Media = { storage_path: string; name: string };

type Item = {
  contentType: "service" | "project" | "blog_post" | "homepage" | "foundation_mission" | "foundation_vision" | "foundation_what_we_do";
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
      { src: heroDigitalSolutions, label: "Digital Solutions / Web Development", alt: "Abubakar Alhaji Abubakar collaborating with a professional web development team" },
      { src: heroCommunitySupport, label: "BK Community Support Initiative", alt: "Abubakar Alhaji Abubakar participating in dignified community support" },
      { src: heroUmrahSupport, label: "Umrah Support Program", alt: "Abubakar Alhaji Abubakar supporting a community group in a respectful Umrah setting" },
      { src: heroGlobalPlatform, label: "Global Platform / Opportunities", alt: "Abubakar Alhaji Abubakar at a global digital platform workspace" },
    ].map((h, i) => ({ contentType: "homepage" as const, slug: `hero-feature-${i + 1}`, title: h.label, summary: "", category: "hero_carousel", image: h.src, imageAlt: h.alt, sortOrder: i + 1 })),
    { contentType: "foundation_mission", slug: "mission", title: "Mission", summary: "To provide practical, dignified and targeted support to people and families facing genuine hardship, with priority given to verified community needs.", image: supportMission, imageAlt: "Dignified community food support for a family", sortOrder: 0 },
    { contentType: "foundation_vision", slug: "vision", title: "Vision", summary: "Stronger, better-connected communities where people facing hardship can access timely and meaningful support.", image: supportVision, imageAlt: "A hopeful family looking toward a stronger community", sortOrder: 0 },
    ...[
      { slug: "food-assistance", title: "Food Assistance", summary: "Providing nutritious food items to individuals and families in need.", image: supportFoodAssistance },
      { slug: "orphan-support", title: "Orphan Support", summary: "Supporting orphans through care, education and essential needs.", image: supportOrphans },
      { slug: "low-income-families", title: "Support for Low-Income Families", summary: "Helping vulnerable families with essential needs and practical opportunities.", image: supportLowIncomeFamilies },
      { slug: "emergency-relief", title: "Emergency Relief", summary: "Providing coordinated support during crises and emergencies.", image: supportEmergencyRelief },
      { slug: "essential-supplies-education", title: "Essential Supplies / Education Support", summary: "Supplying school items, learning materials and other basic necessities.", image: supportEssentialEducation },
      { slug: "community-relief", title: "Community Relief", summary: "Supporting communities through targeted assistance and outreach.", image: supportCommunityRelief },
      { slug: "people-facing-hardship", title: "Support for People Facing Hardship", summary: "Helping people through difficult personal and social circumstances.", image: supportHardship },
      { slug: "medical-treatment-coordination", title: "Medical/Treatment Support Coordination", summary: "Helping coordinate practical support during serious treatment and illness.", image: supportMedicalCoordination },
      { slug: "zakat-sadaqah-support", title: "Zakat/Sadaqah Support", summary: "Coordinating eligible Zakat and Sadaqah support with care and responsibility.", image: supportZakatSadaqah },
      { slug: "in-kind-support", title: "In-Kind Support", summary: "Providing clothing, household items and other non-cash assistance.", image: supportInKind },
    ].map((program, index) => ({ contentType: "foundation_what_we_do" as const, ...program, imageAlt: `${program.title} community support`, sortOrder: index })),
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
        {missing.length} services, projects, blog posts, hero slides and community items are shown on the website but are not yet in the CMS. This copies them (with their images) so you can edit, replace or remove them here. Nothing already in the CMS is changed.
      </p>
      <Button className="mt-3" onClick={run} disabled={running}>{running ? `Importing ${progress}` : "Import current website content"}</Button>
    </div>
  );
}
