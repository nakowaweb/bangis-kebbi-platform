import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import type { LanguageCode } from "@/lib/i18n/dictionary";

import { SectionShell } from "@/components/platform-sections";
import { getPublicEntry } from "@/lib/content.functions";
import { pageHead } from "@/lib/seo";
import { RouteError } from "@/components/route-error";

export const Route = createFileRoute("/blog/$slug")({
  errorComponent: RouteError,
  loaderDeps: (opts) => ({ lang: ((opts.search as { lang?: LanguageCode }).lang ?? "en") as LanguageCode }),
  loader: async ({ params, deps }) => {
    const post = await getPublicEntry({ data: { contentType: "blog_post", slug: params.slug, language: deps.lang } });
    if (!post) throw notFound();
    return post;
  },
  head: ({ params, loaderData, match }: { params: { slug: string }; loaderData?: Awaited<ReturnType<typeof getPublicEntry>> | undefined; match: { search: { lang?: LanguageCode } } }) => {
    if (!loaderData) {
      return { meta: [{ title: "Article not found — BangisKebbi.com" }, { name: "robots", content: "noindex" }] };
    }
    const description = loaderData.seo_description || loaderData.summary || `An article from BangisKebbi.com: ${loaderData.title}`;
    return {
      ...pageHead({ search: match.search,
        title: loaderData.seo_title || `${loaderData.title} — BangisKebbi.com`,
        description,
        path: `/blog/${params.slug}`,
        type: "article",
        canonical: loaderData.canonical_url,
        ogTitle: loaderData.og_title,
        ogDescription: loaderData.og_description,
        image: loaderData.ogImageUrl,
      }),
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: loaderData.title,
            description,
            datePublished: loaderData.published_at ?? undefined,
            dateModified: loaderData.updated_at ?? undefined,
            author: loaderData.author ? { "@type": "Person", name: loaderData.author } : undefined,
            image: loaderData.ogImageUrl ?? undefined,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Blog", item: "/blog" },
              { "@type": "ListItem", position: 3, name: loaderData.title, item: `/blog/${params.slug}` },
            ],
          }),
        },
      ],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const post = Route.useLoaderData();
  return (
    <main>
      <SectionShell eyebrow={post.category ?? "Article"} title={post.title} description={post.summary ?? undefined}>
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">Home</Link> <span aria-hidden>/</span>{" "}
          <Link to="/blog" className="hover:underline">Blog</Link>
        </nav>
        {post.imageUrl && <img src={post.imageUrl} alt={post.image_alt ?? post.title} className="mb-6 w-full rounded-xl border border-border object-cover" />}
        <p className="mb-5 text-xs text-muted-foreground">
          {post.author ? `${post.author} · ` : ""}
          {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
        </p>
        <div className="grid max-w-3xl gap-4 text-sm leading-7 text-muted-foreground">
          {(post.body ?? "").split(/\n{2,}/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
        {post.tags.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => <li key={tag} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{tag}</li>)}
          </ul>
        )}
      </SectionShell>
    </main>
  );
}
