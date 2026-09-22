import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { SectionShell } from "@/components/platform-sections";
import { getPublicEntry } from "@/lib/content.functions";
import { pageHead } from "@/lib/seo";
import { RouteError } from "@/components/route-error";

export const Route = createFileRoute("/services/$slug")({
  errorComponent: RouteError,
  loaderDeps: ({ search }) => ({ lang: search.lang ?? "en" }),
  loader: async ({ params, deps }) => {
    const service = await getPublicEntry({ data: { contentType: "service", slug: params.slug, language: deps.lang } });
    if (!service) throw notFound();
    return service;
  },
  head: ({ params, loaderData, match }) => {
    if (!loaderData) {
      return { meta: [{ title: "Service not found — BangisKebbi.com" }, { name: "robots", content: "noindex" }] };
    }
    const description = loaderData.seo_description || loaderData.summary || `A professional service from Bangis Kebbi: ${loaderData.title}`;
    return {
      ...pageHead({ search: match.search,
        title: loaderData.seo_title || `${loaderData.title} — Bangis Kebbi Services`,
        description,
        path: `/services/${params.slug}`,
        canonical: loaderData.canonical_url,
        ogTitle: loaderData.og_title,
        ogDescription: loaderData.og_description,
        image: loaderData.ogImageUrl,
      }),
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: loaderData.title,
            description,
            serviceType: loaderData.category ?? undefined,
            provider: { "@type": "Person", name: "Abubakar Alhaji Abubakar" },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Services", item: "/services" },
              { "@type": "ListItem", position: 3, name: loaderData.title, item: `/services/${params.slug}` },
            ],
          }),
        },
      ],
    };
  },
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const service = Route.useLoaderData();
  return (
    <main>
      <SectionShell eyebrow={service.category ?? "Service"} title={service.title} description={service.summary ?? undefined}>
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">Home</Link> <span aria-hidden>/</span>{" "}
          <Link to="/services" className="hover:underline">Services</Link>
        </nav>
        {service.imageUrl && <img src={service.imageUrl} alt={service.image_alt ?? service.title} className="mb-6 w-full rounded-xl border border-border object-cover" />}
        <div className="grid max-w-3xl gap-4 text-sm leading-7 text-muted-foreground">
          {(service.body ?? "").split(/\n{2,}/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
        <Link to="/contact" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">Discuss this service</Link>
      </SectionShell>
    </main>
  );
}
