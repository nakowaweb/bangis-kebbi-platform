import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { ExternalCta, opportunityCategories, opportunityCategorySlugs, opportunityCopy, pick } from "@/components/business-opportunities";
import { SafeImage } from "@/components/safe-image";
import { RouteError } from "@/components/route-error";
import { getPublicEntry } from "@/lib/content.functions";
import type { LanguageCode } from "@/lib/i18n/dictionary";
import { useLanguage } from "@/lib/language";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/business/$slug")({
  loaderDeps: ({ search }) => ({ lang: (search as { lang?: LanguageCode }).lang ?? "en" }),
  loader: async ({ params, deps }) => {
    const entry = await getPublicEntry({ data: { contentType: "business", language: deps.lang, slug: params.slug } });
    if (!entry || !entry.category || !opportunityCategorySlugs.includes(entry.category)) throw notFound();
    return entry;
  },
  head: ({ loaderData, match, params }) =>
    pageHead({ search: match.search,
      title: `${loaderData?.seo_title || loaderData?.title || "Business opportunity"} — Bangis Kebbi`,
      description: loaderData?.seo_description || loaderData?.summary || "Research and insights from Bangis Kebbi.",
      path: `/business/${params.slug}`,
    }),
  errorComponent: RouteError,
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-muted-foreground">This opportunity is not available.</p>
      <Link to="/business" className="mt-4 inline-block font-bold text-primary">Business Opportunities</Link>
    </main>
  ),
  component: OpportunityPage,
});

function safeUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function OpportunityPage() {
  const entry = Route.useLoaderData();
  const { language } = useLanguage();
  const cat = opportunityCategories.find((c) => c.slug === entry.category);
  const payload = (entry.payload && typeof entry.payload === "object" && !Array.isArray(entry.payload) ? entry.payload : {}) as Record<string, unknown>;
  const ctaLabel = typeof payload["ctaLabel"] === "string" && payload["ctaLabel"].trim() ? (payload["ctaLabel"] as string) : pick(opportunityCopy.register, language);
  const url = safeUrl(entry.project_url);
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/business" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary"><ArrowLeft className="size-4 rtl:rotate-180" />{pick(opportunityCopy.back, language)}</Link>
      <article className="mt-6">
        {cat ? <p className="text-xs font-bold uppercase text-primary">{pick(cat.label, language)}</p> : null}
        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">{entry.title}</h1>
        {entry.summary ? <p className="mt-3 text-lg leading-8 text-muted-foreground">{entry.summary}</p> : null}
        {entry.imageUrl ? <SafeImage src={entry.imageUrl} alt={entry.image_alt ?? entry.title} width={1200} height={675} className="mt-6 w-full rounded-xl border border-border object-cover" /> : null}
        {entry.body ? (
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold">{pick(opportunityCopy.review, language)}</h2>
            <div className="mt-3 whitespace-pre-line text-base leading-7">{entry.body}</div>
          </section>
        ) : null}
        {url ? <div className="mt-8 rounded-xl border border-border bg-secondary/40 p-5"><ExternalCta url={url} label={ctaLabel} /></div> : null}
      </article>
    </main>
  );
}
