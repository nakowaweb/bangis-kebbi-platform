import { createFileRoute } from "@tanstack/react-router";

import { ContactSection, FoundationSection } from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/foundation")({
  head: () =>
    pageHead({
      title: "Bangis Kebbi Foundation — Community Support Initiatives",
      description:
        "Bangis Kebbi Foundation is prepared for approved community-support initiatives, contribution confirmations and transparent updates.",
      path: "/foundation",
    }),
  component: FoundationPage,
});

function FoundationPage() {
  return (
    <main>
      <FoundationSection />
      <ContactSection />
    </main>
  );
}
