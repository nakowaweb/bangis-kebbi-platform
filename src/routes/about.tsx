import { createFileRoute } from "@tanstack/react-router";

import { AboutPreview, CommunitySection, PillarsSection } from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "About Bangis Kebbi — Abubakar Alhaji Abubakar",
      description:
        "Learn about Abubakar Alhaji Abubakar, Bangis Kebbi Nakowa, an AI-assisted web designer, web developer, digital entrepreneur and community builder.",
      path: "/about",
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main>
      <AboutPreview />
      <PillarsSection />
      <CommunitySection />
    </main>
  );
}
