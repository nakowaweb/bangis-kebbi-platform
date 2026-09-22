import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Code2,
  Globe2,
  HandHeart,
  Home,
  Mail,
  MessageCircle,
  Network,
  Newspaper,
  Plane,
  Play,
  type LucideIcon,
  UsersRound,
  Video,
  Wrench,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { useLanguage } from "@/lib/language";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/** Recognizable Kaaba line icon for Umrah, drawn with the same geometry and stroke treatment as Lucide. */
function KaabaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="m4 7 8-3 8 3v12l-8 2-8-2Z" />
      <path d="m4 7 8 3 8-3M12 10v11" />
      <path d="M4 11.25 12 14l8-2.75" />
      <path d="M7.25 8.2v3.9M16.75 8.2v3.9" />
      <path d="M8.75 19.8v-4.2l3.25.95v4.05" />
    </svg>
  );
}

type IconType = ComponentType<{ className?: string }>;

import appIconAsset from "@/assets/bangis-app-icon.png.asset.json";
import communityImageAsset from "@/assets/bangis-official-community.webp.asset.json";
import portraitAsset from "@/assets/bangis-official-hero.webp.asset.json";
import heroImage from "@/assets/global-city-hero.webp";
import resortImage from "@/assets/resort-concept.webp";
import businessImage from "@/assets/business-website.webp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  aboutFacts,
  blogPosts,
  businessCategories,
  dashboardPreview,
  foundationInitiatives,
  philosophyCards,
  projectCategories,
  projects,
  quickStats,
  serviceCards,
  umrahProcess,
  umrahStatuses,
} from "@/lib/site-data";

const categoryCards: Array<{ key: string; title: TranslationKey; detail: TranslationKey; href: "/services" | "/business" | "/community" | "/umrah" | "/foundation" | "/about"; icon: LucideIcon; tone: string }> = [
  { key: "web", title: "card.webDesign", detail: "card.webDesignDetail", href: "/services", icon: Code2, tone: "bg-primary" },
  { key: "business", title: "card.business", detail: "card.businessDetail", href: "/business", icon: BriefcaseBusiness, tone: "bg-brand-green" },
  { key: "community", title: "card.community", detail: "card.communityDetail", href: "/community", icon: UsersRound, tone: "bg-primary" },
  { key: "umrah", title: "nav.umrah", detail: "card.umrahDetail", href: "/umrah", icon: Plane, tone: "bg-brand-gold" },
  { key: "foundation", title: "nav.foundation", detail: "card.foundationDetail", href: "/foundation", icon: HandHeart, tone: "bg-brand-green" },
  { key: "global", title: "card.globalReach", detail: "card.globalReachDetail", href: "/about", icon: Globe2, tone: "bg-brand-ink" },
];

const quickActions: Array<{
  label: TranslationKey;
  href: "/" | "/services" | "/projects" | "/blog" | "/umrah" | "/foundation" | "/community";
  icon: IconType;
}> = [
  { label: "nav.home", href: "/", icon: Home },
  { label: "nav.services", href: "/services", icon: Wrench },
  { label: "nav.projects", href: "/projects", icon: BriefcaseBusiness },
  { label: "nav.blog", href: "/blog", icon: Newspaper },
  { label: "nav.umrah", href: "/umrah", icon: KaabaIcon },
  { label: "nav.foundation", href: "/foundation", icon: HandHeart },
  { label: "nav.community", href: "/community", icon: UsersRound },
];

