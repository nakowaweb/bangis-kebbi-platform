export const LAYOUT_SLUG = "site-layout";

export const HOMEPAGE_SECTIONS = ["quickActions", "services", "selectedWork", "community", "foundation", "blog", "contact"] as const;
export type HomepageSection = (typeof HOMEPAGE_SECTIONS)[number];
export const SECTION_LABELS: Record<HomepageSection, string> = {
  quickActions: "Homepage shortcuts", services: "Digital Services", selectedWork: "Selected Work", community: "Community",
  foundation: "BK Foundation", blog: "Latest Updates", contact: "Contact & social",
};

/** Dictionary keys the Super Admin may override in English, Arabic and Hausa. */
export const TEXT_OVERRIDE_KEYS = ["foundation.exploreAction", "nav.credentials", "foundation.previewTitle", "foundation.previewShort", "credentials.title", "foundation.howTitle", "foundation.howBody", "foundation.contactAction", "foundation.heroBody", "nav.blog"] as const;
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
  "nav.blog": "“Blog & News” menu label",
};

export const SERVICE_MINI_SLUGS = ["ai-web-design", "web-development", "ui-ux-design", "wordpress-development", "digital-business-solutions", "website-maintenance"] as const;

export type LangText = { en: string; ar: string; ha: string };
export type SiteLayout = {
  sections: Record<HomepageSection, boolean>;
  order: HomepageSection[];
  motion: "full" | "reduced" | "off";
  text: Partial<Record<TextOverrideKey, LangText>>;
  minis: Partial<Record<string, string>>;
};

export const DEFAULT_LAYOUT: SiteLayout = {
  sections: Object.fromEntries(HOMEPAGE_SECTIONS.map((key) => [key, true])) as Record<HomepageSection, boolean>,
  order: [...HOMEPAGE_SECTIONS],
  motion: "full",
  text: {},
  minis: {},
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
  return { sections, order, motion, text, minis };
}
