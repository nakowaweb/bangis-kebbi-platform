import { createFileRoute } from "@tanstack/react-router";

import { ContactSection } from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "Contact Bangis Kebbi — Hire Me or Start a Conversation",
      description:
        "Contact Abubakar Alhaji Abubakar for AI-assisted web design, web development, UI/UX, digital business support and community platform work.",
      path: "/contact",
    }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <main>
      <ContactSection />
    </main>
  );
}
