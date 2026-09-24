import { useLanguage } from "@/lib/language";
import { SafeImage } from "@/components/safe-image";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CalendarDays, Compass, HandHeart, HeartHandshake, MapPin, ShieldCheck, Sparkles, Target, UsersRound } from "lucide-react";

import { ContactSection } from "@/components/platform-sections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { foundationCategoryLabels, foundationStatusLabels, getFoundationOverview, type FoundationProject } from "@/lib/foundation.functions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/foundation/")({
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "BK Foundations — Community Support Projects",
      description:
        "BK Foundations is the humanitarian arm of BangisKebbi.com, sharing practical support areas, honest updates and completed community work.",
      path: "/foundation",
    }),
  component: FoundationPage,
});

const foundationCopy = {
  en: { headline: "Community support, done with purpose.", description: "BK Foundations is the community and humanitarian side of BangisKebbi.com, focused on practical support for people and families facing genuine hardship.", join: "Join the Community", contact: "Contact BK Foundations", missionLabel: "Mission", mission: "To provide practical, dignified and targeted support to people and families facing genuine hardship, with priority given to verified community needs.", visionLabel: "Vision", vision: "Stronger, better-connected communities where people facing hardship can access timely and meaningful support.", areasLabel: "Support areas", areasTitle: "Where support is focused.", areas: ["Food assistance", "Orphan support", "Support for low-income families", "Emergency relief", "Essential supplies", "Community relief", "Support for people facing hardship", "Support coordination for people receiving serious treatment or facing difficult circumstances", "Zakat/Sadaqah support where properly handled", "In-kind support"], processLabel: "Process", processTitle: "How support is delivered.", steps: ["Identify a genuine need", "Review and verify the request", "Coordinate appropriate support", "Deliver the support", "Record the activity", "Publish appropriate impact updates without exposing private beneficiary information"] },
  ar: { headline: "دعم مجتمعي بهدف واضح.", description: "مؤسسات BK هي الجانب المجتمعي والإنساني من BangisKebbi.com، وتركز على الدعم العملي للأفراد والأسر الذين يواجهون صعوبات حقيقية.", join: "انضم إلى المجتمع", contact: "تواصل مع مؤسسات BK", missionLabel: "الرسالة", mission: "تقديم دعم عملي وكريم وموجّه للأفراد والأسر الذين يواجهون صعوبات حقيقية، مع إعطاء الأولوية للاحتياجات المجتمعية الموثقة.", visionLabel: "الرؤية", vision: "مجتمعات أقوى وأكثر ترابطاً يستطيع فيها من يواجهون الصعوبات الحصول على دعم مفيد وفي الوقت المناسب.", areasLabel: "مجالات الدعم", areasTitle: "أين يتركز الدعم.", areas: ["المساعدات الغذائية", "دعم الأيتام", "دعم الأسر محدودة الدخل", "الإغاثة الطارئة", "المستلزمات الأساسية", "الإغاثة المجتمعية", "دعم من يواجهون الصعوبات", "تنسيق الدعم لمن يتلقون علاجاً صعباً أو يمرون بظروف قاسية", "دعم الزكاة والصدقة عند التعامل الصحيح", "الدعم العيني"], processLabel: "المنهجية", processTitle: "كيف يُقدَّم الدعم.", steps: ["تحديد حاجة حقيقية", "مراجعة الطلب والتحقق منه", "تنسيق الدعم المناسب", "تقديم الدعم", "تسجيل النشاط", "نشر تحديثات أثر مناسبة دون كشف معلومات المستفيدين الخاصة"] },
  ha: { headline: "Tallafin al'umma, da manufa.", description: "BK Foundations ɓangaren al'umma da jin ƙai ne na BangisKebbi.com, wanda ya mai da hankali kan tallafi mai amfani ga mutane da iyalan da ke fuskantar wahala ta gaske.", join: "Shiga Al'umma", contact: "Tuntuɓi BK Foundations", missionLabel: "Manufa", mission: "Samar da tallafi mai amfani, mai mutunci kuma da aka nufa ga mutane da iyalan da ke fuskantar wahala ta gaske, tare da fifita bukatun al'umma da aka tabbatar.", visionLabel: "Hangen nesa", vision: "Al'ummomi masu ƙarfi da haɗin kai inda masu fuskantar wahala za su sami tallafi mai ma'ana a lokacin da ya dace.", areasLabel: "Fannonin tallafi", areasTitle: "Inda tallafi ya fi mai da hankali.", areas: ["Taimakon abinci", "Tallafin marayu", "Tallafin iyalai masu ƙaramin kuɗi", "Agajin gaggawa", "Kayan buƙatu na yau da kullum", "Agajin al'umma", "Tallafi ga masu fuskantar wahala", "Haɗa tallafi ga masu jinya mai tsanani ko cikin mawuyacin hali", "Tallafin Zakka/Sadaka idan an sarrafa shi yadda ya kamata", "Tallafin kayayyaki"], processLabel: "Tsari", processTitle: "Yadda ake ba da tallafi.", steps: ["Gano buƙata ta gaske", "Duba da tabbatar da buƙatar", "Haɗa tallafin da ya dace", "Isar da tallafin", "Rubuta aikin", "Wallafa bayanan tasiri ba tare da fallasa bayanan sirri na masu amfana ba"] },
};

