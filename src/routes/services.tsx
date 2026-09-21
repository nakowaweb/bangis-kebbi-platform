import { createFileRoute } from "@tanstack/react-router";

import { BusinessSection, ContactSection, ServicesSection } from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/services")({
  head: () =>
    pageHead({
      title: "Services — AI Web Design, Web Development & UI/UX",
      description:
        "Explore Bangis Kebbi services including AI web design, web development, UI/UX design, WordPress, digital business solutions and website maintenance.",
      path: "/services",
    }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <main>
      <ServicesSection full />
      <BusinessSection />
      <ContactSection />
    </main>
  );
}
