import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import type { LanguageCode } from "@/lib/i18n/dictionary";

import { SectionShell } from "@/components/platform-sections";
import { getPublicEntry } from "@/lib/content.functions";
import { pageHead } from "@/lib/seo";
import { RouteError } from "@/components/route-error";

export const Route = createFileRoute("/projects/$slug")({
  errorComponent: RouteError,
  loaderDeps: ({ search }: { search: { lang?: LanguageCode } }) => ({ lang: search.lang ?? "en" }),
  loader: async ({ params, deps }) => {
    const project = await getPublicEntry({ data: { contentType: "project", slug: params.slug, language: deps.lang } });
    if (!project) throw notFound();
    return project;
  },
  head: ({ params, loaderData, match }) => {
    if (!loaderData) {
      return { meta: [{ title: "Project not found — BangisKebbi.com" }, { name: "robots", content: "noindex" }] };
    }
    const description = loaderData.seo_description || loaderData.summary || `A project by Bangis Kebbi: ${loaderData.title}`;
    return {
      ...pageHead({ search: match.search,
        title: loaderData.seo_title || `${loaderData.title} — Bangis Kebbi Project`,
        description,
        path: `/projects/${params.slug}`,
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
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Projects", item: "/projects" },
              { "@type": "ListItem", position: 3, name: loaderData.title, item: `/projects/${params.slug}` },
            ],
          }),
        },
      ],
    };
  },
  component: ProjectPage,
});

function ProjectPage() {
  const project = Route.useLoaderData();
  const gallery = Array.isArray(project.gallery) ? (project.gallery as unknown[]).filter((item): item is string => typeof item === "string") : [];
  return (
    <main>
      <SectionShell eyebrow={project.category ?? "Project"} title={project.title} description={project.summary ?? undefined}>
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">Home</Link> <span aria-hidden>/</span>{" "}
          <Link to="/projects" className="hover:underline">Projects</Link>
        </nav>
        {project.imageUrl && <img src={project.imageUrl} alt={project.image_alt ?? project.title} className="mb-6 w-full rounded-xl border border-border object-cover" />}
        <div className="grid max-w-3xl gap-4 text-sm leading-7 text-muted-foreground">
          {(project.body ?? "").split(/\n{2,}/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {project.completed_on && <div><dt className="text-xs font-bold uppercase text-primary">Completed</dt><dd className="text-sm text-muted-foreground">{new Date(project.completed_on).toLocaleDateString()}</dd></div>}
          {project.tags.length > 0 && <div><dt className="text-xs font-bold uppercase text-primary">Tools used</dt><dd className="text-sm text-muted-foreground">{project.tags.join(", ")}</dd></div>}
        </dl>
        {project.project_url && (
          <a href={project.project_url} rel="noopener noreferrer" target="_blank" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">Visit the live project</a>
        )}
        {gallery.length > 0 && (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((src) => <img key={src} src={src} alt={`${project.title} gallery image`} loading="lazy" className="w-full rounded-lg border border-border object-cover" />)}
          </div>
        )}
      </SectionShell>
    </main>
  );
}
