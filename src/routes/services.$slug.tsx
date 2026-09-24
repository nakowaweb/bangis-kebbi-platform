import { EntryVideo } from "@/components/entry-video";
import { SafeImage } from "@/components/safe-image";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import type { LanguageCode } from "@/lib/i18n/dictionary";

import { SectionShell } from "@/components/platform-sections";
import { getPublicEntry } from "@/lib/content.functions";
import { pageHead } from "@/lib/seo";
import { RouteError } from "@/components/route-error";
import { ContactActions } from "@/components/contact-actions";
import { serviceBySlug, text } from "@/lib/portfolio-content";
import { useLanguage } from "@/lib/language";

export const Route = createFileRoute("/services/$slug")({
  errorComponent: RouteError,
  loaderDeps: (opts) => ({ lang: ((opts.search as { lang?: LanguageCode }).lang ?? "en") as LanguageCode }),
  loader: async ({ params, deps }) => {
    const service = await getPublicEntry({ data: { contentType: "service", slug: params.slug, language: deps.lang } });
    const fallback = serviceBySlug(params.slug);
    if (!service && !fallback) throw notFound();
    return { service, fallback };
  },
  head: ({ params, loaderData, match }) => {
    if (!loaderData) {
      return { meta: [{ title: "Service not found — BangisKebbi.com" }, { name: "robots", content: "noindex" }] };
    }
    const language = match.search.lang ?? "en";
    const title = loaderData.service?.title ?? (loaderData.fallback ? text(loaderData.fallback.title, language) : "Service");
    const description = loaderData.service?.seo_description || loaderData.service?.summary || (loaderData.fallback ? text(loaderData.fallback.summary, language) : `A professional service from Bangis Kebbi: ${title}`);
    return {
      ...pageHead({ search: match.search,
        title: loaderData.service?.seo_title || `${title} — Bangis Kebbi Services`,
        description,
        path: `/services/${params.slug}`,
        canonical: loaderData.service?.canonical_url,
        ogTitle: loaderData.service?.og_title,
        ogDescription: loaderData.service?.og_description,
        image: loaderData.service?.ogImageUrl,
      }),
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: title,
            description,
            serviceType: loaderData.service?.category ?? undefined,
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
              { "@type": "ListItem", position: 3, name: title, item: `/services/${params.slug}` },
            ],
          }),
        },
      ],
    };
  },
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const { service, fallback } = Route.useLoaderData();
  const { language } = useLanguage();
  const title = service?.title ?? (fallback ? text(fallback.title, language) : "Service");
  const summary = service?.summary ?? (fallback ? text(fallback.summary, language) : undefined);
  const labels = language === "ar" ? { capabilities: "ما يمكنني تقديمه", audience: "لمن تناسب هذه الخدمة", process: "طريقة العمل", discuss: "ناقش هذه الخدمة", home: "الرئيسية", services: "الخدمات" } : language === "ha" ? { capabilities: "Abin da zan iya yi", audience: "Wa wannan sabis ya dace da shi", process: "Yadda aikin ke gudana", discuss: "Tattauna wannan sabis", home: "Gida", services: "Ayyuka" } : { capabilities: "What I can deliver", audience: "Who this is for", process: "How the work runs", discuss: "Discuss this service", home: "Home", services: "Services" };
  return (
    <main>
      <SectionShell eyebrow={service?.category ?? labels.services} title={title} description={summary ?? undefined}>
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">{labels.home}</Link> <span aria-hidden>/</span>{" "}
          <Link to="/services" className="hover:underline">{labels.services}</Link>
        </nav>
        {(service?.imageUrl || fallback?.image) && <SafeImage src={service?.imageUrl ?? fallback?.image ?? ""} alt={service?.image_alt ?? (fallback ? text(fallback.imageAlt, language) : title)} className="mb-8 aspect-[16/7] w-full rounded-lg border border-border object-cover" />}
        <div className="grid max-w-3xl gap-4 text-sm leading-7 text-muted-foreground">
          {(service?.body ?? "").split(/\n{2,}/).filter(Boolean).map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}
        </div>
        {fallback && <div className="mt-10 grid gap-8 lg:grid-cols-3"><ListBlock title={labels.capabilities} items={fallback.canDo[language]} /><ListBlock title={labels.audience} items={fallback.audience[language]} /><ListBlock title={labels.process} items={fallback.process[language]} numbered /></div>}
        {service ? <EntryVideo payload={service.payload} fileUrl={service.videoFileUrl} title={title} /> : null}
        <ContactActions />
      </SectionShell>
    </main>
  );
}

function ListBlock({ title, items, numbered = false }: { title: string; items: string[]; numbered?: boolean }) {
  return <section><h2 className="font-display text-xl font-bold">{title}</h2><ol className="mt-4 grid gap-3">{items.map((item, index) => <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground"><span className="font-bold text-primary">{numbered ? `${index + 1}.` : "—"}</span>{item}</li>)}</ol></section>;
}
