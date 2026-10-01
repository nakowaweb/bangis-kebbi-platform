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
import businessDigitalServices from "@/assets/business-digital-services.webp";
import businessNetworking from "@/assets/business-networking.webp";
import businessTechnology from "@/assets/business-technology.webp";
import businessCommunity from "@/assets/business-community.webp";
import businessGlobalOpportunities from "@/assets/business-global-opportunities.webp";
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
import communitySupportBanner from "@/assets/homepage-community-support-banner.png";
import quickNavHome from "@/assets/quick-nav/quick-nav-home.webp";
import quickNavServices from "@/assets/quick-nav/quick-nav-services.webp";
import quickNavUmrah from "@/assets/quick-nav/quick-nav-umrah.webp";
import quickNavProjects from "@/assets/quick-nav/quick-nav-projects.webp";
import quickNavBlog from "@/assets/quick-nav/quick-nav-blog.webp";
import quickNavFoundation from "@/assets/quick-nav/quick-nav-foundation.webp";
import quickNavCommunity from "@/assets/quick-nav/quick-nav-community.webp";
import quickNavCv from "@/assets/quick-nav/quick-nav-cv.webp";
import { umrahBalanceVisual, umrahInformationVisuals, umrahJourneyVisuals } from "@/lib/umrah-visuals";

type Entry = { id: string; content_type: string; slug: string; image_path: string | null };
type Media = { storage_path: string; name: string };

type Item = {
  contentType: "service" | "project" | "blog_post" | "homepage" | "about" | "business" | "umrah_step" | "umrah_information" | "foundation" | "foundation_mission" | "foundation_vision" | "foundation_what_we_do";
  slug: string;
  title: string;
  summary: string;
  body?: string;
  category?: string;
  author?: string;
  image?: string;
  imageAlt?: string;
  sortOrder: number;
  publishedAt?: string;
};

