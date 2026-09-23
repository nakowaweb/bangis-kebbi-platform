import { SafeImage } from "@/components/safe-image";
import { Link, createFileRoute } from "@tanstack/react-router";
import type { LanguageCode } from "@/lib/i18n/dictionary";

import { ProjectsSection, SectionShell } from "@/components/platform-sections";
import { listPublicEntries } from "@/lib/content.functions";
import { pageHead } from "@/lib/seo";
import { RouteError } from "@/components/route-error";

export const Route = createFileRoute("/projects/")({
  head: ({ match }: { match: { search: { lang?: LanguageCode } } }) => ({
    ...pageHead({ search: match.search,
      title: "Selected Work — Bangis Kebbi Projects",
      description:
        "Selected Bangis Kebbi web design, web development, UI/UX, business website and AI-assisted development projects.",
      path: "/projects",
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
          ],
        }),
      },
    ],
  }),
  errorComponent: RouteError,
  loaderDeps: (opts) => ({ lang: ((opts.search as { lang?: LanguageCode }).lang ?? "en") as LanguageCode }),
  loader: ({ deps }) => listPublicEntries({ data: { contentType: "project", language: deps.lang } }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const projects = Route.useLoaderData();
  return (
    <main>
      <ProjectsSection full />
      {projects.length > 0 && (
        <SectionShell eyebrow="Project library" title="Open a project for the full case study." description="Every published project has its own page.">
          <div className="grid gap-4 md:grid-cols-3">
            {projects.map((project) => (
              <article key={project.id} className="overflow-hidden rounded-lg border border-border bg-card">
                {project.imageUrl && <SafeImage src={project.imageUrl} alt={project.image_alt ?? project.title} loading="lazy" className="aspect-[16/9] w-full object-cover" />}
                <div className="p-5">
                  {project.category && <p className="text-xs font-bold uppercase text-primary">{project.category}</p>}
                  <h3 className="mt-1 font-display text-base font-bold">
                    <Link to="/projects/$slug" params={{ slug: project.slug }} className="hover:underline">{project.title}</Link>
                  </h3>
                  {project.summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.summary}</p>}
                  <Link to="/projects/$slug" params={{ slug: project.slug }} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">View project</Link>
                </div>
              </article>
            ))}
          </div>
        </SectionShell>
      )}
    </main>
  );
}
