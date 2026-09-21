import { createFileRoute } from "@tanstack/react-router";

import { BlogPreview } from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/blog")({
  head: () =>
    pageHead({
      title: "Blog & Updates — Technology, AI, Business and Community",
      description:
        "Read Bangis Kebbi updates on technology, AI, web design, business, entrepreneurship, community, Umrah and Foundation news.",
      path: "/blog",
      type: "article",
    }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <main>
      <BlogPreview />
    </main>
  );
}
