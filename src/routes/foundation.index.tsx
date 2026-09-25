import { useLanguage } from "@/lib/language";
import { SafeImage } from "@/components/safe-image";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, BookOpen, CalendarDays, Compass, Gift, HandHeart, HeartHandshake, HeartPulse, Home, MapPin, PackageCheck, ShieldCheck, Siren, Target, Utensils, UsersRound } from "lucide-react";

import { ContactSection } from "@/components/platform-sections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { foundationCategoryLabels, foundationStatusLabels, getFoundationOverview, type FoundationProject } from "@/lib/foundation.functions";
import { pageHead } from "@/lib/seo";
import supportCommunityRelief from "@/assets/support-community-relief.jpg";
import supportEmergencyRelief from "@/assets/support-emergency-relief.jpg";
import supportEssentialEducation from "@/assets/support-essential-education.jpg";
import supportFoodAssistance from "@/assets/support-food-assistance.jpg";
import supportHardship from "@/assets/support-hardship.jpg";
import supportInKind from "@/assets/support-in-kind.jpg";
import supportLowIncomeFamilies from "@/assets/support-low-income-families.jpg";
import supportMedicalCoordination from "@/assets/support-medical-coordination.jpg";
import supportOrphans from "@/assets/support-orphans.jpg";
import supportZakatSadaqah from "@/assets/support-zakat-sadaqah.jpg";

export const Route = createFileRoute("/foundation/")({
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "BK Community Support Initiative — Community Support",
      description:
        "BK Community Support Initiative shares practical support areas, accountable updates and completed community work from BangisKebbi.com.",
      path: "/foundation",
    }),
  component: FoundationPage,
});

const foundationCopy = {
  en: { headline: "People. Compassion. Stronger communities.", description: "BK Community Support Initiative is the community and humanitarian side of BangisKebbi.com, focused on practical support for people and families facing genuine hardship.", join: "Join the Community", contact: "Contact the Initiative", missionLabel: "Mission", mission: "To provide practical, dignified and targeted support to people and families facing genuine hardship, with priority given to verified community needs.", visionLabel: "Vision", vision: "Stronger, better-connected communities where people facing hardship can access timely and meaningful support.", areasLabel: "Our support programs", areasTitle: "Practical care where it matters most.", areas: ["Food Assistance", "Orphan Support", "Support for Low-Income Families", "Emergency Relief", "Essential Supplies / Education Support", "Community Relief", "Support for People Facing Hardship", "Medical/Treatment Support Coordination", "Zakat/Sadaqah Support", "In-Kind Support"], processLabel: "Process", processTitle: "How support is delivered.", steps: ["Identify a genuine need", "Review and verify the request", "Coordinate appropriate support", "Deliver the support", "Record the activity", "Publish appropriate impact updates without exposing private beneficiary information"] },
  ar: { headline: "الناس. الرحمة. مجتمعات أقوى.", description: "BK Community Support Initiative هي الجانب المجتمعي والإنساني من BangisKebbi.com، وتركز على الدعم العملي للأفراد والأسر الذين يواجهون صعوبات حقيقية.", join: "انضم إلى المجتمع", contact: "تواصل مع المبادرة", missionLabel: "الرسالة", mission: "تقديم دعم عملي وكريم وموجّه للأفراد والأسر الذين يواجهون صعوبات حقيقية، مع إعطاء الأولوية للاحتياجات المجتمعية الموثقة.", visionLabel: "الرؤية", vision: "مجتمعات أقوى وأكثر ترابطاً يستطيع فيها من يواجهون الصعوبات الحصول على دعم مفيد وفي الوقت المناسب.", areasLabel: "برامج الدعم", areasTitle: "رعاية عملية حيث تكون الحاجة أكبر.", areas: ["المساعدات الغذائية", "دعم الأيتام", "دعم الأسر محدودة الدخل", "الإغاثة الطارئة", "المستلزمات الأساسية ودعم التعليم", "الإغاثة المجتمعية", "دعم من يواجهون الصعوبات", "تنسيق الدعم الطبي والعلاجي", "دعم الزكاة والصدقة", "الدعم العيني"], processLabel: "المنهجية", processTitle: "كيف يُقدَّم الدعم.", steps: ["تحديد حاجة حقيقية", "مراجعة الطلب والتحقق منه", "تنسيق الدعم المناسب", "تقديم الدعم", "تسجيل النشاط", "نشر تحديثات أثر مناسبة دون كشف معلومات المستفيدين الخاصة"] },
  ha: { headline: "Mutane. Tausayi. Al’umma masu ƙarfi.", description: "BK Community Support Initiative ɓangaren al'umma da jin ƙai ne na BangisKebbi.com, wanda ya mai da hankali kan tallafi mai amfani ga mutane da iyalan da ke fuskantar wahala ta gaske.", join: "Shiga Al'umma", contact: "Tuntuɓi shirin", missionLabel: "Manufa", mission: "Samar da tallafi mai amfani, mai mutunci kuma da aka nufa ga mutane da iyalan da ke fuskantar wahala ta gaske, tare da fifita bukatun al'umma da aka tabbatar.", visionLabel: "Hangen nesa", vision: "Al'ummomi masu ƙarfi da haɗin kai inda masu fuskantar wahala za su sami tallafi mai ma'ana a lokacin da ya dace.", areasLabel: "Shirye-shiryen tallafi", areasTitle: "Taimako mai amfani inda ake buƙatarsa sosai.", areas: ["Taimakon abinci", "Tallafin marayu", "Tallafin iyalai masu ƙaramin kuɗi", "Agajin gaggawa", "Kayan buƙatu da tallafin ilimi", "Agajin al'umma", "Tallafi ga masu fuskantar wahala", "Haɗa tallafin jinya", "Tallafin Zakka/Sadaka", "Tallafin kayayyaki"], processLabel: "Tsari", processTitle: "Yadda ake ba da tallafi.", steps: ["Gano buƙata ta gaske", "Duba da tabbatar da buƙatar", "Haɗa tallafin da ya dace", "Isar da tallafin", "Rubuta aikin", "Wallafa bayanan tasiri ba tare da fallasa bayanan sirri na masu amfana ba"] },
};

