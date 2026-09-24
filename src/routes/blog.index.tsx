import { SafeImage } from "@/components/safe-image";
import { Link, createFileRoute } from "@tanstack/react-router";
import type { LanguageCode } from "@/lib/i18n/dictionary";

import { BlogPreview, SectionShell } from "@/components/platform-sections";
import { listPublicEntries } from "@/lib/content.functions";
import { pageHead } from "@/lib/seo";
import { RouteError } from "@/components/route-error";
import { articles as fallbackArticles, text } from "@/lib/portfolio-content";
import { useLanguage } from "@/lib/language";

export const Route = createFileRoute("/blog/")({
  head: ({ match }: { match: { search: { lang?: LanguageCode } } }) => ({
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
  loaderDeps: (opts) => ({ lang: ((opts.search as { lang?: LanguageCode }).lang ?? "en") as LanguageCode }),
  loader: ({ deps }) => listPublicEntries({ data: { contentType: "blog_post", language: deps.lang } }),
  component: BlogPage,
});

function BlogPage() {
  const loadedPosts = Route.useLoaderData();
  const { language } = useLanguage();
  const posts = loadedPosts.length ? loadedPosts : fallbackArticles.map((post) => ({ id: post.slug, slug: post.slug, title: text(post.title, language), category: text(post.category, language), summary: text(post.summary, language), imageUrl: post.image, image_alt: text(post.title, language), author: post.author, published_at: null }));

  return (
    <main>
      {posts.length === 0 ? <BlogPreview /> : (
        <SectionShell eyebrow="Blog" title="Insights, ideas and opportunities." description="Published articles from BangisKebbi.com.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                {post.imageUrl && <SafeImage src={post.imageUrl} alt={post.image_alt ?? post.title} loading="lazy" className="aspect-[16/9] w-full object-cover" />}
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
