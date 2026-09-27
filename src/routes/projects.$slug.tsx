import { EntryVideo } from "@/components/entry-video";
import { SafeImage } from "@/components/safe-image";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import type { LanguageCode } from "@/lib/i18n/dictionary";

import { SectionShell } from "@/components/platform-sections";
import { getPublicEntry } from "@/lib/content.functions";
import { pageHead } from "@/lib/seo";
import { RouteError } from "@/components/route-error";
import { ContactActions } from "@/components/contact-actions";
import { projectBySlug, text } from "@/lib/portfolio-content";
import { useLanguage } from "@/lib/language";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/projects/$slug")({
  errorComponent: RouteError,
  loaderDeps: (opts) => ({ lang: ((opts.search as { lang?: LanguageCode }).lang ?? "en") as LanguageCode }),
  loader: async ({ params, deps }) => {
    const project = await getPublicEntry({ data: { contentType: "project", slug: params.slug, language: deps.lang } });
    const fallback = projectBySlug(params.slug);
    if (!project && !fallback) throw notFound();
    return { project, fallback };
  },
  head: ({ params, loaderData, match }) => {
    if (!loaderData) {
      return { meta: [{ title: "Project not found — BangisKebbi.com" }, { name: "robots", content: "noindex" }] };
    }
    const language = match.search.lang ?? "en";
    const title = loaderData.project?.title ?? (loaderData.fallback ? text(loaderData.fallback.title, language) : "Project");
    const description = loaderData.project?.seo_description || loaderData.project?.summary || (loaderData.fallback ? text(loaderData.fallback.summary, language) : `A project by Bangis Kebbi: ${title}`);
    return {
      ...pageHead({ search: match.search,
        title: loaderData.project?.seo_title || `${title} — Bangis Kebbi Project`,
        description,
        path: `/projects/${params.slug}`,
        canonical: loaderData.project?.canonical_url,
        ogTitle: loaderData.project?.og_title,
        ogDescription: loaderData.project?.og_description,
        image: loaderData.project?.ogImageUrl,
      }),
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Projects", item: "/projects" },
              { "@type": "ListItem", position: 3, name: title, item: `/projects/${params.slug}` },
            ],
          }),
        },
      ],
    };
  },
  component: ProjectPage,
});

function ProjectPage() {
  const { project, fallback } = Route.useLoaderData();
  const { language } = useLanguage();
  const title = project?.title ?? (fallback ? text(fallback.title, language) : "Project");
  const summary = project?.summary ?? (fallback ? text(fallback.summary, language) : undefined);
  const category = project?.category ?? (fallback ? text(fallback.category, language) : "Project");
  const gallery = project?.galleryUrls ?? [];
  const labels = language === "ar" ? { home: "الرئيسية", projects: "الأعمال", completed: "تاريخ الإكمال", tools: "الأدوات", visit: "زيارة المشروع", futureUrl: "سيظهر رابط العرض المباشر أو الموقع هنا عند توفره.", discuss: "ناقش مشروعاً مشابهاً" } : language === "ha" ? { home: "Gida", projects: "Ayyuka", completed: "An kammala", tools: "Kayan aiki", visit: "Ziyarci aikin", futureUrl: "Za a nuna hanyar live demo ko gidan yanar gizo a nan idan ta samu.", discuss: "Tattauna irin wannan aikin" } : { home: "Home", projects: "Projects", completed: "Completed", tools: "Tools used", visit: "Visit the live project", futureUrl: "A Live Demo or Website URL will appear here when available.", discuss: "Discuss a similar project" };
  return (
    <main>
      <SectionShell eyebrow={category} title={title} description={summary}>
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">{labels.home}</Link> <span aria-hidden>/</span>{" "}
          <Link to="/projects" className="hover:underline">{labels.projects}</Link>
        </nav>
        {fallback?.concept && <Badge variant="secondary" className="mb-4">Concept / Demo</Badge>}
        {(project?.imageUrl || fallback?.image) && <SafeImage src={project?.imageUrl ?? fallback?.image ?? ""} alt={project?.image_alt ?? (fallback ? text(fallback.imageAlt, language) : title)} className="mb-8 aspect-[16/8] w-full rounded-lg border border-border object-cover" />}
        <div className="grid max-w-3xl gap-4 text-sm leading-7 text-muted-foreground">
          {(project?.body ?? "").split(/\n{2,}/).filter(Boolean).map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}
        </div>
        {fallback && <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">{(fallback.sections[language] ?? fallback.sections.en).map((section) => <section key={section.title} className="border-t border-border pt-5"><h2 className="font-display text-xl font-bold">{section.title}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p></section>)}</div>}
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {project?.completed_on && <div><dt className="text-xs font-bold uppercase text-primary">{labels.completed}</dt><dd className="text-sm text-muted-foreground">{new Date(project.completed_on).toLocaleDateString()}</dd></div>}
          {project && project.tags.length > 0 && <div><dt className="text-xs font-bold uppercase text-primary">{labels.tools}</dt><dd className="text-sm text-muted-foreground">{project.tags.join(", ")}</dd></div>}
        </dl>
        {project?.project_url && (
          <a href={project.project_url} rel="noopener noreferrer" target="_blank" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">{labels.visit}</a>
        )}
        {!project?.project_url && <p className="mt-8 border-l-2 border-primary pl-4 text-sm text-muted-foreground">{labels.futureUrl}</p>}
        {gallery.length > 0 && (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((src) => <SafeImage key={src} src={src} alt={`${title} gallery image`} loading="lazy" className="w-full rounded-lg border border-border object-cover" />)}
          </div>
        )}
        {project ? <EntryVideo payload={project.payload} fileUrl={project.videoFileUrl} title={title} /> : null}
        <ContactActions />
      </SectionShell>
    </main>
  );
}
