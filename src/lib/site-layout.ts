export const LAYOUT_SLUG = "site-layout";

export const HOMEPAGE_SECTIONS = ["quickActions", "services", "selectedWork", "community", "foundation", "blog", "contact"] as const;
export type HomepageSection = (typeof HOMEPAGE_SECTIONS)[number];
export const SECTION_LABELS: Record<HomepageSection, string> = {
  quickActions: "Homepage shortcuts", services: "Digital Services", selectedWork: "News and Update carousel (updates + projects)", community: "Community",
  foundation: "BK Foundation", blog: "Latest Updates (shown inside News and Update)", contact: "Contact & social",
};

/** Dictionary keys the Super Admin may override in English, Arabic and Hausa. */
export const TEXT_OVERRIDE_KEYS = ["foundation.exploreAction", "nav.credentials", "foundation.previewTitle", "foundation.previewShort", "credentials.title", "foundation.howTitle", "foundation.howBody", "foundation.contactAction", "foundation.heroBody", "nav.blog", "home.heroAccent", "home.heroBusinessTitleTop", "home.heroBusinessTitleBottom", "home.heroBusinessSubtitle", "home.projectsTitle"] as const;
export type TextOverrideKey = (typeof TEXT_OVERRIDE_KEYS)[number];
export const TEXT_OVERRIDE_LABELS: Record<TextOverrideKey, string> = {
  "foundation.exploreAction": "“Explore Foundation” button",
  "nav.credentials": "“Credentials” menu label",
  "foundation.previewTitle": "Homepage Foundation title",
  "foundation.previewShort": "Homepage Foundation description",
  "credentials.title": "Credentials page heading",
  "foundation.howTitle": "“How BK Foundation Works” heading",
  "foundation.howBody": "“How BK Foundation Works” text",
  "foundation.contactAction": "“Contact BK Foundation” button",
  "foundation.heroBody": "Foundation top section text",
  "nav.blog": "“News and Update” menu label",
  "home.heroAccent": "Hero small label",
  "home.heroBusinessTitleTop": "Hero headline line 1",
  "home.heroBusinessTitleBottom": "Hero headline line 2",
  "home.heroBusinessSubtitle": "Hero description",
  "home.projectsTitle": "News and Update carousel title",
};

export const SERVICE_MINI_SLUGS = ["ai-web-design", "web-development", "ui-ux-design", "wordpress-development", "digital-business-solutions", "website-maintenance"] as const;

export type LangText = { en: string; ar: string; ha: string };
export type SiteLayout = {
  sections: Record<HomepageSection, boolean>;
  order: HomepageSection[];
  motion: "full" | "reduced" | "off";
  /** Seconds for one full loop of the homepage service banner (lower = faster). */
  marqueeSeconds: number;
  /** Seconds between automatic Selected Work moves. */
  carouselSeconds: number;
  text: Partial<Record<TextOverrideKey, LangText>>;
  minis: Partial<Record<string, string>>;
  hero: HeroSlideshow;
};

export type HeroSlide = { path: string; alt: string; label: string; enabled: boolean };
/** Settings → Homepage → Hero Slideshow. Empty slides = the approved CMS/bundled slides keep showing. */
export type HeroSlideshow = { slides: HeroSlide[]; intervalSeconds: number; transitionMs: number };
export const DEFAULT_HERO: HeroSlideshow = { slides: [], intervalSeconds: 6, transitionMs: 1100 };

export const DEFAULT_LAYOUT: SiteLayout = {
  sections: Object.fromEntries(HOMEPAGE_SECTIONS.map((key) => [key, true])) as Record<HomepageSection, boolean>,
  order: [...HOMEPAGE_SECTIONS],
  motion: "full",
  marqueeSeconds: 14,
  carouselSeconds: 2,
  text: {},
  minis: {},
  hero: DEFAULT_HERO,
};

const obj = (value: unknown): Record<string, unknown> => (value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {});

/** Tolerates missing or partial saved data so older rows never break the page. */
export function normalizeLayout(raw: unknown): SiteLayout {
  const source = obj(raw);
  const sections = { ...DEFAULT_LAYOUT.sections };
  for (const [key, value] of Object.entries(obj(source["sections"]))) if ((HOMEPAGE_SECTIONS as readonly string[]).includes(key) && typeof value === "boolean") sections[key as HomepageSection] = value;
  const savedOrder = Array.isArray(source["order"]) ? source["order"].filter((key): key is HomepageSection => (HOMEPAGE_SECTIONS as readonly string[]).includes(key as string)) : [];
  const order = [...new Set([...savedOrder, ...HOMEPAGE_SECTIONS])];
  const motion = source["motion"] === "reduced" || source["motion"] === "off" ? source["motion"] : "full";
  const text: SiteLayout["text"] = {};
  for (const [key, value] of Object.entries(obj(source["text"]))) {
    if (!(TEXT_OVERRIDE_KEYS as readonly string[]).includes(key)) continue;
    const v = obj(value);
    text[key as TextOverrideKey] = { en: String(v["en"] ?? ""), ar: String(v["ar"] ?? ""), ha: String(v["ha"] ?? "") };
  }
  const minis: SiteLayout["minis"] = {};
  for (const [key, value] of Object.entries(obj(source["minis"]))) if ((SERVICE_MINI_SLUGS as readonly string[]).includes(key) && typeof value === "string" && value) minis[key] = value;
  const h = obj(source["hero"]);
  const num = (v: unknown, min: number, max: number, d: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d);
  const slides: HeroSlide[] = (Array.isArray(h["slides"]) ? h["slides"] : []).map(obj)
    .filter((x) => typeof x["path"] === "string" && x["path"])
    .slice(0, 8)
    .map((x) => ({ path: String(x["path"]), alt: String(x["alt"] ?? ""), label: String(x["label"] ?? ""), enabled: x["enabled"] !== false }));
  const hero: HeroSlideshow = { slides, intervalSeconds: num(h["intervalSeconds"], 2, 30, DEFAULT_HERO.intervalSeconds), transitionMs: num(h["transitionMs"], 300, 4000, DEFAULT_HERO.transitionMs) };
  const marqueeSeconds = num(source["marqueeSeconds"], 6, 60, 14);
  const carouselSeconds = num(source["carouselSeconds"], 2, 10, 2);
  return { sections, order, motion, marqueeSeconds, carouselSeconds, text, minis, hero };
}
