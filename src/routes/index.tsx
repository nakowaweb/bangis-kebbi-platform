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
import heroImage from "@/assets/muscat-hero.jpg";

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
  component: Index,
});

function Index() {
  return (
    <main>
      <HeroSection />
      <PillarsSection />
      <AboutPreview />
      <ServicesSection />
      <ProjectsSection />
      <BusinessSection />
      <UmrahSection />
      <FoundationSection />
      <CommunitySection />
      <BlogPreview />
      <ContactSection />
    </main>
  );
}
