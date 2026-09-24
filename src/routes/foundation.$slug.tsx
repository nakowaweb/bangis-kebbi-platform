import { SafeImage } from "@/components/safe-image";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  foundationCategoryLabels,
  foundationStatusLabels,
  getFoundationProject,
  type FoundationProject,
} from "@/lib/foundation.functions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/foundation/$slug")({
  head: ({ params, match }) =>
    pageHead({ search: match.search,
      title: "BK Foundations Project — BangisKebbi.com",
      description: `Details and published updates for the BK Foundations community project "${params.slug.replaceAll("-", " ")}".`,
      path: `/foundation/${params.slug}`,
    }),
  component: FoundationProjectPage,
});

function FoundationProjectPage() {
  const { slug } = Route.useParams();
  const load = useServerFn(getFoundationProject);
  const query = useQuery({ queryKey: ["foundation-project", slug], queryFn: () => load({ data: { slug } }) });

  if (query.isPending) {
    return <main className="mx-auto grid max-w-5xl gap-5 px-4 py-12"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-64 w-full" /></main>;
  }

  const project = query.data?.project as FoundationProject | null | undefined;
  if (!project) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">This project is not available</h1>
        <p className="mt-3 text-sm text-muted-foreground">It may not be published yet.</p>
        <Button className="mt-6" asChild><Link to="/foundation"><ArrowLeft /> Back to BK Foundations</Link></Button>
      </main>
    );
  }

  const updates = query.data?.updates ?? [];

  return (
    <main className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Button variant="link" className="mb-4 h-auto px-0" asChild><Link to="/foundation"><ArrowLeft /> BK Foundations</Link></Button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{foundationStatusLabels[project.status]}</Badge>
          <Badge variant="outline">{foundationCategoryLabels[project.category] ?? project.category}</Badge>
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold">{project.title}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {project.location ? <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{project.location}</span> : null}
          {project.start_date ? <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />From {new Date(project.start_date).toLocaleDateString()}</span> : null}
          {project.end_date ? <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />To {new Date(project.end_date).toLocaleDateString()}</span> : null}
        </div>

        {project.image_url ? (
          <SafeImage src={project.image_url} alt={project.title} className="mt-6 aspect-[16/9] w-full rounded-lg border border-border object-cover" />
        ) : null}

        {project.summary ? <p className="mt-6 text-base leading-7 text-muted-foreground">{project.summary}</p> : null}
        {project.description ? <p className="mt-4 whitespace-pre-line text-sm leading-7">{project.description}</p> : null}

        {project.media_items.length ? (
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold">Project media</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {project.media_items.map((item) =>
                item.url ? (
                  <figure key={item.path} className="overflow-hidden rounded-lg border border-border bg-card">
                    <SafeImage src={item.url} alt={item.caption || project.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    {item.caption ? <figcaption className="p-3 text-xs text-muted-foreground">{item.caption}</figcaption> : null}
                  </figure>
                ) : null,
              )}
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">Project updates</h2>
          <div className="mt-4 grid gap-3">
            {updates.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">No updates have been published for this project yet.</p>
            ) : (
              updates.map((update: { id: string; title: string; body: string | null; created_at: string }) => (
                <article key={update.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-4 w-4" />{new Date(update.created_at).toLocaleDateString()}</div>
                  <h3 className="mt-2 font-display text-base font-bold">{update.title}</h3>
                  {update.body ? <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{update.body}</p> : null}
                </article>
              ))
            )}
          </div>
        </section>

        <p className="mt-10 rounded-lg border border-border bg-secondary p-4 text-xs text-muted-foreground">
          BK Foundations is a community support programme focused on practical help, dignity and accountable updates.
        </p>
      </div>
    </main>
  );
}