export function HeroSection({ content, location = "Abuja, Nigeria", globalStatus = "Working globally" }: { content?: { eyebrow?: string | undefined; title?: string | undefined; subtitle?: string | undefined; description?: string | undefined; primaryCta?: string | undefined; secondaryCta?: string | undefined } | undefined; location?: string; globalStatus?: string }) {
  const { t, language } = useLanguage();
  // Short payload labels (eyebrow and buttons) are not part of the translatable CMS fields,
  // so outside English the reviewed dictionary wording is used instead of the English payload.
  const label = (value: string | undefined, key: Parameters<typeof t>[0]) => (language === "en" ? value ?? t(key) : t(key));
  return (
    <section className="relative isolate overflow-hidden bg-brand-ink text-primary-foreground">
      <div className="absolute inset-0 -z-10 workspace-grid opacity-30" />
      <div className="mx-auto grid max-w-7xl items-center gap-9 px-4 py-10 sm:px-6 sm:py-14 lg:min-h-[650px] lg:grid-cols-[minmax(0,1fr)_minmax(420px,.82fr)] lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase text-brand-cyan">{label(content?.eyebrow, "home.heroEyebrow")}</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-[1.02] sm:text-5xl lg:text-7xl">
            {content?.title ?? <>{t("home.heroTitleLine1")}<br /><span className="text-brand-cyan">{t("home.heroTitleLine2")}</span></>}
          </h1>
          <p className="mt-5 max-w-xl font-display text-xl font-bold leading-tight sm:text-2xl lg:text-3xl">
            {content?.subtitle ?? t("home.heroSubtitle")}
          </p>
          <p className="mt-5 max-w-lg text-sm leading-6 text-primary-foreground/80">{content?.description ?? t("home.heroDescription")}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button className="h-12 bg-brand-cyan px-7 text-brand-ink shadow-glow hover:bg-brand-cyan-soft" asChild><Link to="/contact">{label(content?.primaryCta, "common.hireMe")} <ArrowRight /></Link></Button>
            <Button variant="outline" className="h-12 border-primary-foreground/35 bg-brand-ink/30 px-7 text-primary-foreground hover:bg-primary-foreground/10" asChild><Link to="/projects">{label(content?.secondaryCta, "common.exploreWork")}</Link></Button>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-lg border border-primary-foreground/15 bg-card/5 p-1 shadow-platform">
          <img src={portraitAsset.url} alt="Abubakar Alhaji Abubakar at his BangisKebbi.com workspace" width={1254} height={1254} fetchPriority="high" className="aspect-square h-auto w-full rounded-md object-contain" />
          <div className="absolute bottom-4 right-4 rounded-md border border-primary-foreground/20 bg-brand-ink/90 px-4 py-3 text-xs backdrop-blur">
             <p className="font-bold">{location}</p><p className="mt-1 text-primary-foreground/70">{globalStatus}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function QuickActionsSection() {
  const { t } = useLanguage();
  return (
    <section className="border-y border-primary-foreground/10 bg-brand-ink text-primary-foreground" aria-label={t("nav.quickAccess")}>
      <nav className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-5 lg:px-8" aria-label={t("nav.quickLinks")}>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3">
          {quickActions.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              aria-label={t(item.label)}
              activeOptions={{ exact: item.href === "/" }}
              activeProps={{ className: "border-brand-cyan bg-brand-cyan/15 text-brand-cyan shadow-glow" }}
              inactiveProps={{ className: "border-primary-foreground/15 bg-primary-foreground/5 text-primary-foreground hover:border-brand-cyan/55 hover:bg-primary-foreground/10 hover:text-brand-cyan" }}
              className="group flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-lg border px-1 py-3 text-center transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink active:scale-[0.98] sm:min-h-24 sm:px-2"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary-foreground/10 transition group-hover:bg-brand-cyan/15 sm:h-10 sm:w-10">
                <item.icon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" aria-hidden="true" />
              </span>
              <span className="w-full text-[10px] font-bold leading-tight sm:text-xs">{t(item.label)}</span>
            </Link>
          ))}
        </div>
      </nav>
    </section>
  );
}

export function PlatformIntroduction({ title, description }: { title?: string | undefined; description?: string | undefined } = {}) {
  const { t } = useLanguage();
  return (
    <section className="border-b border-border bg-background py-9 sm:py-11">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase text-primary">{t("home.introEyebrow")}</p>
          <h2 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">{title ?? t("home.introTitle")}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{description ?? t("home.introDescription")}</p>
        </div>
        <Button variant="outline" asChild><Link to="/about">{t("home.aboutCta")} <ArrowRight /></Link></Button>
      </div>
    </section>
  );
}

