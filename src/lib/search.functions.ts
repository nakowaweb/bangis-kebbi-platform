import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createPublicSupabase, mediaUrl, signSiteMedia } from "@/lib/public-content.server";

export type SiteSearchResult = {
  id: string;
  title: string;
  category: string;
  snippet: string;
  url: string;
  imageUrl: string | null;
};

const routeFor = (type: string, slug: string) => {
  if (type === "service") return `/services/${slug}`;
  if (type === "project") return `/projects/${slug}`;
  if (type === "blog_post") return `/blog/${slug}`;
  if (type.startsWith("umrah")) return "/umrah";
  if (type.startsWith("foundation")) return "/foundation";
  if (type === "community") return "/community";
  if (type === "contact") return "/contact";
  if (type === "about" && slug === "professional-cv") return "/cv";
  if (type === "about") return "/about";
  if (type === "business" && slug.includes("credential")) return "/#company-credentials";
  if (type === "business") return "/business";
  if (type === "footer" && slug === "privacy-policy") return "/privacy";
  if (type === "footer" && slug === "terms-of-use") return "/terms";
  if (type === "footer" && slug === "refund-policy") return "/refund-policy";
  return "/";
};

const categoryFor = (type: string, category: string | null) => {
  if (category === "company_credential") return "Company Credentials";
  return type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const searchPublicSite = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ query: z.string().trim().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    try {
      const client = createPublicSupabase();
      const term = data.query.toLowerCase();
      const [{ data: rows }, { data: settings }] = await Promise.all([
        client
          .from("content_entries")
          .select("id,content_type,slug,title,summary,body,category,payload,image_path")
          .order("sort_order", { ascending: true })
          .limit(200),
        client.from("site_settings").select("social_links").eq("is_active", true).limit(1).maybeSingle(),
      ]);
      const signed = await signSiteMedia((rows ?? []).map((row) => row.image_path));
      const results = (rows ?? []).filter((row) => {
        const payloadText = row.payload && typeof row.payload === "object" ? JSON.stringify(row.payload) : "";
        return `${row.title} ${row.summary ?? ""} ${row.body ?? ""} ${row.slug} ${row.category ?? ""} ${payloadText}`.toLowerCase().includes(term);
      }).slice(0, 30).map((row): SiteSearchResult => {
        const payload = row.payload && typeof row.payload === "object" && !Array.isArray(row.payload) ? row.payload : {};
        const credentialText = row.category === "company_credential"
          ? [payload["organization"], payload["number"], payload["documentType"]].filter((value) => typeof value === "string").join(" · ")
          : "";
        return {
          id: row.id,
          title: row.title,
          category: categoryFor(row.content_type, row.category),
          snippet: row.summary || credentialText || row.body?.slice(0, 180) || "Open this page on BangisKebbi.com.",
          url: routeFor(row.content_type, row.slug),
          imageUrl: mediaUrl(row.image_path, signed),
        };
      });
      const config = settings?.social_links && typeof settings.social_links === "object" && !Array.isArray(settings.social_links)
        ? settings.social_links as Record<string, unknown>
        : {};
      return { results, googleCx: typeof config["googleSearchCx"] === "string" ? config["googleSearchCx"] : "" };
    } catch {
      return { results: [] as SiteSearchResult[], googleCx: "" };
    }
  });

export const getPublicSearchConfig = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await createPublicSupabase().from("site_settings").select("social_links").eq("is_active", true).limit(1).maybeSingle();
    const config = data?.social_links && typeof data.social_links === "object" && !Array.isArray(data.social_links)
      ? data.social_links as Record<string, unknown>
      : {};
    return { googleCx: typeof config["googleSearchCx"] === "string" ? config["googleSearchCx"] : "" };
  } catch {
    return { googleCx: "" };
  }
});