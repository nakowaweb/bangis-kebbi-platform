import { createFileRoute } from "@tanstack/react-router";

import { ContactSection } from "@/components/platform-sections";
import { BusinessOpportunities, opportunityCategorySlugs } from "@/components/business-opportunities";
import { listPublicEntries } from "@/lib/content.functions";
import type { LanguageCode } from "@/lib/i18n/dictionary";
import { pageHead } from "@/lib/seo";
import { RouteError } from "@/components/route-error";

export const Route = createFileRoute("/business/")({
  validateSearch: (search: Record<string, unknown>) => ({ lang: typeof search["lang"] === "string" ? search["lang"] as LanguageCode : undefined }),
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "Business Opportunities — Bangis Kebbi",
      description: "Research and insights from Bangis Kebbi. Explore the details and decide whether an opportunity suits you.",
      path: "/business",
    }),
  errorComponent: RouteError,
  notFoundComponent: () => <p className="p-8">Not found.</p>,
  loaderDeps: ({ search }) => ({ lang: (search as { lang?: LanguageCode }).lang ?? "en" }),
  loader: async ({ deps }: { deps: { lang: LanguageCode } }) => {
    const rows = await listPublicEntries({ data: { contentType: "business", language: deps.lang } });
    return rows.filter((row) => row.category && opportunityCategorySlugs.includes(row.category));
  },
  component: BusinessPage,
});

function BusinessPage() {
  const items = Route.useLoaderData();
  return (
    <main>
      <BusinessOpportunities items={items} />
      <ContactSection />
    </main>
  );
}
