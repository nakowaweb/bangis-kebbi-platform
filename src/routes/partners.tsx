import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Globe, Handshake, Info, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { LanguageCode } from "@/lib/i18n/dictionary";
import { getPublicUmrahInfo } from "@/lib/umrah.functions";
import { pageHead } from "@/lib/seo";
import { SafeImage } from "@/components/safe-image";
import { FadeCarousel, intervalFrom, partnerSlideFallbacks, resolveSlides, type LandingEntry } from "@/components/umrah/umrah-landing";

export const Route = createFileRoute("/partners")({
  head: ({ match }: { match: { search: { lang?: LanguageCode } } }) =>
    pageHead({ search: match.search, title: "Travel Partners — Bangis Kebbi Umrah", description: "Verified travel partners listed by Bangis Kebbi for Umrah packages and related travel services.", path: "/partners" }),
  loaderDeps: (opts) => ({ lang: ((opts.search as { lang?: LanguageCode }).lang ?? "en") as LanguageCode }),
  loader: ({ deps }) => getPublicUmrahInfo({ data: { language: deps.lang } }),
  errorComponent: () => <main className="mx-auto max-w-2xl px-4 py-20 text-center"><h1 className="font-display text-2xl font-bold">Partners are unavailable right now</h1></main>,
  notFoundComponent: () => <main className="mx-auto max-w-2xl px-4 py-20 text-center"><h1 className="font-display text-2xl font-bold">Page not found</h1></main>,
  component: PartnersPage,
});

function PartnersPage() {
  const { entries, partners } = Route.useLoaderData();
  const rows = entries as LandingEntry[];
  const slides = resolveSlides(rows, partnerSlideFallbacks);
  return (
    <main>
      <section className="relative isolate overflow-hidden bg-brand-ink text-primary-foreground">
        <FadeCarousel slides={slides} interval={intervalFrom(rows, "partners-slide-settings")} />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-ink via-brand-ink/75 to-brand-ink/20" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <Link to="/umrah" className="inline-flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground"><ArrowLeft className="size-4" />Back to Umrah</Link>
          <h1 className="mt-4 flex items-center gap-3 font-display text-4xl font-bold sm:text-5xl"><Handshake className="size-10 text-brand-gold" />Our Travel Partners</h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/90">Independent providers of Umrah packages and related travel services. Only partners we have verified are shown here.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {partners.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((p) => {
              const location = [p.city, p.state_region, p.country].filter(Boolean).join(", ");
              return (
                <article key={p.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex h-40 items-center justify-center bg-secondary/40 p-4">{p.logoUrl ? <SafeImage src={p.logoUrl} alt={`${p.name} logo`} loading="lazy" className="max-h-full max-w-full object-contain" /> : <Handshake className="size-12 text-muted-foreground" />}</div>
                  <div className="grid gap-2 p-5">
                    <h2 className="font-display text-lg font-bold">{p.name}</h2>
                    {location ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4" />{location}</p> : null}
                    {p.services ? <p className="text-sm text-muted-foreground">{p.services}</p> : null}
                    {p.phone ? <a href={`tel:${p.phone.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-2 text-sm"><Phone className="size-4" />{p.phone}</a> : null}
                    {p.whatsapp ? <a href={`https://wa.me/${p.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm"><MessageCircle className="size-4" />WhatsApp</a> : null}
                    {p.email ? <a href={`mailto:${p.email}`} className="inline-flex items-center gap-2 text-sm"><Mail className="size-4" />{p.email}</a> : null}
                    {p.website_url ? <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline"><Globe className="size-4" />Visit website</a> : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-6 text-sm text-muted-foreground"><Info className="size-5 text-primary" />Partner details pending verification. Verified partners will appear here once approved.</p>
        )}
        <p className="mt-8 text-xs leading-6 text-muted-foreground">Partners are independent companies. BangisKebbi.com does not guarantee visas, travel or any outcome. Please confirm all terms directly with the provider.</p>
      </section>
    </main>
  );
}
