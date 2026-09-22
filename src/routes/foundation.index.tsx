import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CalendarDays, Compass, HandHeart, HeartHandshake, MapPin, Sparkles, Target } from "lucide-react";

import { ContactSection } from "@/components/platform-sections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { foundationCategoryLabels, foundationStatusLabels, getFoundationOverview, type FoundationProject } from "@/lib/foundation.functions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/foundation/")({
  head: () =>
    pageHead({
      title: "BK Foundations — Community Support Projects",
      description:
        "BK Foundations is the community support arm of BangisKebbi.com: practical projects, honest updates and completed community work. Not an investment programme.",
      path: "/foundation",
    }),
  component: FoundationPage,
});

type ContentEntry = { id: string; content_type: string; title: string; summary: string | null; body: string | null };

function FoundationPage() {
  const load = useServerFn(getFoundationOverview);
  const overview = useQuery({ queryKey: ["foundation-public"], queryFn: () => load() });

  const content = (overview.data?.content ?? []) as ContentEntry[];
  const pick = (type: string) => content.find((entry) => entry.content_type === type);
  const intro = pick("foundation");
  const mission = pick("foundation_mission");
  const vision = pick("foundation_vision");
  const whatWeDo = content.filter((entry) => entry.content_type === "foundation_what_we_do");

  const projects = (overview.data?.projects ?? []) as FoundationProject[];
  const active = projects.filter((project) => project.status === "planned" || project.status === "active");
  const completed = projects.filter((project) => project.status === "completed");
  const updates = overview.data?.updates ?? [];

  return (
    <main>
      <section className="border-b border-border bg-brand-ink py-12 text-primary-foreground sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-green/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">
            <HandHeart className="h-4 w-4" /> BK Foundations
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight sm:text-4xl">
            {intro?.title ?? "Community support, done openly."}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-primary-foreground/80">
            {intro?.summary ??
              "BK Foundations is the community and humanitarian side of BangisKebbi.com. It is not an investment programme and offers no financial returns."}
          </p>
          {intro?.body ? <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-primary-foreground/70">{intro.body}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="bg-brand-cyan text-brand-ink hover:bg-brand-cyan-soft" asChild>
              <Link to="/register">Join the community <ArrowRight /></Link>
            </Button>
            <Button variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/contact">Contact BK Foundations</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          <Panel icon={Target} eyebrow="Mission" title={mission?.title ?? "Support people with practical help."} text={mission?.summary ?? mission?.body ?? "Our mission text will appear here once it is published from the admin area."} />
          <Panel icon={Compass} eyebrow="Vision" title={vision?.title ?? "Stronger, better-connected communities."} text={vision?.summary ?? vision?.body ?? "Our vision text will appear here once it is published from the admin area."} />
        </div>
      </section>

      <section className="border-b border-border bg-secondary py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase text-primary">What we do</p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Community support activities.</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {whatWeDo.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-card p-8 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
                Activity areas will be listed here once they are published.
              </p>
            ) : (
              whatWeDo.map((entry) => (
                <article key={entry.id} className="rounded-lg border border-border bg-card p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-green/10 text-brand-green"><HeartHandshake className="h-5 w-5" /></span>
                  <h3 className="mt-4 font-display text-base font-bold">{entry.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.summary ?? entry.body}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <ProjectGrid
        eyebrow="Foundation projects"
        title="Current and planned community projects."
        description="Only published projects appear here."
        loading={overview.isPending}
        projects={active}
        emptyText="No foundation projects have been published yet."
      />

      <section className="border-b border-border bg-secondary py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase text-primary">Project updates</p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Latest published updates.</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {updates.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-card p-8 text-sm text-muted-foreground md:col-span-2">
                No project updates have been published yet.
              </p>
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
        </div>
      </section>

      <ProjectGrid
        eyebrow="Completed projects"
        title="Community work already delivered."
        description="Completed projects stay visible so the work can be checked."
        loading={overview.isPending}
        projects={completed}
        emptyText="No completed projects have been published yet."
      />

      <ContactSection />
    </main>
  );
}

function Panel({ icon: Icon, eyebrow, title, text }: { icon: typeof Target; eyebrow: string; title: string; text: string | null }) {
  return (
    <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-cyan/10 text-primary"><Icon className="h-5 w-5" /></span>
      <p className="mt-4 text-xs font-bold uppercase text-primary">{eyebrow}</p>
      <h2 className="mt-1 font-display text-xl font-bold">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{text}</p>
    </article>
  );
}

export function ProjectGrid({
  eyebrow,
  title,
  description,
  projects,
  loading,
  emptyText,
}: {
  eyebrow: string;
  title: string;
  description: string;
  projects: FoundationProject[];
  loading?: boolean;
  emptyText: string;
}) {
  return (
    <section className="border-b border-border bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase text-primary">{eyebrow}</p>
        <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            [0, 1, 2].map((key) => <Skeleton key={key} className="h-64 w-full" />)
          ) : projects.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-card p-8 text-sm text-muted-foreground md:col-span-2 lg:col-span-3">{emptyText}</p>
          ) : (
            projects.map((project) => <ProjectCard key={project.id} project={project} />)
          )}
        </div>
      </div>
    </section>
  );
}

export function ProjectCard({ project, href = true }: { project: FoundationProject; href?: boolean }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-platform">
      <div className="aspect-[16/9] w-full bg-secondary">
        {project.image_url ? (
          <img src={project.image_url} alt={project.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground"><Sparkles className="h-7 w-7" /></div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={project.status === "completed" ? "secondary" : "default"}>{foundationStatusLabels[project.status]}</Badge>
          <Badge variant="outline">{foundationCategoryLabels[project.category] ?? project.category}</Badge>
        </div>
        <h3 className="mt-3 font-display text-lg font-bold">{project.title}</h3>
        {project.location ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{project.location}</p>
        ) : null}
        <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{project.summary ?? "Details will be published soon."}</p>
        {href ? (
          <Button variant="link" className="mt-3 h-auto justify-start px-0" asChild>
            <Link to="/foundation/$slug" params={{ slug: project.slug }}>View project <ArrowRight /></Link>
          </Button>
        ) : null}
      </div>
    </article>
  );
}
