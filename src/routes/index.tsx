import { createFileRoute } from "@tanstack/react-router";

import {
  AboutPreview,
  BlogPreview,
  BusinessSection,
  CommunitySection,
  ContactSection,
  DashboardPreviewSection,
  FoundationSection,
  HeroSection,
  PillarsSection,
  ProjectsSection,
  ServicesSection,
  TestimonialsPlaceholder,
  UmrahSection,
} from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";

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
      <CommunitySection />
      <UmrahSection />
      <FoundationSection />
      <DashboardPreviewSection />
      <BlogPreview />
      <TestimonialsPlaceholder />
      <ContactSection />
    </main>
  );
}