/** The content and pictures the public website already shows (built into the site), so they can be managed in the CMS. */
function currentSiteItems(): Item[] {
  return [
    ...services.map((s, i) => ({ contentType: "service" as const, slug: s.slug, title: s.title.en, summary: s.summary.en, body: [...s.canDo.en].join("\n"), image: s.image, imageAlt: s.imageAlt.en, sortOrder: i })),
    ...projects.map((p, i) => ({ contentType: "project" as const, slug: p.slug, title: p.title.en, summary: p.summary.en, body: p.sections.en.map((x) => `${x.title}\n${x.body}`).join("\n\n"), category: p.category.en, image: p.image, imageAlt: p.imageAlt.en, sortOrder: i })),
    ...articles.map((a, i) => ({ contentType: "blog_post" as const, slug: a.slug, title: a.title.en, summary: a.summary.en, body: a.body.en.join("\n\n"), category: a.category.en, author: a.author, image: a.image, imageAlt: a.title.en, sortOrder: i, publishedAt: a.publishedAt })),
    { contentType: "about", slug: "summary", title: "A Passion for Technology, People & Opportunities", summary: "I'm Abubakar Alhaji Abubakar, an AI Web Designer and Web Developer passionate about transforming ideas into practical digital solutions. Through BangisKebbi.com, I connect technology, business and people while creating opportunities for collaboration and community development.", sortOrder: 0 },
    { contentType: "about", slug: "about-card-1", title: "Creative Digital Solutions", summary: "I design modern websites and digital solutions that turn ideas into practical, accessible experiences.", sortOrder: 1 },
    { contentType: "about", slug: "about-card-2", title: "Reliable Support & Collaboration", summary: "I work with individuals, businesses and communities to provide dependable digital support and build useful connections.", sortOrder: 2 },
    { contentType: "about", slug: "about-card-3", title: "Global Mindset, Real Connections", summary: "I connect technology, business and people with a global outlook while staying grounded in real community needs.", sortOrder: 3 },
    { contentType: "about", slug: "about-card-4", title: "Technology for Positive Impact", summary: "I believe technology should create opportunities, solve real problems and contribute positively to people and communities.", sortOrder: 4 },
    { contentType: "about", slug: "about-quote", title: "“Technology gives you tools, but people give you opportunities.”", summary: "", sortOrder: 5 },
    ...[
      { src: heroDigitalSolutions, label: "Digital Solutions / Web Development", alt: "Abubakar Alhaji Abubakar collaborating with a professional web development team" },
      { src: heroCommunitySupport, label: "BK Foundation", alt: "Abubakar Alhaji Abubakar participating in dignified community support" },
      { src: heroUmrahSupport, label: "Umrah Support Program", alt: "Abubakar Alhaji Abubakar supporting a community group in a respectful Umrah setting" },
    ].map((h, i) => ({ contentType: "homepage" as const, slug: `hero-feature-${i + 1}`, title: h.label, summary: "", category: "hero_carousel", image: h.src, imageAlt: h.alt, sortOrder: i + 1 })),
    ...[
      { slug: "quick-nav-home", title: "Home", image: quickNavHome, imageAlt: "Premium house" },
      { slug: "quick-nav-services", title: "Services", image: quickNavServices, imageAlt: "Professional gear and tools" },
      { slug: "quick-nav-umrah", title: "Umrah", image: quickNavUmrah, imageAlt: "Kaaba at Masjid al-Haram" },
      { slug: "quick-nav-projects", title: "Projects", image: quickNavProjects, imageAlt: "Laptop displaying web development" },
      { slug: "quick-nav-blog", title: "Blog", image: quickNavBlog, imageAlt: "Article document with pen" },
      { slug: "quick-nav-foundation", title: "BK Foundation", image: quickNavFoundation, imageAlt: "Helping hands supporting people" },
      { slug: "quick-nav-community", title: "Verified Partners", image: quickNavCommunity, imageAlt: "Verified professional partners" },
      { slug: "quick-nav-cv", title: "CV", image: quickNavCv, imageAlt: "Professional résumé document" },
    ].map((item, index) => ({ contentType: "homepage" as const, ...item, summary: "", category: "quick_navigation", sortOrder: index })),
    ...[
      { slug: "digital-services", title: "Digital Services", image: businessDigitalServices },
      { slug: "business-networking", title: "Business Networking", image: businessNetworking },
      { slug: "technology", title: "Technology", image: businessTechnology },
      { slug: "community", title: "Community", image: businessCommunity },
      { slug: "global-opportunities", title: "Global Opportunities", image: businessGlobalOpportunities },
    ].map((item, index) => ({ contentType: "business" as const, ...item, summary: "A practical pathway for trusted connection and progress.", imageAlt: `${item.title} visual`, sortOrder: index })),
    ...umrahJourneyVisuals.map((item, index) => ({ contentType: "umrah_step" as const, ...item, title: ["Create an account", "Complete profile", "Submit information/documents", "Track Umrah support progress", "Review dashboard progress", "Prepare travel documents", "Coordinate travel arrangements", "Receive updates/support"][index] ?? item.slug, summary: "", imageAlt: item.alt, sortOrder: index })),
    ...umrahInformationVisuals.map((item, index) => ({ contentType: "umrah_information" as const, ...item, title: ["Documents & Privacy", "Review & Decisions", "Preparation", "Coordination", "Updates", "Cancellations & Refunds"][index] ?? item.slug, summary: "", imageAlt: item.alt, sortOrder: index })),
    { contentType: "umrah_information", slug: umrahBalanceVisual.slug, title: "Umrah Support Balance", summary: "Real member-specific balance and progress appear only in the private dashboard when available.", image: umrahBalanceVisual.image, imageAlt: umrahBalanceVisual.alt, sortOrder: 6 },
    { contentType: "foundation", slug: "overview", title: "Supporting people and communities.", summary: "Community initiatives designed for practical support, dignity and transparent updates.", image: communitySupportBanner, imageAlt: "Nigerian Muslim community members sharing educational support with children", sortOrder: 0 },
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

/**
 * Media name for an imported picture. Small pictures are inlined by the build as `data:` URLs, so the
 * old "last path segment" approach produced a base64 string longer than the 200-character name limit
 * (e.g. "Submit information/documents"). Use the content slug for those and cap every name at 200.
 */
function fileName(url: string, slug: string) {
  if (url.startsWith("data:")) {
    const ext = (/^data:image\/(\w+)/.exec(url)?.[1] ?? "webp").replace("jpeg", "jpg").replace("svg+xml", "svg");
    return `${slug}.${ext}`.slice(0, 200);
  }
  const base = (url.split("/").pop() ?? "image").split("?")[0]!.replace(/-[A-Za-z0-9_]{8}(\.\w+)$/, "$1");
  return (base || `${slug}.webp`).slice(-200);
}

/** Turns validation errors (raw JSON arrays) into one readable sentence. */
export function readableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "failed");
  try {
    const issues = JSON.parse(message) as Array<{ path?: unknown[]; message?: string }>;
    if (Array.isArray(issues) && issues.length) return issues.map((i) => `${(i.path ?? []).join(".") || "value"}: ${i.message ?? "invalid"}`).join("; ");
  } catch { /* not JSON */ }
  return message;
}

