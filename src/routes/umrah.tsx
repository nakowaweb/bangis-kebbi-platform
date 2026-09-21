import { createFileRoute } from "@tanstack/react-router";

import { ContactSection, UmrahSection } from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/umrah")({
  head: () =>
    pageHead({
      title: "Umrah Support Program — Bangis Kebbi",
      description:
        "Bangis Kebbi Umrah Support Program explains an organized future member application, document and status tracking process.",
      path: "/umrah",
    }),
  component: UmrahPage,
});

function UmrahPage() {
  return (
    <main>
      <UmrahSection />
      <ContactSection />
    </main>
  );
}
