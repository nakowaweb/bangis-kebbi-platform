import { EntryVideo } from "@/components/entry-video";
import { SafeImage } from "@/components/safe-image";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import type { LanguageCode } from "@/lib/i18n/dictionary";

import { SectionShell } from "@/components/platform-sections";
import { getPublicEntry } from "@/lib/content.functions";
import { pageHead } from "@/lib/seo";
import { RouteError } from "@/components/route-error";
import { ContactActions } from "@/components/contact-actions";
import { articleBySlug, articles, text } from "@/lib/portfolio-content";
import { useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  errorComponent: RouteError,
  loaderDeps: (opts) => ({ lang: ((opts.search as { lang?: LanguageCode }).lang ?? "en") as LanguageCode }),
  loader: async ({ params, deps }) => {
    const post = await getPublicEntry({ data: { contentType: "blog_post", slug: params.slug, language: deps.lang } });
    const fallback = articleBySlug(params.slug);
    if (!post && !fallback) throw notFound();
    return { post, fallback };
  },
  head: ({ params, loaderData, match }) => {
    if (!loaderData) {
      return { meta: [{ title: "Article not found — BangisKebbi.com" }, { name: "robots", content: "noindex" }] };
    }
    const language = match.search.lang ?? "en";
    const title = loaderData.post?.title ?? (loaderData.fallback ? text(loaderData.fallback.title, language) : "Article");
    const description = loaderData.post?.seo_description || loaderData.post?.summary || (loaderData.fallback ? text(loaderData.fallback.summary, language) : `An article from BangisKebbi.com: ${title}`);
    return {
      ...pageHead({ search: match.search,
        title: loaderData.post?.seo_title || `${title} — BangisKebbi.com`,
        description,
        path: `/blog/${params.slug}`,
        type: "article",
        canonical: loaderData.post?.canonical_url,
        ogTitle: loaderData.post?.og_title,
        ogDescription: loaderData.post?.og_description,
        image: loaderData.post?.ogImageUrl,
      }),
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            description,
            datePublished: loaderData.post?.published_at ?? undefined,
            dateModified: loaderData.post?.updated_at ?? undefined,
            author: { "@type": "Person", name: loaderData.post?.author ?? loaderData.fallback?.author ?? "Abubakar Alhaji Abubakar" },
            image: loaderData.post?.ogImageUrl ?? undefined,
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
              { "@type": "ListItem", position: 3, name: title, item: `/blog/${params.slug}` },
            ],
          }),
        },
      ],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post, fallback } = Route.useLoaderData();
  const { language } = useLanguage();
  const title = post?.title ?? (fallback ? text(fallback.title, language) : "Article");
  const summary = post?.summary ?? (fallback ? text(fallback.summary, language) : undefined);
  const labels = language === "ar" ? { home: "الرئيسية", blog: "المقالات", share: "مشاركة", related: "مقالات ذات صلة", talk: "لنتحدث عن مشروعك" } : language === "ha" ? { home: "Gida", blog: "Rubuce-rubuce", share: "Raba", related: "Wasu rubuce-rubuce", talk: "Mu tattauna aikinka" } : { home: "Home", blog: "Blog", share: "Share", related: "Related posts", talk: "Let’s discuss your project" };
  const related = articles.filter((item) => item.slug !== fallback?.slug).slice(0, 2);
  const share = async () => {
    const data = { title, url: window.location.href };
    if (navigator.share) await navigator.share(data);
    else await navigator.clipboard.writeText(window.location.href);
  };
  return (
    <main>
      <SectionShell eyebrow={post?.category ?? (fallback ? text(fallback.category, language) : "Article")} title={title} description={summary}>
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">{labels.home}</Link> <span aria-hidden>/</span>{" "}
          <Link to="/blog" className="hover:underline">{labels.blog}</Link>
        </nav>
        {(post?.imageUrl || fallback?.image) && <SafeImage src={post?.imageUrl ?? fallback?.image ?? ""} alt={post?.image_alt ?? title} className="mb-6 aspect-[16/7] w-full rounded-lg border border-border object-cover" />}
        <p className="mb-5 text-xs text-muted-foreground">
          {post?.author ?? fallback?.author ?? ""}{post?.published_at || fallback?.publishedAt ? ` · ${new Date(post?.published_at ?? fallback?.publishedAt ?? "").toLocaleDateString()}` : ""}
        </p>
        <div className="grid max-w-3xl gap-4 text-sm leading-7 text-muted-foreground">
          {(post?.body ? post.body.split(/\n{2,}/).filter(Boolean) : fallback?.body[language] ?? fallback?.body.en ?? []).map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}
        </div>
        {post && post.tags.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => <li key={tag} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{tag}</li>)}
          </ul>
        )}
        <Button variant="outline" className="mt-7" onClick={() => void share()}><Share2 /> {labels.share}</Button>
        <section className="mt-12 border-t border-border pt-8"><h2 className="font-display text-2xl font-bold">{labels.related}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{related.map((item) => <Link key={item.slug} to="/blog/$slug" params={{ slug: item.slug }} className="rounded-lg border border-border bg-card p-5 transition hover:border-primary"><p className="text-xs font-bold text-primary">{text(item.category, language)}</p><h3 className="mt-2 font-display text-lg font-bold">{text(item.title, language)}</h3></Link>)}</div></section>
        {post ? <EntryVideo payload={post.payload} fileUrl={post.videoFileUrl} title={title} /> : null}
        <ContactActions />
      </SectionShell>
    </main>
  );
}
