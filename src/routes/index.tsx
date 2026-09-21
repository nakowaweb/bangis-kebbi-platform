import { createFileRoute } from "@tanstack/react-router";

import {
  AboutPreview,
  BlogPreview,
  BusinessSection,
  CommunitySection,
  ContactSection,
  FoundationSection,
  HeroSection,
  PillarsSection,
  ProjectsSection,
  ServicesSection,
  UmrahSection,
} from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";
import { getPublicContent } from "@/lib/content.functions";
import heroImage from "@/assets/global-city-hero.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    ...pageHead({
      title: "Bangis Kebbi — AI Web Designer, Developer & Digital Entrepreneur",
      description:
        "BangisKebbi.com is a global platform by Abubakar Alhaji Abubakar for AI-assisted web design, web development, business networking, community support, Umrah coordination and digital opportunities.",
      path: "/",
    }),
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
        }),
      },
    ],
    links: [{ rel: "preload", as: "image", href: heroImage, fetchPriority: "high" }],
  }),
  loader: () => getPublicContent(),
  component: Index,
});

function Index() {
  const publicContent = Route.useLoaderData();
  const hero = publicContent.entries.find((entry) => entry.content_type === "homepage" && entry.slug === "hero");
  const about = publicContent.entries.find((entry) => entry.content_type === "about" && entry.slug === "summary");
  const section = (type: string) => publicContent.entries.find((entry) => entry.content_type === type);
  const services = publicContent.entries.filter((entry) => entry.content_type === "service");
  const projects = publicContent.entries.filter((entry) => entry.content_type === "project");
  const posts = publicContent.entries.filter((entry) => entry.content_type === "blog_post");
  const payload = hero?.payload && typeof hero.payload === "object" && !Array.isArray(hero.payload) ? hero.payload : {};
  const value = (key: string) => typeof payload[key] === "string" ? payload[key] : undefined;
  return (
    <main>
      <HeroSection content={{ eyebrow: value("eyebrow"), title: hero?.title, subtitle: value("subtitle"), description: hero?.summary ?? value("description"), primaryCta: value("primaryCta"), secondaryCta: value("secondaryCta") }} location={publicContent.settings?.location ?? "Abuja, Nigeria"} globalStatus={publicContent.settings?.global_status ?? "Working globally"} />
      <PillarsSection />
      <AboutPreview title={about?.title} description={about?.summary ?? undefined} />
      <ServicesSection items={services} />
      <ProjectsSection items={projects} />
      <BusinessSection title={section("business")?.title} description={section("business")?.summary ?? undefined} />
      <UmrahSection title={section("umrah")?.title} description={section("umrah")?.summary ?? undefined} />
      <FoundationSection title={section("foundation")?.title} description={section("foundation")?.summary ?? undefined} />
      <CommunitySection title={section("community")?.title} description={section("community")?.summary ?? undefined} />
      <BlogPreview items={posts} />
      <ContactSection />
    </main>
  );
}
