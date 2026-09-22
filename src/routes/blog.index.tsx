import { Link, createFileRoute } from "@tanstack/react-router";

import { BlogPreview, SectionShell } from "@/components/platform-sections";
import { listPublicEntries } from "@/lib/content.functions";
import { pageHead } from "@/lib/seo";
import { RouteError } from "@/components/route-error";

export const Route = createFileRoute("/blog/")({
  head: ({ match }) => ({
    ...pageHead({ search: match.search,
      title: "Blog & Updates — Technology, AI, Business and Community",
      description:
        "Read Bangis Kebbi updates on technology, AI, web design, business, entrepreneurship, community, Umrah and Foundation news.",
      path: "/blog",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "/" },
            { "@type": "ListItem", position: 2, name: "Blog", item: "/blog" },
          ],
        }),
      },
    ],
  }),
  errorComponent: RouteError,
  loaderDeps: ({ search }) => ({ lang: search.lang ?? "en" }),
  loader: ({ deps }) => listPublicEntries({ data: { contentType: "blog_post", language: deps.lang } }),
  component: BlogPage,
});

function BlogPage() {
  const posts = Route.useLoaderData();

  return (
    <main>
      {posts.length === 0 ? (
        <BlogPreview />
      ) : (
        <SectionShell eyebrow="Blog" title="Insights, ideas and opportunities." description="Published articles from BangisKebbi.com.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                {post.imageUrl && <img src={post.imageUrl} alt={post.image_alt ?? post.title} loading="lazy" className="aspect-[16/9] w-full object-cover" />}
                <div className="p-5">
                  {post.category && <p className="text-xs font-bold uppercase text-primary">{post.category}</p>}
                  <h2 className="mt-1 font-display text-lg font-bold leading-tight">
                    <Link to="/blog/$slug" params={{ slug: post.slug }} className="hover:underline">{post.title}</Link>
                  </h2>
                  {post.summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.summary}</p>}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {post.author ? `${post.author} · ` : ""}
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
                  </p>
                  <Link to="/blog/$slug" params={{ slug: post.slug }} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">Read article</Link>
                </div>
              </article>
            ))}
          </div>
        </SectionShell>
      )}
    </main>
  );
}
