import { createFileRoute } from "@tanstack/react-router";

import { BusinessSection, CommunitySection, ContactSection } from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/business")({
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "Business & Opportunities — Bangis Kebbi",
      description:
        "Bangis Kebbi connects people, ideas, technology and legitimate business opportunities without investment promises or financial return claims.",
      path: "/business",
    }),
  component: BusinessPage,
});

function BusinessPage() {
  return (
    <main>
      <BusinessSection />
      <CommunitySection />
      <ContactSection />
    </main>
  );
}