type ContentEntry = { id: string; content_type: string; title: string; summary: string | null; body: string | null };

function FoundationPage() {
  const { language } = useLanguage();
  const fcopy = foundationCopy[language];
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
            {intro?.title ?? fcopy.headline}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-primary-foreground/80">
            {intro?.summary ?? fcopy.description}
          </p>
          {intro?.body ? <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-primary-foreground/70">{intro.body}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="bg-brand-cyan text-brand-ink hover:bg-brand-cyan-soft" asChild>
              <Link to="/register">{fcopy.join} <ArrowRight /></Link>
            </Button>
            <Button variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/contact">{fcopy.contact}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
           <Panel icon={Target} eyebrow={fcopy.missionLabel} title={mission?.title ?? fcopy.missionLabel} text={mission?.summary ?? mission?.body ?? fcopy.mission} />
           <Panel icon={Compass} eyebrow={fcopy.visionLabel} title={vision?.title ?? fcopy.visionLabel} text={vision?.summary ?? vision?.body ?? fcopy.vision} />
        </div>
      </section>

      <section className="border-b border-border bg-secondary py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase text-primary">{fcopy.areasLabel}</p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{fcopy.areasTitle}</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {whatWeDo.length === 0 ? (
              fcopy.areas.map((title) => <article key={title} className="rounded-lg border border-border bg-card p-5"><span className="grid h-10 w-10 place-items-center rounded-md bg-brand-green/10 text-brand-green"><HeartHandshake className="h-5 w-5" /></span><h3 className="mt-4 font-display text-base font-bold">{title}</h3></article>)
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

      <section className="border-b border-border bg-background py-10"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase text-primary">{fcopy.processLabel}</p><h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{fcopy.processTitle}</h2><ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{fcopy.steps.map((step, index) => <li key={step} className="flex gap-3 rounded-lg border border-border bg-card p-5 text-sm leading-6"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground">{index + 1}</span>{step}</li>)}</ol></div></section>

      <section className="border-b border-border bg-secondary py-10"><div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8"><Panel icon={HeartHandshake} eyebrow="Process" title="Need, review, coordinate, update." text="Requests and opportunities are reviewed, appropriate partners are identified, delivery is coordinated and verified updates are published when suitable." /><Panel icon={ShieldCheck} eyebrow="Impact and privacy" title="Dignity comes before publicity." text="Updates focus on the work delivered. Personal stories, identities and sensitive circumstances are not published without a clear, appropriate basis." /><Panel icon={UsersRound} eyebrow="Partners" title="Work with BK Foundations." text="Organizations and professionals with relevant capacity can contact the team to discuss a responsible partnership." /></div></section>

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
          <SafeImage src={project.image_url} alt={project.title} loading="lazy" className="h-full w-full object-cover" />
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
