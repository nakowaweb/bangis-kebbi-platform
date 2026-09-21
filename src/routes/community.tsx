import { createFileRoute } from "@tanstack/react-router";

import { CommunitySection, DashboardPreviewSection } from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/community")({
  head: () =>
    pageHead({
      title: "Bangis Kebbi Community — Learn, Connect, Build and Grow",
      description:
        "Join the Bangis Kebbi community for learning, technology, entrepreneurship, support and legitimate digital opportunities.",
      path: "/community",
    }),
  component: CommunityPage,
});

function CommunityPage() {
  return (
    <main>
      <CommunitySection />
      <DashboardPreviewSection />
    </main>
  );
}
