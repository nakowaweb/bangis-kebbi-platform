import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CalendarDays, HandHeart, MapPin, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  foundationCategoryLabels,
  foundationStatusLabels,
  getMemberFoundation,
  type FoundationProject,
} from "@/lib/foundation.functions";

/** Read-only member view: published foundation projects and updates, no admin controls. */
export function MemberFoundationPanel() {
  const load = useServerFn(getMemberFoundation);
  const query = useQuery({ queryKey: ["member-foundation"], queryFn: () => load() });

  if (query.isPending) return <Skeleton className="h-64 w-full" />;
  if (query.isError) return <Empty text={query.error.message} />;

  const projects = (query.data?.projects ?? []) as FoundationProject[];
  const updates = query.data?.updates ?? [];
  const completed = projects.filter((project) => project.status === "completed");

  return (
    <section className="grid gap-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-brand-green"><HandHeart className="h-5 w-5" /><CardTitle className="text-lg">BK Foundations</CardTitle></div>
          <CardDescription>
            Community support projects and published updates. BK Foundations is a community programme, not an investment.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild><Link to="/foundation">Public Foundation page <ArrowRight /></Link></Button>
          <Badge variant="secondary">{projects.length} published project{projects.length === 1 ? "" : "s"}</Badge>
          <Badge variant="secondary">{completed.length} completed</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.length === 0 ? (
          <Empty text="No foundation projects have been published yet." />
        ) : (
          projects.map((project) => (
            <article key={project.id} className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
              <div className="aspect-[16/9] w-full bg-secondary">
                {project.image_url ? (
                  <img src={project.image_url} alt={project.title} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground"><Sparkles className="h-6 w-6" /></div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={project.status === "completed" ? "secondary" : "default"}>{foundationStatusLabels[project.status]}</Badge>
                  <Badge variant="outline">{foundationCategoryLabels[project.category] ?? project.category}</Badge>
                </div>
                <h3 className="mt-3 font-display text-base font-bold">{project.title}</h3>
                {project.location ? <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{project.location}</p> : null}
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{project.summary ?? "Details will be published soon."}</p>
                <Button variant="link" className="mt-2 h-auto justify-start px-0 text-xs" asChild>
                  <Link to="/foundation/$slug" params={{ slug: project.slug }}>View details <ArrowRight /></Link>
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Recent project updates</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {updates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No project updates have been published yet.</p>
          ) : (
            updates.map((update: { id: string; title: string; body: string | null; created_at: string }) => (
              <div key={update.id} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{new Date(update.created_at).toLocaleDateString()}</div>
                <strong className="mt-1 block text-sm">{update.title}</strong>
                {update.body ? <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{update.body}</p> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">{text}</div>;
}
