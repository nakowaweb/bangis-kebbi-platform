import { createFileRoute } from "@tanstack/react-router";

import { hreflangOrder } from "@/lib/i18n/dictionary";
import { createPublicSupabase } from "@/lib/public-content.server";
import { articles, projects, services } from "@/lib/portfolio-content";

const STATIC_PATHS = [
  "/",
  "/about",
  "/services",
  "/projects",
  "/business",
  "/umrah",
  "/foundation",
  "/community",
  "/blog",
  "/contact",
  "/cv",
  "/privacy",
  "/terms",
  "/refund-policy",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const host = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
        const origin = host ? `https://${host}` : url.origin;

        const client = createPublicSupabase();
        const [{ data: entries }, { data: foundationProjects }] = await Promise.all([
           client.from("content_entries").select("content_type,slug,updated_at").in("content_type", ["service", "project", "blog_post"]).eq("status", "published").eq("is_enabled", true).is("deleted_at", null).limit(1000),
           client.from("foundation_projects").select("slug,updated_at").eq("is_published", true).is("archived_at", null).limit(1000),
        ]);

        const dynamic = [
          ...(entries ?? []).map((row) => ({
            loc: row.content_type === "service" ? `/services/${row.slug}` : row.content_type === "project" ? `/projects/${row.slug}` : `/blog/${row.slug}`,
            lastmod: row.updated_at,
          })),
          ...(foundationProjects ?? []).map((row) => ({ loc: `/foundation/${row.slug}`, lastmod: row.updated_at })),
        ];

        // Private areas (/login, /register, /forgot-password, /reset-password, /dashboard, /admin,
        // member Umrah routes) are deliberately absent — only public pages are listed.
        const pages = [
          ...STATIC_PATHS.map((path) => ({ loc: path, lastmod: null as string | null })),
          ...services.map((item) => ({ loc: `/services/${item.slug}`, lastmod: null as string | null })),
          ...projects.map((item) => ({ loc: `/projects/${item.slug}`, lastmod: null as string | null })),
          ...articles.map((item) => ({ loc: `/blog/${item.slug}`, lastmod: null as string | null })),
          ...dynamic,
        ].filter((page, index, all) => all.findIndex((candidate) => candidate.loc === page.loc) === index);

        const localized = (path: string, code: string) => `${origin}${path}${code === "en" ? "" : `${path.includes("?") ? "&" : "?"}lang=${code}`}`;
        const escape = (value: string) => value.replaceAll("&", "&amp;");

        const urls = pages
          .flatMap((page) =>
            hreflangOrder.map((code) => {
              const alternates = [
                ...hreflangOrder.map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt}" href="${escape(localized(page.loc, alt))}" />`),
                `    <xhtml:link rel="alternate" hreflang="x-default" href="${escape(localized(page.loc, "en"))}" />`,
              ].join("\n");
              return `  <url>\n    <loc>${escape(localized(page.loc, code))}</loc>\n${page.lastmod ? `    <lastmod>${new Date(page.lastmod).toISOString()}</lastmod>\n` : ""}${alternates}\n  </url>`;
            }),
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
