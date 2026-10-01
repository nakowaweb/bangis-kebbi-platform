import { SafeImage } from "@/components/safe-image";
import { Link, createFileRoute } from "@tanstack/react-router";
import type { LanguageCode } from "@/lib/i18n/dictionary";
import { ArrowRight } from "lucide-react";

import { BlogPreview, SectionShell } from "@/components/platform-sections";
import { getPublicContent, listPublicEntries } from "@/lib/content.functions";
import { pageHead } from "@/lib/seo";
import { RouteError } from "@/components/route-error";
import { articles as fallbackArticles, text } from "@/lib/portfolio-content";
import { useLanguage } from "@/lib/language";
import { EDITORIAL_AUTHOR } from "@/components/share-post";
import portraitAssetSrc from "@/assets/bangis-official-hero.webp";
import { Button } from "@/components/ui/button";

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
            { "@type": "ListItem", position: 2, name: "News and Update", item: "/blog" },
          ],
        }),
      },
    ],
  }),
  errorComponent: RouteError,
  loaderDeps: (opts) => ({ lang: ((opts.search as { lang?: LanguageCode }).lang ?? "en") as LanguageCode }),
  loader: async ({ deps }) => {
    const [posts, site] = await Promise.all([
      listPublicEntries({ data: { contentType: "blog_post", language: deps.lang } }),
      getPublicContent({ data: { language: deps.lang } }),
    ]);
    return { posts, authorImage: site.settings?.profileImageUrl ?? portraitAssetSrc };
  },
  component: BlogPage,
});

function BlogPage() {
  const { posts: loadedPosts, authorImage } = Route.useLoaderData();
  const { language } = useLanguage();
  const cmsSlugs = new Set(loadedPosts.map((item) => item.slug));
  const posts = [...loadedPosts, ...fallbackArticles.filter((item) => !cmsSlugs.has(item.slug)).map((post) => ({ id: post.slug, slug: post.slug, title: text(post.title, language), category: text(post.category, language), summary: text(post.summary, language), imageUrl: post.image, image_alt: text(post.title, language), author: post.author, published_at: post.publishedAt }))].sort((a, b) => (Date.parse(b.published_at ?? "") || 0) - (Date.parse(a.published_at ?? "") || 0));

  return (
    <main>
      {posts.length === 0 ? <BlogPreview /> : (
        <SectionShell eyebrow="News and Update" title="Insights, ideas and opportunities." description="Published articles from BangisKebbi.com.">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="group relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-platform">
                <Link to="/blog/$slug" params={{ slug: post.slug }} className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label={`Read ${post.title}`} />
                <div className="aspect-[626/409] overflow-hidden bg-secondary">
                  {post.imageUrl && <SafeImage src={post.imageUrl} alt={post.image_alt ?? post.title} loading="lazy" width={626} height={409} className="size-full object-cover transition duration-500 group-hover:scale-[1.02]" />}
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  {post.category && <p className="text-xs font-bold uppercase text-primary">{post.category}</p>}
                  <h2 className="mt-2 font-display text-xl font-bold leading-tight text-foreground">{post.title}</h2>
                  {post.summary && <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{post.summary}</p>}
                  <div className="mt-5 flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
                    {authorImage ? <SafeImage src={authorImage} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full border border-border object-cover object-top" /> : null}
                    <p className="min-w-0 leading-5"><span className="font-semibold text-foreground">{EDITORIAL_AUTHOR}</span>{post.published_at ? <><span aria-hidden> · </span><time dateTime={post.published_at}>{new Date(post.published_at).toLocaleDateString()}</time></> : null}</p>
                  </div>
                  <Button className="pointer-events-none mt-5 w-full sm:w-fit sm:min-w-52" tabIndex={-1}>Read Article <ArrowRight /></Button>
                </div>
              </article>
            ))}
          </div>
        </SectionShell>
      )}
    </main>
  );
}