export function CurrentSiteImporter({ entries, media, onDone }: { entries: Entry[]; media: Media[]; onDone: () => void }) {
  const registerMedia = useServerFn(registerMediaAsset);
  const saveEntry = useServerFn(saveContentEntry);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");

  const items = currentSiteItems();
  const existing = new Map(entries.map((entry) => [`${entry.content_type}:${entry.slug}`, entry]));
  const oldBlogImages = /(?:corporate-concept|ecommerce-concept|business-website)\.(?:webp|png|jpe?g)$/i;
  const missing = items.filter((item) => {
    const entry = existing.get(`${item.contentType}:${item.slug}`);
    return !entry || (item.contentType === "blog_post" && (!entry.image_path || oldBlogImages.test(entry.image_path))) || (item.contentType === "foundation" && !entry.image_path);
  });

  async function run() {
    setRunning(true);
    const uploaded = new Map<string, string>(media.flatMap((m) => [[`imported/${m.name}`, m.storage_path], [m.storage_path, m.storage_path]] as Array<[string, string]>));
    const failures: string[] = [];
    let done = 0;
    for (const item of missing) {
      setProgress(`${++done} / ${missing.length}: ${item.title}`);
      try {
        const existingEntry = existing.get(`${item.contentType}:${item.slug}`);
        const name = item.image ? fileName(item.image, item.slug) : null;
        let path = name ? uploaded.get(`imported/${name}`) : undefined;
        // Reuse a picture this content already points to instead of uploading a duplicate copy.
        if (!path && existingEntry?.image_path && !oldBlogImages.test(existingEntry.image_path)) path = existingEntry.image_path;
        if (item.image && name && !path) {
          const blob = await (await fetch(item.image)).blob();
          const type = blob.type || (name.endsWith(".jpg") ? "image/jpeg" : "image/webp");
          path = `imported/${name}`;
          const { error } = await supabase.storage.from("site-media").upload(path, blob, { contentType: type, upsert: true });
          if (error) throw new Error(`Image upload: ${error.message}`);
          // Retries reuse the same path (upsert) and skip registering a second gallery record for it.
          if (!media.some((m) => m.storage_path === path)) await registerMedia({ data: { name, storagePath: path, mimeType: type as "image/jpeg", altText: (item.imageAlt ?? item.title).slice(0, 500), byteSize: blob.size } });
          uploaded.set(`imported/${name}`, path);
        }
        await saveEntry({ data: {
          ...(existingEntry ? { id: existingEntry.id } : {}),
          contentType: item.contentType, slug: item.slug, title: item.title.slice(0, 200), summary: item.summary.slice(0, 1000) || undefined,
          ...(item.body ? { body: item.body } : {}), ...(item.category ? { category: item.category } : {}), ...(item.author ? { author: item.author } : {}), ...(path ? { imagePath: path } : {}), ...(item.imageAlt ? { imageAlt: item.imageAlt } : {}),
          status: "published", isEnabled: true, isFeatured: false, sortOrder: item.sortOrder, payload: {}, ...(item.publishedAt ? { publishedAt: item.publishedAt } : {}),
        } });
      } catch (error) {
        failures.push(`${item.title}: ${readableError(error)}`);
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
