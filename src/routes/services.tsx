import { Link, createFileRoute } from "@tanstack/react-router";

import { BusinessSection, ContactSection, SectionShell, ServicesSection } from "@/components/platform-sections";
import { listPublicEntries } from "@/lib/content.functions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/services")({
  head: () => ({
    ...pageHead({
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
  loader: () => listPublicEntries({ data: { contentType: "service" } }),
  component: ServicesPage,
});

function ServicesPage() {
  const services = Route.useLoaderData();
  return (
    <main>
      <ServicesSection full items={services} />
      {services.length > 0 && (
        <SectionShell eyebrow="Service details" title="Read more about each service." description="Open a service for the full description.">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li key={service.id} className="rounded-lg border border-border bg-card p-5">
                {service.category && <p className="text-xs font-bold uppercase text-primary">{service.category}</p>}
                <h3 className="mt-1 font-display text-base font-bold">
                  <Link to="/services/$slug" params={{ slug: service.slug }} className="hover:underline">{service.title}</Link>
                </h3>
                {service.summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.summary}</p>}
              </li>
            ))}
          </ul>
        </SectionShell>
      )}
      <BusinessSection />
      <ContactSection />
    </main>
  );
}
