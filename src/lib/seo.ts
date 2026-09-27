import { defaultLanguage, hreflangOrder, isLanguageCode, type LanguageCode } from "@/lib/i18n/dictionary";
import { pageSeo } from "@/lib/i18n/seo-text";

/** Public site origin. Absolute URLs are required for canonical, og:url and hreflang. */
export const SITE_ORIGIN = "https://bangiskebbi.com";

const ogLocales: Record<LanguageCode, string> = {
  en: "en_NG",
  ar: "ar_SA",
  ha: "ha_NG",
  fr: "fr_FR",
  es: "es_ES",
  tr: "tr_TR",
  de: "de_DE",
  ur: "ur_PK",
  zh: "zh_CN",
};

/**
 * Localized public URLs use a `?lang=` suffix. The existing flat TanStack file routes stay
 * intact (no duplicate route tree), every locale has its own crawlable URL, and the server
 * renders that URL already translated.
 */
export function localizedPath(path: string, language: LanguageCode): string {
  if (language === defaultLanguage) return path;
  return `${path}${path.includes("?") ? "&" : "?"}lang=${language}`;
}

export function absoluteUrl(path: string, language: LanguageCode = defaultLanguage): string {
  return `${SITE_ORIGIN}${localizedPath(path, language)}`;
}

/** Reads the active language out of a route's search params (used inside `head()`). */
export function headLanguage(search: unknown): LanguageCode {
  const value = (search as Record<string, unknown> | undefined)?.["lang"];
  return isLanguageCode(value) ? value : defaultLanguage;
}

type MetaOptions = {
  title: string;
  description: string;
  path: string;
  language?: LanguageCode;
  /** Route search params. When supplied, the active `?lang=` decides the language automatically. */
  search?: unknown;
  /** Set for detail pages whose wording comes from translated CMS content, not the fixed page map. */
  localized?: boolean;
  type?: "website" | "article";
  canonical?: string | null | undefined;
  ogTitle?: string | null | undefined;
  ogDescription?: string | null | undefined;
  image?: string | null | undefined;
  noindex?: boolean;
  /** Private routes never advertise language alternates. */
  alternates?: boolean;
};

export function pageHead({
  title: rawTitle,
  description: rawDescription,
  path,
  language: explicitLanguage,
  search,
  localized = false,
  type = "website",
  canonical,
  ogTitle,
  ogDescription,
  image,
  noindex = false,
  alternates = true,
}: MetaOptions) {
  const language = explicitLanguage ?? (search === undefined ? defaultLanguage : headLanguage(search));
  const resolved = localized ? { title: rawTitle, description: rawDescription } : pageSeo(path, language, { title: rawTitle, description: rawDescription });
  const title = resolved.title;
  const description = resolved.description;
  const selfUrl = canonical || absoluteUrl(path, language);
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: ogTitle || title },
    { property: "og:description", content: ogDescription || description },
    { property: "og:type", content: type },
    { property: "og:url", content: selfUrl },
    { property: "og:locale", content: ogLocales[language] },
    { name: "twitter:card", content: "summary_large_image" },
  ];
  for (const code of hreflangOrder) {
    if (code !== language) meta.push({ property: "og:locale:alternate", content: ogLocales[code] });
  }
  if (noindex) meta.push({ name: "robots", content: "noindex, nofollow" });
  if (image && /^https:\/\//i.test(image)) {
    meta.push({ property: "og:image", content: image });
    meta.push({ name: "twitter:image", content: image });
  }

  const links: Array<Record<string, string>> = [{ rel: "canonical", href: selfUrl }];
  if (alternates && !noindex) {
    // hreflang mapping always follows the language codes, never the visual menu order.
    for (const code of hreflangOrder) {
      links.push({ rel: "alternate", hrefLang: code, href: absoluteUrl(path, code) });
    }
    links.push({ rel: "alternate", hrefLang: "x-default", href: absoluteUrl(path, defaultLanguage) });
  }

  return { meta, links };
}
