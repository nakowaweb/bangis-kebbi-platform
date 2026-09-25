import { createFileRoute } from "@tanstack/react-router";

import { AboutPreview, CommunitySection, PillarsSection } from "@/components/platform-sections";
import { listPublicEntries } from "@/lib/content.functions";
import type { LanguageCode } from "@/lib/i18n/dictionary";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "About Bangis Kebbi — Abubakar Alhaji Abubakar",
      description:
        "Learn about Abubakar Alhaji Abubakar, Bangis Kebbi Nakowa, an AI-assisted web designer, web developer, digital entrepreneur and community builder.",
      path: "/about",
    }),
  loaderDeps: (opts): { lang: LanguageCode } => ({ lang: ((opts.search as { lang?: LanguageCode }).lang ?? "en") as LanguageCode }),
  loader: async ({ deps }: { deps: { lang: LanguageCode } }) => listPublicEntries({ data: { contentType: "about", language: deps.lang } }),
  component: AboutPage,
});

function AboutPage() {
  const items = Route.useLoaderData() ?? [];
  const summary = items.find((item) => item.slug === "summary");
  return (
    <main>
      <AboutPreview title={summary?.title} description={summary?.summary ?? undefined} items={items} />
      <PillarsSection />
      <CommunitySection />
    </main>
  );
}
