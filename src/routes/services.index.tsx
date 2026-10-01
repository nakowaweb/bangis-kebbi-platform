import { createFileRoute } from "@tanstack/react-router";
import type { LanguageCode } from "@/lib/i18n/dictionary";

import { ContactSection, ServicesSection } from "@/components/platform-sections";
import { listPublicEntries } from "@/lib/content.functions";
import { pageHead } from "@/lib/seo";
import { RouteError } from "@/components/route-error";
import { services as fallbackServices, text } from "@/lib/portfolio-content";
import { useLanguage } from "@/lib/language";

export const Route = createFileRoute("/services/")({
  head: ({ match }: { match: { search: { lang?: LanguageCode } } }) => ({
    ...pageHead({ search: match.search,
      title: "Services — AI Web Design, Web Development & UI/UX",
      description:
        "Explore Bangis Kebbi services including AI web design, web development, UI/UX design, WordPress, digital business solutions and website maintenance.",
      path: "/services",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "/" },
            { "@type": "ListItem", position: 2, name: "Services", item: "/services" },
          ],
        }),
      },
    ],
  }),
  errorComponent: RouteError,
  loaderDeps: (opts) => ({ lang: ((opts.search as { lang?: LanguageCode }).lang ?? "en") as LanguageCode }),
  loader: async ({ deps }) => {
    const services = await listPublicEntries({ data: { contentType: "service", language: deps.lang } });
    return { services };
  },
  component: ServicesPage,
});

function ServicesPage() {
  const { services: loadedServices } = Route.useLoaderData();
  const { language } = useLanguage();
  const cmsSlugs = new Set(loadedServices.map((item) => item.slug));
  const services = [...loadedServices, ...fallbackServices.filter((item) => !cmsSlugs.has(item.slug)).map((service) => ({ id: service.slug, slug: service.slug, title: text(service.title, language), summary: text(service.summary, language), category: null, imageUrl: service.image }))];
  return (
    <main>
      <ServicesSection full items={services} />
      <ContactSection />
    </main>
  );
}