type ContentEntry = { id: string; content_type: string; slug: string; title: string; summary: string | null; body: string | null; imageUrl: string | null; image_alt: string | null };

const supportPrograms = [
  { slug: "food-assistance", image: supportFoodAssistance, icon: Utensils, description: ["Providing nutritious food items to individuals and families in need.", "توفير مواد غذائية مغذية للأفراد والأسر المحتاجة.", "Samar da abinci mai gina jiki ga mutane da iyalai masu buƙata."] },
  { slug: "orphan-support", image: supportOrphans, icon: UsersRound, description: ["Supporting orphans through care, education and essential needs.", "دعم الأيتام بالرعاية والتعليم والاحتياجات الأساسية.", "Tallafa wa marayu ta hanyar kulawa, ilimi da buƙatu na yau da kullum."] },
  { slug: "low-income-families", image: supportLowIncomeFamilies, icon: Home, description: ["Helping vulnerable families with essential needs and practical opportunities.", "مساعدة الأسر محدودة الدخل في الاحتياجات الأساسية والفرص العملية.", "Taimaka wa iyalai masu ƙaramin kuɗi da muhimman buƙatu da damarmaki."] },
  { slug: "emergency-relief", image: supportEmergencyRelief, icon: Siren, description: ["Providing coordinated support during crises and emergencies.", "تقديم دعم منسق أثناء الأزمات والطوارئ.", "Samar da tallafi mai tsari yayin rikici da gaggawa."] },
  { slug: "essential-supplies-education", image: supportEssentialEducation, icon: BookOpen, description: ["Supplying school items, learning materials and other basic necessities.", "توفير المستلزمات المدرسية ومواد التعلم والاحتياجات الأساسية.", "Samar da kayan makaranta, kayan koyo da sauran muhimman buƙatu."] },
  { slug: "community-relief", image: supportCommunityRelief, icon: PackageCheck, description: ["Supporting communities through targeted assistance and outreach.", "دعم المجتمعات من خلال المساعدة الموجّهة والتواصل.", "Tallafa wa al’umma ta hanyar taimako da ya dace da kai ziyara."] },
  { slug: "people-facing-hardship", image: supportHardship, icon: HandHeart, description: ["Helping people through difficult personal and social circumstances.", "مساعدة الأفراد خلال الظروف الشخصية والاجتماعية الصعبة.", "Taimaka wa mutane a cikin mawuyacin yanayi na kai da na zamantakewa."] },
  { slug: "medical-treatment-coordination", image: supportMedicalCoordination, icon: HeartPulse, description: ["Helping coordinate practical support during serious treatment and illness.", "المساعدة في تنسيق الدعم العملي أثناء العلاج والمرض الشديد.", "Taimakawa wajen haɗa tallafi mai amfani yayin jinya mai tsanani."] },
  { slug: "zakat-sadaqah-support", image: supportZakatSadaqah, icon: HeartHandshake, description: ["Coordinating eligible Zakat and Sadaqah support with care and responsibility.", "تنسيق دعم الزكاة والصدقة للمستحقين بعناية ومسؤولية.", "Haɗa tallafin Zakka da Sadaka ga masu cancanta cikin kulawa."] },
  { slug: "in-kind-support", image: supportInKind, icon: Gift, description: ["Providing clothing, household items and other non-cash assistance.", "توفير الملابس والأدوات المنزلية وغيرها من المساعدات العينية.", "Samar da tufafi, kayan gida da sauran tallafin da ba na kuɗi ba."] },
] as const;

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
  const programs = supportPrograms.map((program, index) => ({ program, entry: whatWeDo.find((item) => item.slug === program.slug) ?? whatWeDo[index] }));

  const projects = (overview.data?.projects ?? []) as FoundationProject[];
  const active = projects.filter((project) => project.status === "planned" || project.status === "active");
  const completed = projects.filter((project) => project.status === "completed");
  const updates = overview.data?.updates ?? [];

  return (
    <main>
      <section className="border-b border-border bg-brand-ink py-12 text-primary-foreground sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-green/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">
             <HandHeart className="h-4 w-4" /> BK Community Support Initiative
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
           <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
             {programs.map(({ program, entry }, index) => {
               const Icon = program.icon;
               const title = entry?.title ?? fcopy.areas[index];
               const description = entry?.summary ?? entry?.body ?? program.description[language === "en" ? 0 : language === "ar" ? 1 : 2];
               return (
                 <article key={program.slug} className="motion-card group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:shadow-platform">
                   <div className="aspect-[16/8.5] overflow-hidden bg-muted">
                     <SafeImage src={entry?.imageUrl ?? program.image} alt={entry?.image_alt ?? title} loading="lazy" width={1280} height={768} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" />
                   </div>
                   <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 p-4 sm:p-5">
                     <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-brand-green/10 text-brand-green"><Icon className="h-5 w-5" /></span>
                     <div className="min-w-0">
                       <h3 className="font-display text-base font-bold leading-tight text-card-foreground sm:text-lg">{title}</h3>
                       <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{description}</p>
                     </div>
                   </div>
                 </article>
               );
             })}
          </div>
        </div>
      </section>

      <ProjectGrid
        eyebrow="Community support projects"
        title="Current and planned community projects."
        description="Only published projects appear here."
        loading={overview.isPending}
        projects={active}
        emptyText="No community support projects have been published yet."
      />

      <section className="border-b border-border bg-background py-10"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase text-primary">{fcopy.processLabel}</p><h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{fcopy.processTitle}</h2><ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{fcopy.steps.map((step, index) => <li key={step} className="flex gap-3 rounded-lg border border-border bg-card p-5 text-sm leading-6"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground">{index + 1}</span>{step}</li>)}</ol></div></section>

      <section className="border-b border-border bg-secondary py-10"><div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8"><Panel icon={HeartHandshake} eyebrow="Process" title="Need, review, coordinate, update." text="Requests and opportunities are reviewed, appropriate partners are identified, delivery is coordinated and verified updates are published when suitable." /><Panel icon={ShieldCheck} eyebrow="Impact and privacy" title="Dignity comes before publicity." text="Updates focus on the work delivered. Personal stories, identities and sensitive circumstances are not published without a clear, appropriate basis." /><Panel icon={UsersRound} eyebrow="Partners" title="Work with BK Community Support Initiative." text="Organizations and professionals with relevant capacity can contact the team to discuss a responsible partnership." /></div></section>

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
          <div className="grid h-full w-full place-items-center text-muted-foreground"><HandHeart className="h-7 w-7" /></div>
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
