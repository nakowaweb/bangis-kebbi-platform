import { createFileRoute } from "@tanstack/react-router";
import type { LanguageCode } from "@/lib/i18n/dictionary";

import {
  CommunitySection,
  ContactSection,
  FoundationSection,
  HeroSection,
  LatestActivitiesSection,
  PlatformIntroduction,
  QuickActionsSection,
  ServicesSection,
  UmrahSection,
} from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";
import { RouteError } from "@/components/route-error";
import { CompanyCredentials } from "@/components/company-credentials";
import { getPublicContent } from "@/lib/content.functions";
import heroImageSrc from "@/assets/hero-digital-solutions.jpg";
const heroImage = { url: heroImageSrc };

export const Route = createFileRoute("/")({
  head: ({ match }: { match: { search: { lang?: LanguageCode } } }) => {
    const base = pageHead({ search: match.search,
      title: "Bangis Kebbi — AI Web Designer, Developer & Digital Entrepreneur",
      description:
        "BangisKebbi.com is a global platform by Abubakar Alhaji Abubakar for AI-assisted web design, web development, business networking, community support, Umrah coordination and digital opportunities.",
      path: "/",
    });
    return {
      ...base,
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Abubakar Alhaji Abubakar",
          alternateName: "Bangis Kebbi Nakowa",
          url: "https://bangiskebbi.com",
          jobTitle: "AI-Assisted Web Designer and Web Developer",
          brand: "Bangis Kebbi",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "BangisKebbi.com",
          url: "https://bangiskebbi.com",
          description: "More than a website — a global platform.",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://bangiskebbi.com/?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
      links: [...base.links, { rel: "preload", as: "image", href: heroImage.url, fetchPriority: "high" }],
    };
  },
  errorComponent: RouteError,
  loaderDeps: (opts) => ({ lang: ((opts.search as { lang?: LanguageCode }).lang ?? "en") as LanguageCode }),
  loader: ({ deps }) => getPublicContent({ data: { language: deps.lang } }),
  component: Index,
});

function Index() {
  const publicContent = Route.useLoaderData();
  const hero = publicContent.entries.find((entry) => entry.content_type === "homepage" && entry.slug === "hero");
  const about = publicContent.entries.find((entry) => entry.content_type === "about" && entry.slug === "summary");
  const section = (type: string) => publicContent.entries.find((entry) => entry.content_type === type);
  const services = publicContent.entries.filter((entry) => entry.content_type === "service");
  const payload = hero?.payload && typeof hero.payload === "object" && !Array.isArray(hero.payload) ? hero.payload : {};
  const value = (key: string) => typeof payload[key] === "string" ? payload[key] : undefined;
  const heroSlides = publicContent.entries
    .filter((entry) => entry.content_type === "homepage" && /^hero-feature-[1-4]$/.test(entry.slug))
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 4)
    .map((entry) => ({ src: entry.imageUrl, alt: entry.image_alt ?? entry.title, label: entry.title }))
    .filter((entry): entry is { src: string; alt: string; label: string } => Boolean(entry.src));
  return (
    <main>
      <HeroSection content={{ eyebrow: value("eyebrow"), title: hero?.title, subtitle: value("subtitle"), description: hero?.summary ?? value("description"), primaryCta: value("primaryCta"), secondaryCta: value("secondaryCta") }} slides={heroSlides} location={publicContent.settings?.location ?? "Kebbi State, Nigeria"} globalStatus={publicContent.settings?.global_status ?? "Working globally"} />
      <QuickActionsSection />
      <PlatformIntroduction title={about?.title} description={about?.summary ?? undefined} />
      <ServicesSection items={services} />
      <CommunitySection title={section("community")?.title} description={section("community")?.summary ?? undefined} />
      <UmrahSection title={section("umrah")?.title} description={section("umrah")?.summary ?? undefined} image={heroSlides[2]?.src} imageAlt={heroSlides[2]?.alt} />
      <FoundationSection title={section("foundation")?.title} description={section("foundation")?.summary ?? undefined} image={section("foundation")?.imageUrl} imageAlt={section("foundation")?.image_alt} />
      <LatestActivitiesSection />
      <CompanyCredentials />
      <ContactSection />
    </main>
  );
}
