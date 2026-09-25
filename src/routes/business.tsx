import { createFileRoute } from "@tanstack/react-router";

import { BusinessSection, CommunitySection, ContactSection } from "@/components/platform-sections";
import { listPublicEntries } from "@/lib/content.functions";
import type { LanguageCode } from "@/lib/i18n/dictionary";
import { pageHead } from "@/lib/seo";
import { RouteError } from "@/components/route-error";

export const Route = createFileRoute("/business")({
  validateSearch: (search: Record<string, unknown>) => ({ lang: typeof search["lang"] === "string" ? search["lang"] as LanguageCode : undefined }),
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "Business & Opportunities — Bangis Kebbi",
      description:
        "Bangis Kebbi connects people, ideas, technology, professional services and legitimate business opportunities.",
      path: "/business",
    }),
  errorComponent: RouteError,
  loaderDeps: ({ search }) => {
    const languageSearch = search as unknown as { lang?: LanguageCode };
    return { lang: languageSearch.lang ?? "en" };
  },
  loader: ({ deps }) => listPublicEntries({ data: { contentType: "business", language: deps.lang } }),
  component: BusinessPage,
});

function BusinessPage() {
  const businessItems = Route.useLoaderData();
  return (
    <main>
      <BusinessSection items={businessItems} />
      <CommunitySection />
      <ContactSection />
    </main>
  );
}
