import { createFileRoute } from "@tanstack/react-router";

import { createPublicSupabase } from "@/lib/public-content.server";

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
          client.from("content_entries").select("content_type,slug,updated_at").in("content_type", ["service", "project", "blog_post"]).limit(1000),
          client.from("foundation_projects").select("slug,updated_at").limit(1000),
        ]);

        const dynamic = [
          ...(entries ?? []).map((row) => ({
            loc: row.content_type === "service" ? `/services/${row.slug}` : row.content_type === "project" ? `/projects/${row.slug}` : `/blog/${row.slug}`,
            lastmod: row.updated_at,
          })),
          ...(foundationProjects ?? []).map((row) => ({ loc: `/foundation/${row.slug}`, lastmod: row.updated_at })),
        ];

        const urls = [
          ...STATIC_PATHS.map((path) => `  <url><loc>${origin}${path}</loc></url>`),
          ...dynamic.map((item) => `  <url><loc>${origin}${item.loc}</loc>${item.lastmod ? `<lastmod>${new Date(item.lastmod).toISOString()}</lastmod>` : ""}</url>`),
        ].join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