export function PillarsSection() {
  const { t } = useLanguage();
  return (
    <section className="relative z-10 border-b border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:-mt-8 lg:grid-cols-6 lg:rounded-lg lg:bg-card lg:px-5 lg:shadow-platform">
        {categoryCards.map((item) => (
          <Link key={item.key} to={item.href} className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md border border-border bg-card p-3 transition hover:-translate-y-0.5 hover:border-brand-cyan/50 hover:shadow-platform">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${item.tone} ${item.key === "umrah" ? "text-brand-ink" : "text-primary-foreground"}`}><item.icon className="h-5 w-5" /></span>
            <span className="min-w-0"><strong className="block truncate text-sm text-foreground">{t(item.title)}</strong><span className="block truncate text-[11px] text-muted-foreground">{t(item.detail)}</span></span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function AboutPreview({ title, description }: { title?: string | undefined; description?: string | undefined } = {}) {
  const { t } = useLanguage();
  const facts: TranslationKey[] = ["about.fact1", "about.fact2", "about.fact3", "about.fact4"];
  return (
    <SectionShell eyebrow={t("about.eyebrow")} title={title ?? t("about.title")} description={description ?? t("about.description")}>
      <div className="grid gap-7 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div className="relative min-h-[330px] overflow-hidden rounded-lg bg-secondary">
          <div className="absolute left-5 top-5 h-16 w-16 bg-[radial-gradient(circle,var(--brand-cyan)_2px,transparent_2px)] bg-[length:12px_12px] opacity-70" />
          <img src={portraitAsset.url} alt={t("about.portraitAlt")} loading="lazy" width={720} height={900} className="absolute bottom-0 left-0 h-[92%] w-[68%] object-contain object-bottom" />
          <blockquote className="absolute bottom-8 right-4 max-w-[48%] rounded-md bg-card p-4 text-xs leading-5 text-muted-foreground shadow-platform">{t("about.quote")}</blockquote>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {facts.map((fact) => <div key={fact} className="flex gap-3 rounded-md border border-border bg-card p-4"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" /><p className="text-sm font-semibold">{t(fact)}</p></div>)}
          <div className="sm:col-span-2 flex flex-wrap gap-3 pt-2"><Button asChild><Link to="/about">{t("common.workWithMe")} <ArrowRight /></Link></Button><Button variant="outline" asChild><Link to="/contact">{t("common.letsConnect")}</Link></Button></div>
        </div>
      </div>
    </SectionShell>
  );
}

export function ServicesSection({ full = false, items }: { full?: boolean; items?: Array<{ id: string; title: string; summary: string | null }> | undefined }) {
  const { t } = useLanguage();
  const visibleServices = items?.length ? items.map((item, index) => ({ title: item.title, description: item.summary ?? t("home.serviceFallback"), icon: serviceCards[index % serviceCards.length]?.icon ?? Code2 })) : serviceCards;
  return (
    <SectionShell eyebrow={t("home.servicesEyebrow")} title={t("home.servicesTitle")} description={t("home.servicesDescription")} action={!full ? { label: t("common.viewAllServices"), href: "/services" } : undefined}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {visibleServices.map((service) => <FeatureCard key={service.title} icon={service.icon} title={service.title} description={service.description} action={t("common.learnMore")} href="/services" />)}
      </div>
    </SectionShell>
  );
}

const projectImages = [heroImage, resortImage, businessImage];
export function ProjectsSection({ full = false, items }: { full?: boolean; items?: Array<{ id: string; slug: string; title: string; summary: string | null; payload: unknown }> | undefined }) {
  const { t } = useLanguage();
  const visibleProjects = items?.length ? items.map((item) => ({ slug: item.slug, name: item.title, category: typeof item.payload === "object" && item.payload && !Array.isArray(item.payload) && typeof (item.payload as Record<string, unknown>)["category"] === "string" ? String((item.payload as Record<string, unknown>)["category"]) : t("home.projectFallbackCategory"), description: item.summary ?? t("home.projectFallbackSummary") })) : projects;
  return (
    <SectionShell eyebrow={t("home.projectsEyebrow")} title={t("home.projectsTitle")} description={t("home.projectsDescription")} action={!full ? { label: t("common.viewAllProjects"), href: "/projects" } : undefined}>
      {full && <div className="mb-5 flex flex-wrap gap-2">{projectCategories.map((category) => <Badge key={category} variant="outline">{category}</Badge>)}</div>}
      <div className="grid gap-4 md:grid-cols-3">
        {visibleProjects.map((project, index) => (
          <article key={project.slug} className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-platform">
            <div className="relative aspect-[16/9] overflow-hidden bg-brand-ink">
              <img src={projectImages[index] ?? heroImage} alt="" loading="lazy" width={1200} height={750} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              {index === 0 && <img src={appIconAsset.url} alt="BangisKebbi.com" loading="lazy" className="absolute left-5 top-5 h-14 w-14 rounded-lg" />}
            </div>
            <div className="p-5"><h3 className="font-display text-lg font-bold">{project.name}</h3><p className="mt-1 text-xs font-semibold text-primary">{project.category}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description}</p><Button variant="link" className="mt-2 px-0" asChild><Link to={index === 0 ? "/projects/bangiskebbi-com" : "/projects"}>{t("common.viewProject")} <ArrowRight /></Link></Button></div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

export function BusinessSection({ title, description }: { title?: string | undefined; description?: string | undefined } = {}) {
  const { t } = useLanguage();
  return (
    <SectionShell eyebrow={t("business.eyebrow")} title={title ?? t("business.title")} description={description ?? t("business.description")}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{businessCategories.map((item) => <FeatureCard key={item.title} icon={item.icon} title={item.title} description={t("business.cardDetail")} />)}</div>
    </SectionShell>
  );
}

export function UmrahSection({ title, description }: { title?: string | undefined; description?: string | undefined } = {}) {
  const { t } = useLanguage();
  return (
    <CompactPlatform icon={Plane} eyebrow={t("umrah.previewEyebrow")} title={title ?? t("umrah.previewTitle")} description={description ?? t("umrah.previewDescription")} href="/umrah" action={t("umrah.previewAction")} tone="gold" />
  );
}

export function FoundationSection({ title, description }: { title?: string | undefined; description?: string | undefined } = {}) {
  const { t } = useLanguage();
  return (
    <CompactPlatform icon={HandHeart} eyebrow={t("foundation.previewEyebrow")} title={title ?? t("foundation.previewTitle")} description={description ?? t("foundation.previewDescription")} href="/foundation" action={t("foundation.previewAction")} tone="green" />
  );
}

export function CommunitySection({ title, description }: { title?: string | undefined; description?: string | undefined } = {}) {
  const { t } = useLanguage();
  const words: TranslationKey[] = ["word.learn", "word.connect", "word.build", "word.support", "word.grow"];
  return (
    <section className="section-reveal border-b border-border bg-secondary py-10 sm:py-12">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 sm:px-6 md:grid-cols-[minmax(0,.72fr)_minmax(0,1fr)] md:items-center lg:px-8">
        <img src={communityImageAsset.url} alt="BangisKebbi.com community and global platform identity" loading="lazy" width={1254} height={1254} className="mx-auto aspect-square w-full max-w-[390px] rounded-full object-contain shadow-platform" />
        <div>
          <p className="text-xs font-bold uppercase text-primary">{t("community.previewEyebrow")}</p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{title ?? t("community.previewTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description ?? t("community.previewDescription")}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
            {words.map((word) => <span key={word} className="rounded-full border border-border bg-card px-3 py-1.5">{t(word)}</span>)}
          </div>
          <Button className="mt-6" asChild><Link to="/register">{t("common.join")} <ArrowRight /></Link></Button>
        </div>
      </div>
    </section>
  );
}

const activityCards: Array<{ title: TranslationKey; detail: TranslationKey; image: string }> = [
  { title: "home.activity1", detail: "home.activity1Detail", image: businessImage },
  { title: "home.activity2", detail: "home.activity2Detail", image: communityImageAsset.url },
  { title: "home.activity3", detail: "home.activity3Detail", image: resortImage },
];

export function LatestActivitiesSection() {
  const { t } = useLanguage();
  return (
    <SectionShell eyebrow={t("home.activitiesEyebrow")} title={t("home.activitiesTitle")} description={t("home.activitiesDescription")} action={{ label: t("common.viewUpdates"), href: "/blog" }}>
      <div className="grid gap-4 md:grid-cols-3">
        {activityCards.map((activity) => (
          <article key={activity.title} className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="relative aspect-video overflow-hidden bg-brand-ink">
              <img src={activity.image} alt="" loading="lazy" width={800} height={450} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
              <span className="absolute inset-0 grid place-items-center bg-brand-ink/25"><span className="grid h-12 w-12 place-items-center rounded-full bg-background/90 text-primary shadow-platform"><Play className="ml-0.5 h-5 w-5" /></span></span>
              <Badge className="absolute left-3 top-3 bg-brand-ink/90 text-primary-foreground"><Video /> {t("home.videoSoon")}</Badge>
            </div>
            <div className="p-4"><h3 className="font-display text-base font-bold">{t(activity.title)}</h3><p className="mt-1 text-sm text-muted-foreground">{t(activity.detail)}</p></div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

export function BlogPreview({ items }: { items?: Array<{ id: string; title: string; summary: string | null; payload: unknown }> | undefined }) {
  const { t } = useLanguage();
  const visiblePosts = items?.length ? items.slice(0, 3).map((item) => ({ title: item.title, category: typeof item.payload === "object" && item.payload && !Array.isArray(item.payload) && typeof (item.payload as Record<string, unknown>)["category"] === "string" ? String((item.payload as Record<string, unknown>)["category"]) : t("blog.updateLabel") })) : blogPosts;
  return (
    <SectionShell eyebrow={t("home.blogEyebrow")} title={t("home.blogTitle")} description={t("home.blogDescription")} action={{ label: t("common.viewAllPosts"), href: "/blog" }}>
      <div className="grid gap-4 md:grid-cols-3">{visiblePosts.map((post, index) => <article key={post.title} className="grid grid-cols-[96px_minmax(0,1fr)] overflow-hidden rounded-lg border border-border bg-card"><img src={projectImages[index]} alt="" loading="lazy" width={1200} height={750} className="h-full min-h-32 w-24 object-cover" /><div className="p-4"><p className="text-xs font-bold text-primary">{post.category}</p><h3 className="mt-1 font-display text-base font-bold leading-tight">{post.title}</h3><Button variant="link" className="mt-2 h-auto px-0 text-xs" asChild><Link to="/blog">{t("common.readMore")} <ArrowRight /></Link></Button></div></article>)}</div>
    </SectionShell>
  );
}

export function ContactSection() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden bg-brand-ink py-12 text-primary-foreground">
      <div className="absolute inset-0 workspace-grid opacity-35" />
      <div className="relative mx-auto grid max-w-7xl gap-7 px-4 text-center sm:px-6 lg:px-8">
        <div><p className="text-xs font-bold uppercase text-brand-cyan">{t("home.contactEyebrow")}</p><h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{t("home.contactTitle")}</h2><p className="mx-auto mt-3 max-w-2xl text-sm text-primary-foreground/75">{t("home.contactDescription")}</p></div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row"><Button className="bg-background text-foreground hover:bg-secondary" asChild><Link to="/contact">{t("common.contactMe")} <ArrowRight /></Link></Button><Button className="bg-brand-cyan text-brand-ink hover:bg-brand-cyan-soft" asChild><Link to="/register"><UsersRound /> {t("home.joinCommunity")}</Link></Button><Button variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" asChild><Link to="/contact"><MessageCircle /> {t("common.whatsapp")}</Link></Button><Button variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" asChild><Link to="/contact"><Mail /> {t("common.email")}</Link></Button></div>
      </div>
    </section>
  );
}

export function DashboardPreviewSection() {
  const { t } = useLanguage();
  return <SectionShell eyebrow={t("home.memberEyebrow")} title={t("home.memberTitle")} description={t("home.memberDescription")}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{dashboardPreview.map((item) => <FeatureCard key={item.label} icon={item.icon} title={item.label} description={item.value} />)}</div></SectionShell>;
}

export function TestimonialsPlaceholder() { return null; }

export function SectionShell({ eyebrow, title, description, action, children }: { eyebrow: string; title: string; description?: string | undefined; action?: { label: string; href: "/services" | "/projects" | "/blog" } | undefined; children: ReactNode }) {
  return (
    <section className="section-reveal border-b border-border bg-background py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4"><div className="min-w-0"><p className="text-xs font-bold uppercase text-primary">{eyebrow}</p><h2 className="mt-2 max-w-3xl font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">{title}</h2>{description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action && <Button variant="outline" className="hidden shrink-0 sm:inline-flex" asChild><Link to={action.href}>{action.label} <ArrowRight /></Link></Button>}</div>
        {children}
        {action && <Button variant="outline" className="mt-6 w-full sm:hidden" asChild><Link to={action.href}>{action.label} <ArrowRight /></Link></Button>}
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description, action, href }: { icon: LucideIcon; title: string; description: string; action?: string; href?: "/services" }) {
  return <article className="h-full rounded-lg border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-cyan/40 hover:shadow-platform"><span className="grid h-10 w-10 place-items-center rounded-md bg-brand-cyan/10 text-primary"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-display text-base font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>{action && href && <Button variant="link" className="mt-3 h-auto px-0 text-xs" asChild><Link to={href}>{action} <ArrowRight /></Link></Button>}</article>;
}

function CompactPlatform({ icon: Icon, eyebrow, title, description, href, action, tone }: { icon: LucideIcon; eyebrow: string; title: string; description: string; href: "/umrah" | "/foundation" | "/register"; action: string; tone: "gold" | "green" | "blue" }) {
  const colors = tone === "gold" ? "bg-brand-gold/15 text-brand-gold" : tone === "green" ? "bg-brand-green/10 text-brand-green" : "bg-brand-cyan/10 text-primary";
  return <section className="border-b border-border bg-background py-5"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="grid gap-5 rounded-lg border border-border bg-card p-5 shadow-sm md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"><span className={`grid h-16 w-16 place-items-center rounded-full ${colors}`}><Icon className="h-8 w-8" /></span><div className="min-w-0"><p className="text-xs font-bold uppercase text-primary">{eyebrow}</p><h2 className="mt-1 font-display text-xl font-bold">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p></div><Button variant="outline" className="shrink-0" asChild><Link to={href}>{action} <ArrowRight /></Link></Button></div></div></section>;
}
