import { Link } from "@tanstack/react-router";
import { useSiteLayout, useSiteText } from "@/lib/use-site-layout";
import {
  Pointer,
  ArrowRight,
  Cpu,
  MapPin,
  Blocks,
  ChevronLeft,
  ChevronRight,
  BriefcaseBusiness,
  Building2,
  Code2,
  Globe2,
  FileText,
  FolderKanban,
  Handshake,
  HandHeart,
  Linkedin,
  Mail,
  MessageCircle,
  Network,
  Newspaper,
  Megaphone,
  Plane,
  Play,
  Pause,
  Quote,
  ShieldCheck,
  Sprout,
  TrendingUp,
  HeartHandshake,
  type LucideIcon,
  UsersRound,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { useLanguage } from "@/lib/language";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { services as portfolioServices, text } from "@/lib/portfolio-content";
import { SafeImage } from "@/components/safe-image";
import { useContactLinks } from "@/components/contact-actions";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPublicSocialLinks } from "@/lib/social.functions";
import { socialIcons, platformLabels } from "@/components/social-icons";

import appIconAssetSrc from "@/assets/bangis-app-icon.png";
const appIconAsset = { url: appIconAssetSrc };
import communityImageAssetSrc from "@/assets/bangis-official-community.webp";
const communityImageAsset = { url: communityImageAssetSrc };
import portraitAssetSrc from "@/assets/bangis-official-hero.webp";
const portraitAsset = { url: portraitAssetSrc };
import digitalSolutionsHero from "@/assets/hero-digital-solutions.jpg";
import communitySupportHero from "@/assets/hero-community-support.jpg";
import communitySupportBanner from "@/assets/homepage-community-support-banner.png";
import umrahSupportHero from "@/assets/hero-umrah-support.jpg";
import businessDigitalServices from "@/assets/business-digital-services.webp";
import businessNetworking from "@/assets/business-networking.webp";
import businessTechnology from "@/assets/business-technology.webp";
import businessCommunity from "@/assets/business-community.webp";
import businessGlobalOpportunities from "@/assets/business-global-opportunities.webp";
import heroImage from "@/assets/global-city-hero.webp";
import resortImage from "@/assets/resort-concept.webp";
import businessImage from "@/assets/business-website.webp";
import shortcutWebAi from "@/assets/shortcuts/shortcut-web-ai.webp";
import shortcutUmrah from "@/assets/shortcuts/shortcut-umrah.webp";
import shortcutBusiness from "@/assets/shortcuts/shortcut-business.webp";
import shortcutCommunity from "@/assets/shortcuts/shortcut-community.webp";
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
  quickStats,
  serviceCards,
  umrahProcess,
  umrahStatuses,
} from "@/lib/site-data";

const categoryCards: Array<{ key: string; title: TranslationKey; detail: TranslationKey; href: "/services" | "/business" | "/community" | "/umrah"; icon: LucideIcon; tone: string }> = [
  { key: "web", title: "card.webDesignAi", detail: "card.webDesignAiDetail", href: "/services", icon: Cpu, tone: "platform-card-cyan" },
  { key: "umrah", title: "nav.umrah", detail: "card.umrahDetail", href: "/umrah", icon: Plane, tone: "platform-card-gold" },
  { key: "business", title: "card.business", detail: "card.businessDetail", href: "/business", icon: BriefcaseBusiness, tone: "platform-card-green" },
  { key: "community", title: "card.community", detail: "card.communityDetail", href: "/community", icon: UsersRound, tone: "platform-card-cyan" },
];

const shortcutIcons: Record<string, string> = { web: shortcutWebAi, umrah: shortcutUmrah, business: shortcutBusiness, community: shortcutCommunity };

import miniAiWebDesign from "@/assets/service-mini/ai-web-design.webp";
import miniWebDevelopment from "@/assets/service-mini/web-development.webp";
import miniUiUx from "@/assets/service-mini/ui-ux-design.webp";
import miniWordpress from "@/assets/service-mini/wordpress-development.webp";
import miniBusiness from "@/assets/service-mini/digital-business-solutions.webp";
import miniMaintenance from "@/assets/service-mini/website-maintenance.webp";
const serviceMinis: Record<string, string> = { "ai-web-design": miniAiWebDesign, "web-development": miniWebDevelopment, "ui-ux-design": miniUiUx, "wordpress-development": miniWordpress, "digital-business-solutions": miniBusiness, "website-maintenance": miniMaintenance };
const serviceMiniOrder = [miniAiWebDesign, miniWebDevelopment, miniUiUx, miniWordpress, miniBusiness, miniMaintenance];

const serviceSubtitles: Record<string, { en: string; ar: string; ha: string }> = {
  "ai-web-design": { en: "Modern, responsive websites.", ar: "مواقع حديثة ومتجاوبة.", ha: "Gidajen yanar gizo na zamani masu daidaituwa." },
  "web-development": { en: "Custom websites and apps.", ar: "مواقع وتطبيقات مخصصة.", ha: "Gidajen yanar gizo da manhajoji na musamman." },
  "ui-ux-design": { en: "Clear, accessible experiences.", ar: "تجارب واضحة وسهلة الوصول.", ha: "Kwarewa bayyananniya kuma mai sauƙin amfani." },
  "wordpress-development": { en: "Easy-to-manage websites.", ar: "مواقع سهلة الإدارة.", ha: "Gidajen yanar gizo masu sauƙin gudanarwa." },
  "digital-business-solutions": { en: "Practical systems for growth.", ar: "أنظمة عملية للنمو.", ha: "Tsare-tsare masu amfani don bunƙasa." },
  "website-maintenance": { en: "Updates, monitoring and support.", ar: "تحديثات ومتابعة ودعم.", ha: "Sabuntawa, sa ido da tallafi." },
};

type QuickActionManagedItem = { slug: string; imageUrl?: string | null; image_alt?: string | null; sort_order: number };

type HeroSlideInput = { src: string; alt: string; label: string; slot?: number; fallbackSrc?: string };

export function HeroSection({ intervalSeconds = 3, transitionMs = 1100, content, slides, location = "Kebbi State, Nigeria", globalStatus = "Working globally" }: { content?: { eyebrow?: string | undefined; title?: string | undefined; subtitle?: string | undefined; description?: string | undefined; primaryCta?: string | undefined; secondaryCta?: string | undefined } | undefined; slides?: HeroSlideInput[]; location?: string; globalStatus?: string; intervalSeconds?: number; transitionMs?: number }) {
  const { t } = useLanguage();
  return (
    <section className="relative isolate overflow-hidden bg-brand-ink text-primary-foreground">
      <HeroCarousel
        slides={slides}
        location={/abuja/i.test(location) ? "Kebbi State, Nigeria" : location}
        globalStatus={globalStatus}
        intervalMs={Math.min(30, Math.max(1, intervalSeconds)) * 1000}
        transitionMs={transitionMs}
        eyebrow={t("home.heroAccent")}
        subtitle={content?.subtitle ?? t("home.heroBusinessSubtitle")}
        primaryCta={t("common.viewMyWork")}
        secondaryCta={t("common.discussProject")}
      />
    </section>
  );
}

const fallbackHeroSlides: HeroSlideInput[] = [
  { src: digitalSolutionsHero, alt: "Abubakar Alhaji Abubakar collaborating with a professional web development team", label: "Digital Solutions / Web Development" },
  { src: communitySupportHero, alt: "Abubakar Alhaji Abubakar participating in dignified community support", label: "BK Foundation" },
  { src: umrahSupportHero, alt: "Abubakar Alhaji Abubakar supporting a community group in a respectful Umrah setting", label: "Umrah Support Program" },
];

function HeroCarousel({ intervalMs, transitionMs, slides, location, globalStatus, primaryCta, secondaryCta }: { slides?: HeroSlideInput[] | undefined; location: string; globalStatus: string; eyebrow: string; subtitle: string; primaryCta: string; secondaryCta: string; intervalMs: number; transitionMs: number }) {
  const t = useSiteText();
  const eyebrow = t("home.heroAccent");
  const subtitle = t("home.heroBusinessSubtitle");
  const shortLocation = location.replace(/\s*State\b/i, "");
  const heroSlides = slides?.length ? slides.slice(0, 8) : fallbackHeroSlides;
  const [active, setActive] = useState(0);
  const [readySlides, setReadySlides] = useState(() => new Set([0]));
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const reducedMotion = useRef(false);
  useEffect(() => { reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);
  const move = useCallback((step: number) => setActive((current) => {
    const next = (current + step + heroSlides.length) % heroSlides.length;
    setReadySlides((ready) => new Set(ready).add(next));
    return next;
  }), [heroSlides.length]);
  // Keep the first visual as the only initial hero request. Load the remaining slides after
  // the first viewport has settled, well before the automatic transition.
  useEffect(() => {
    const timer = window.setTimeout(() => setReadySlides(new Set(heroSlides.map((_, index) => index))), 900);
    return () => window.clearTimeout(timer);
  }, [heroSlides.length]);
  useEffect(() => {
    if (paused || reducedMotion.current) return;
    const timer = window.setInterval(() => move(1), intervalMs);
    return () => window.clearInterval(timer);
  }, [move, paused, intervalMs]);
  return (
    <div style={{ ["--hero-fade" as string]: `${transitionMs}ms` }} className="hero-stage relative w-full overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)} onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => { const end = event.changedTouches[0]?.clientX; if (touchStart.current !== null && end !== undefined && Math.abs(end - touchStart.current) > 45) move(end < touchStart.current ? 1 : -1); touchStart.current = null; }} aria-roledescription="carousel" aria-label="BangisKebbi.com highlights">
      {heroSlides.map((slide, index) => (
        <figure key={`${index}-${slide.src}`} aria-hidden={active !== index} className={`hero-slide absolute inset-0 ${active === index ? "hero-slide-active" : ""}`}>
          {readySlides.has(index) ? <SafeImage src={slide.src} {...(slide.fallbackSrc ? { fallbackSrc: slide.fallbackSrc } : {})} alt={active === index ? slide.alt : ""} width={1264} height={848} fetchPriority={index === 0 ? "high" : "low"} loading={index === 0 ? "eager" : "lazy"} decoding="async" className="hero-slide-image h-full w-full object-cover object-center" /> : null}
        </figure>
      ))}
      <div className="pointer-events-none absolute inset-0 z-10 hero-reference-overlay" />
      <div className="pointer-events-none absolute inset-0 z-10 workspace-grid opacity-25" />
      <div className="relative z-20 mx-auto flex max-w-7xl items-end px-5 pb-12 pt-24 sm:px-20 sm:pb-16 sm:pt-36 lg:min-h-[560px] lg:items-center lg:px-16 lg:py-16 xl:px-20">
        <div className="hero-copy-enter min-w-0 max-w-[640px] lg:w-[58%]">
          <p className="inline-flex rounded-full border border-brand-cyan/60 bg-brand-ink/40 px-3 py-1 text-xs font-bold text-brand-cyan backdrop-blur sm:text-sm">{eyebrow}</p>
          <h1 className="mt-3 font-display text-[2rem] font-extrabold leading-[1.08] sm:text-5xl xl:text-6xl">
            <span className="hero-line hero-line-1 block text-primary-foreground">{t("home.heroBusinessTitleTop")}</span>
            <span className="hero-line hero-line-2 hero-title-b block">{t("home.heroBusinessTitleBottom")}</span>
          </h1>
          <p className="hero-line hero-line-3 mt-3 max-w-xl text-sm font-medium leading-6 text-primary-foreground/85 sm:mt-4 sm:text-lg sm:leading-7">{subtitle}</p>
          <p className="hero-location mt-3 flex items-center gap-2 text-sm text-primary-foreground/85 sm:mt-4 sm:text-base"><MapPin className="size-4 shrink-0 text-primary-foreground" aria-hidden="true" /><span>{shortLocation} <span aria-hidden="true">•</span> {globalStatus}</span></p>
          <div className="hero-cta-enter mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:flex sm:gap-3">
            <Button className="h-auto min-h-12 whitespace-normal bg-brand-cyan px-3 py-2 text-center text-sm leading-tight text-brand-ink shadow-glow hover:bg-brand-cyan-soft sm:min-h-14 sm:px-9 sm:text-base" asChild><Link to="/projects">{primaryCta} <ArrowRight className="rtl:rotate-180" /></Link></Button>
            <Button variant="outline" className="h-auto min-h-12 whitespace-normal border-primary-foreground/40 bg-brand-ink/45 px-3 py-2 text-center text-sm leading-tight text-primary-foreground backdrop-blur hover:bg-primary-foreground/10 sm:min-h-14 sm:px-9 sm:text-base" asChild><Link to="/contact">{secondaryCta}</Link></Button>
          </div>
        </div>
      </div>
      <Button type="button" variant="outline" size="icon" onClick={() => move(-1)} className="absolute left-1 top-1/2 z-30 hidden sm:inline-flex -translate-y-1/2 border-primary-foreground/30 bg-brand-ink/75 text-primary-foreground backdrop-blur hover:bg-brand-ink sm:left-4" aria-label="Previous hero slide"><ChevronLeft /></Button>
      <Button type="button" variant="outline" size="icon" onClick={() => move(1)} className="absolute right-1 top-1/2 z-30 hidden sm:inline-flex -translate-y-1/2 border-primary-foreground/30 bg-brand-ink/75 text-primary-foreground backdrop-blur hover:bg-brand-ink sm:right-4" aria-label="Next hero slide"><ChevronRight /></Button>
      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-0.5" aria-label="Choose hero slide">{heroSlides.map((slide, index) => <Button key={`${index}-${slide.src}`} type="button" variant="ghost" size="icon" onClick={() => { setReadySlides((ready) => new Set(ready).add(index)); setActive(index); }} className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10" aria-label={`Show slide ${index + 1}: ${slide.label}`} aria-current={active === index ? "true" : undefined}><span className={`h-1.5 rounded-full transition-all ${active === index ? "w-8 bg-brand-cyan" : "w-5 bg-primary-foreground/45"}`} /></Button>)}</div>
    </div>
  );
}

export function QuickActionsSection() {
  const { t } = useLanguage();
  return (
    <section className="platform-card-band border-y border-primary-foreground/10 bg-brand-ink text-primary-foreground" aria-label={t("nav.quickAccess")}>
      <nav className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8" aria-label={t("nav.quickLinks")}>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
          {categoryCards.map((item) => <Link key={item.key} to={item.href} className="shortcut-card group flex min-w-0 flex-col items-center rounded-xl border border-brand-cyan/35 bg-primary-foreground/[0.05] px-2 py-3 text-center backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-brand-cyan/70 hover:bg-primary-foreground/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan active:scale-[0.98] sm:px-3 sm:py-4">
            <span className={`shortcut-icon grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg sm:size-14 ${item.tone}`}><img src={shortcutIcons[item.key]} alt="" width={200} height={200} loading="lazy" className="size-full object-contain p-1" /></span>
            <strong className="mt-2 block font-display text-sm font-bold leading-tight sm:text-base">{t(item.title)}</strong>
            <span className="mt-0.5 block text-xs leading-4 text-primary-foreground/70 sm:text-sm">{t(item.detail)}</span>
            <span className="mt-1.5 inline-flex min-h-6 items-center gap-1 text-xs font-semibold text-brand-cyan sm:text-sm">{t("common.viewMore")} <ArrowRight className="shortcut-arrow size-3.5 rtl:rotate-180" aria-hidden="true" /></span>
          </Link>)}
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

type AboutManagedItem = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  imageUrl?: string | null;
  image_alt?: string | null;
  sort_order: number;
};

type AboutCardDisplay = {
  slug: string;
  title: string;
  text: string;
  icon: LucideIcon;
  tone: string;
  imageUrl?: string | null;
  imageAlt?: string;
};

export function AboutPreview({ title, description, items }: { title?: string | undefined; description?: string | undefined; items?: AboutManagedItem[] | undefined } = {}) {
  const { t } = useLanguage();
  const fallbackCards: AboutCardDisplay[] = [
    { slug: "about-card-1", title: t("about.card1Title"), text: t("about.card1Text"), icon: Blocks, tone: "bg-brand-cyan/10 text-primary" },
    { slug: "about-card-2", title: t("about.card2Title"), text: t("about.card2Text"), icon: Handshake, tone: "bg-brand-green/10 text-brand-green" },
    { slug: "about-card-3", title: t("about.card3Title"), text: t("about.card3Text"), icon: Globe2, tone: "bg-brand-gold/15 text-brand-gold" },
    { slug: "about-card-4", title: t("about.card4Title"), text: t("about.card4Text"), icon: TrendingUp, tone: "bg-primary/10 text-primary" },
  ];
  const defaultCard = fallbackCards[0] ?? { slug: "about-card-1", title: t("about.card1Title"), text: t("about.card1Text"), icon: Blocks, tone: "bg-brand-cyan/10 text-primary" };
  const managedCards = items?.filter((item) => /^about-card-[1-4]$/.test(item.slug)).sort((a, b) => a.sort_order - b.sort_order) ?? [];
  const cards = managedCards.length
    ? managedCards.map((item) => {
      const fallback = fallbackCards.find((card) => card.slug === item.slug) ?? defaultCard;
      return { ...fallback, title: item.title, text: item.summary ?? fallback.text, imageUrl: item.imageUrl, imageAlt: item.image_alt ?? item.title };
    })
    : fallbackCards;
  const managedQuote = items?.find((item) => item.slug === "about-quote");
  const hasManagedAbout = Boolean(items?.some((item) => /^about-(?:card-[1-4]|quote)$/.test(item.slug)));
  const quote = managedQuote?.title ?? (!hasManagedAbout ? t("about.quote") : null);
  return (
    <SectionShell eyebrow={t("about.eyebrow")} title={title ?? t("about.title")} description={description ?? t("about.description")}>
      <div className="grid gap-7 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div className="relative min-h-[330px] overflow-hidden rounded-lg bg-secondary">
          <div className="absolute left-5 top-5 h-16 w-16 bg-[radial-gradient(circle,var(--brand-cyan)_2px,transparent_2px)] bg-[length:12px_12px] opacity-70" />
          <img src={portraitAsset.url} alt={t("about.portraitAlt")} loading="lazy" width={720} height={900} className="absolute bottom-0 left-0 h-[92%] w-[68%] object-contain object-bottom" />
          {quote ? <blockquote className="about-quote absolute bottom-8 right-4 max-w-[48%] rounded-md border border-border bg-card/95 p-4 pt-7 text-xs font-medium leading-5 text-foreground shadow-platform backdrop-blur">
            <Quote className="absolute left-4 top-[-18px] size-9 rounded-full bg-primary p-2 text-primary-foreground shadow-sm" aria-hidden="true" />
            {quote}
            <span className="mt-3 block h-1 w-10 rounded-full bg-brand-cyan" aria-hidden="true" />
          </blockquote> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
            <article key={card.slug} className="about-card motion-card group flex min-h-40 gap-4 overflow-hidden rounded-md border border-border bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-platform">
              <span className={`grid size-12 shrink-0 place-items-center overflow-hidden rounded-full ${card.tone}`}>
                {card.imageUrl ? <SafeImage src={card.imageUrl} alt={card.imageAlt} loading="lazy" width={96} height={96} className="size-full object-cover" /> : <Icon className="size-6 transition duration-300 group-hover:scale-105" aria-hidden="true" />}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold leading-5 text-foreground">{card.title}</h3>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{card.text}</p>
              </div>
            </article>
          );})}
          <div className="sm:col-span-2 flex flex-wrap gap-3 pt-2"><Button asChild><Link to="/about">{t("common.workWithMe")} <ArrowRight /></Link></Button><Button variant="outline" asChild><Link to="/contact">{t("common.letsConnect")}</Link></Button></div>
        </div>
      </div>
    </SectionShell>
  );
}

/** Seamless loop: two identical halves, the track slides by exactly one half (-50%) so the seam never shows. */
function ServiceMarquee({ titles, seconds }: { titles: string[]; seconds: number }) {
  if (!titles.length) return null;
  const run = Array.from({ length: 4 }, () => titles).flat();
  const half = (key: string) => <div className="flex shrink-0 items-center" aria-hidden={key === "b" ? true : undefined}>{run.map((title, i) => <span key={`${key}${i}`} className="flex shrink-0 items-center whitespace-nowrap px-5"><span className="me-5 size-1.5 rounded-full bg-brand-gold" aria-hidden="true" />{title}</span>)}</div>;
  return (
    <div dir="ltr" className="service-marquee mx-auto mb-6 max-w-2xl overflow-hidden rounded-xl bg-brand-ink py-3 text-[11px] font-bold uppercase leading-tight text-brand-cyan sm:text-sm" role="marquee" aria-label={titles.join(", ")}>
      <div className="service-marquee-track flex w-max" style={{ ["--marquee-duration" as string]: `${seconds}s` }}>{half("a")}{half("b")}</div>
    </div>
  );
}

export function ServicesSection({ full = false, items }: { full?: boolean; items?: Array<{ id: string; slug: string; title: string; summary: string | null; imageUrl?: string | null }> | undefined }) {
  const { t, language } = useLanguage();
  const { miniUrls, marqueeSeconds } = useSiteLayout();
  const fallbackBySlug = new Map(portfolioServices.map((item) => [item.slug, item]));
  const allServices = items?.length
    ? items.map((item, index) => {
      const fallback = fallbackBySlug.get(item.slug);
      return { slug: item.slug, title: item.title, description: item.summary ?? t("home.serviceFallback"), image: item.imageUrl ?? fallback?.image, imageAlt: fallback ? text(fallback.imageAlt, language) : item.title, icon: serviceCards[index % serviceCards.length]?.icon ?? Code2 };
    })
    : portfolioServices.map((item, index) => ({ slug: item.slug, title: text(item.title, language), description: text(item.summary, language), image: item.image, imageAlt: text(item.imageAlt, language), icon: serviceCards[index % serviceCards.length]?.icon ?? Code2 }));
  // Owner's final homepage selection: only these two services. Other services keep their detail pages.
  const HOME_SERVICES = ["wordpress-development", "website-maintenance"];
  const shownServices = full ? allServices : HOME_SERVICES.map((slug) => allServices.find((s) => s.slug === slug)).filter((s): s is (typeof allServices)[number] => Boolean(s));
  return (
    <SectionShell eyebrow={t("home.servicesEyebrow")} title={t("home.servicesTitle")} description={t("home.servicesDescription")} >
      {!full ? <ServiceMarquee titles={shownServices.map((s) => s.title)} seconds={marqueeSeconds} /> : null}
      <ul className={full ? "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6" : "mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:gap-5"}>
        {shownServices.map((service, index) => {
          const mini = miniUrls[service.slug] ?? serviceMinis[service.slug] ?? serviceMiniOrder[index % serviceMiniOrder.length];
          return <li key={service.slug} className="min-w-0"><Link to="/services/$slug" params={{ slug: service.slug }} className="motion-card group flex h-full min-h-[168px] flex-col items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-4 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-platform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <img src={mini} alt="" aria-hidden="true" loading="lazy" width={256} height={256} className="service-mini size-16 shrink-0 object-contain drop-shadow-md sm:size-20" />
            <strong className="font-display text-sm font-bold leading-5 sm:text-base">{service.title}</strong>
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-primary"><span aria-hidden="true">[</span><Pointer className="size-3.5" aria-hidden="true" />{t("common.viewMore")}<ArrowRight className="shortcut-arrow size-3.5 rtl:rotate-180" aria-hidden="true" /><span aria-hidden="true">]</span></span>
          </Link></li>;
        })}
      </ul>
    </SectionShell>
  );
}

export function ProjectsSection({ full = false, items }: { full?: boolean; items?: Array<{ id: string; slug: string; title: string; summary: string | null; category?: string | null; concept?: boolean; payload: unknown; imageUrl?: string | null; image_alt?: string | null }> | undefined }) {
  const { t } = useLanguage();
  const visibleProjects = (items ?? []).map((item) => ({ slug: item.slug, name: item.title, category: item.category ?? (typeof item.payload === "object" && item.payload && !Array.isArray(item.payload) && typeof (item.payload as Record<string, unknown>)["category"] === "string" ? String((item.payload as Record<string, unknown>)["category"]) : t("home.projectFallbackCategory")), description: item.summary ?? t("home.projectFallbackSummary"), image: item.imageUrl, imageAlt: item.image_alt ?? item.title, concept: item.concept ?? false }));
  return (
    <SectionShell eyebrow={t("home.projectsEyebrow")} title={t("home.projectsTitle")} description={t("home.projectsDescription")} action={!full ? { label: t("common.viewAllProjects"), href: "/projects" } : undefined}>
      {full && <div className="mb-5 flex flex-wrap gap-2">{projectCategories.map((category) => <Badge key={category} variant="outline">{category}</Badge>)}</div>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProjects.map((project) => (
          <article key={project.slug} className="motion-card group flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-platform">
            <Link to="/projects/$slug" params={{ slug: project.slug }} aria-label={`${t("common.viewProject")}: ${project.name}`} className="relative block aspect-[8/5] overflow-hidden bg-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              {project.image ? <SafeImage src={project.image} alt={project.imageAlt} loading="lazy" width={1536} height={960} className="size-full object-cover transition duration-500 group-hover:scale-[1.035]" /> : <span className="absolute inset-0 grid place-items-center text-primary-foreground/60"><FolderKanban className="size-10" /></span>}
            </Link>
            <div className="flex flex-1 flex-col p-5">
              {project.concept && <Badge variant="secondary" className="mb-3 w-fit">Concept / Demo</Badge>}
              <h3 className="font-display text-lg font-bold leading-6">{project.name}</h3>
              <p className="mt-1 text-xs font-semibold text-primary">{project.category}</p>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{project.description}</p>
              <Button className="mt-5 w-full font-bold" asChild><Link to="/projects/$slug" params={{ slug: project.slug }}>{t("common.viewProject")} <ArrowRight /></Link></Button>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

const businessVisuals = [businessDigitalServices, businessNetworking, businessTechnology, businessCommunity, businessGlobalOpportunities];

export function BusinessSection({ title, description, items }: { title?: string | undefined; description?: string | undefined; items?: Array<{ slug: string; title: string; summary: string | null; imageUrl?: string | null }> | undefined } = {}) {
  const { t } = useLanguage();
  const cmsBySlug = new Map(items?.map((item) => [item.slug, item]) ?? []);
  const cards = businessCategories.map((fallback, index) => {
    const slug = ["digital-services", "business-networking", "technology", "community", "global-opportunities"][index] ?? fallback.title.toLowerCase().replaceAll(" ", "-");
    const cms = cmsBySlug.get(slug);
    return { slug, title: cms?.title ?? fallback.title, description: cms?.summary ?? t("business.cardDetail"), image: cms ? cms.imageUrl : businessVisuals[index], icon: fallback.icon };
  });
  return (
    <SectionShell eyebrow={t("business.eyebrow")} title={title ?? t("business.title")} description={description ?? t("business.description")}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{cards.map((item) => <article key={item.slug} className="motion-card flex min-w-0 flex-col items-center rounded-lg border border-border bg-card p-5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-platform">
        <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary sm:size-24 lg:size-28">
          {item.image ? <SafeImage src={item.image} alt="" loading="lazy" width={816} height={816} className="size-full object-cover" /> : <item.icon className="size-9 text-primary" aria-hidden="true" />}
        </div>
        <h3 className="mt-4 font-display text-base font-bold leading-5">{item.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
      </article>)}</div>
    </SectionShell>
  );
}

export function UmrahSection({ title, description, image, imageAlt }: { title?: string | undefined; description?: string | undefined; image?: string | undefined; imageAlt?: string | undefined } = {}) {
  const { t } = useLanguage();
  return (
    <CompactPlatform image={image ?? umrahSupportHero} imageAlt={imageAlt ?? "Abubakar Alhaji Abubakar supporting a community group in a respectful Umrah setting"} icon={Plane} eyebrow={t("umrah.previewEyebrow")} title={title ?? t("umrah.previewTitle")} description={description ?? t("umrah.previewDescription")} href="/umrah" action={t("umrah.previewAction")} tone="gold" />
  );
}

export function FoundationSection({ title, description, image, imageAlt }: { title?: string | undefined; description?: string | undefined; image?: string | null | undefined; imageAlt?: string | null | undefined } = {}) {
  const t = useSiteText();
  return (
    <section className="section-reveal border-b border-border bg-secondary/50 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-lg border border-border bg-card shadow-platform lg:grid-cols-[minmax(0,1fr)_minmax(380px,.9fr)]">
          <div className="flex min-w-0 flex-col justify-center p-5 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-2"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-green/10 text-brand-green"><HandHeart className="size-5" aria-hidden="true" /></span><span className="text-xs font-bold uppercase text-primary">{t("foundation.previewEyebrow")}</span></span>
              <Link to="/foundation" className="premium-action group inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t("foundation.exploreAction")} <ArrowRight className="shortcut-arrow size-4 text-primary rtl:rotate-180" aria-hidden="true" /></Link>
            </div>
            <h2 className="mt-4 max-w-xl font-display text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">{title ?? t("foundation.previewTitle")}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">{description ?? t("foundation.previewShort")}</p>
          </div>
          <div className="relative aspect-[16/9] overflow-hidden bg-secondary sm:aspect-[2/1] lg:aspect-auto lg:min-h-[320px]">
            <SafeImage src={image ?? communitySupportBanner} fallbackSrc={communitySupportBanner} alt={imageAlt ?? "Nigerian Muslim community members sharing educational support with children"} loading="lazy" decoding="async" width={1920} height={640} className="absolute inset-0 size-full object-cover object-[88%_center] lg:object-[68%_center]" />
          </div>
        </div>
      </div>
    </section>
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

export function BlogPreview({ items }: { items?: Array<{ id: string; slug: string; title: string; summary: string | null; payload: unknown; imageUrl?: string | null }> | undefined }) {
  const { t } = useLanguage();
  const visiblePosts = (items ?? []).slice(0, 3).map((item) => ({ slug: item.slug, title: item.title, category: typeof item.payload === "object" && item.payload && !Array.isArray(item.payload) && typeof (item.payload as Record<string, unknown>)["category"] === "string" ? String((item.payload as Record<string, unknown>)["category"]) : t("blog.updateLabel"), image: item.imageUrl }));
  return (
    <SectionShell eyebrow={t("home.blogEyebrow")} title={t("home.blogTitle")} description={t("home.blogDescription")} action={{ label: t("common.viewAllPosts"), href: "/blog" }}>
      <div className="grid gap-4 md:grid-cols-3">{visiblePosts.map((post) => <article key={post.slug} className="motion-card grid grid-cols-[96px_minmax(0,1fr)] overflow-hidden rounded-lg border border-border bg-card">{post.image ? <SafeImage src={post.image} alt={post.title} loading="lazy" width={1200} height={750} className="h-full min-h-32 w-24 object-cover" /> : <span className="grid min-h-32 w-24 place-items-center bg-brand-ink text-primary-foreground/60"><Newspaper className="size-7" /></span>}<div className="p-4"><p className="text-xs font-bold text-primary">{post.category}</p><h3 className="mt-1 font-display text-base font-bold leading-tight">{post.title}</h3><Button variant="link" className="mt-2 h-auto px-0 text-xs" asChild><Link to="/blog/$slug" params={{ slug: post.slug }}>{t("common.readMore")} <ArrowRight /></Link></Button></div></article>)}</div>
    </SectionShell>
  );
}

export function ContactSection() {
  const { t } = useLanguage();
  const links = useContactLinks();
  return (
    <section className="relative overflow-hidden bg-brand-ink py-12 text-primary-foreground">
      <div className="absolute inset-0 workspace-grid opacity-35" />
      <div className="relative mx-auto grid max-w-7xl gap-7 px-4 text-center sm:px-6 lg:px-8">
        <div><p className="text-xs font-bold uppercase text-brand-cyan">{t("home.contactEyebrow")}</p><h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{t("home.contactTitle")}</h2><p className="mx-auto mt-3 max-w-2xl text-sm text-primary-foreground/75">{t("home.contactDescription")}</p></div>
        <div className="grid justify-items-center gap-5"><Button className="h-12 bg-background px-7 font-bold text-foreground hover:bg-secondary" asChild><Link to="/contact">{t("common.contactMe")} <ArrowRight className="rtl:rotate-180" /></Link></Button><ContactSocials /></div>
      </div>
    </section>
  );
}

const contactPlatformOrder = ["linkedin", "whatsapp", "email", "facebook", "tiktok", "youtube", "instagram"] as const;

function ContactSocials() {
  const load = useServerFn(listPublicSocialLinks);
  const social = useQuery({ queryKey: ["public-social-links"], queryFn: () => load(), staleTime: 1000 * 60 * 30 });
  const contact = useContactLinks();
  const configured = new Map((social.data ?? []).map((item) => [item.platform, item]));
  const allowed = new Set<string>(contactPlatformOrder);
  // Follow the Super Admin's saved platform order; fall back to confirmed links when a row is missing.
  const rows = (social.data ?? []).filter((item) => allowed.has(item.platform)).map((item) => ({ key: item.platform, href: item.url, label: item.display_label || platformLabels[item.platform] || item.platform, external: true }));
  const present = new Set(rows.map((row) => row.key));
  const fallbacks = ([["linkedin", contact.linkedin], ["whatsapp", contact.whatsapp]] as const).filter(([key, href]) => !present.has(key) && href).map(([key, href]) => ({ key, href: href as string, label: platformLabels[key] || key, external: true }));
  const items = [...rows, ...fallbacks, ...(contact.email ? [{ key: "email", href: contact.email, label: "Email", external: false }] : [])];
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !items.length) return null;
  return (
    <ul className="flex max-w-3xl flex-wrap justify-center gap-2" aria-label="Contact and social links">
      {items.map((item) => {
        const Icon = item.key === "email" ? null : socialIcons[item.key];
        return <li key={item.key}><a href={item.href} {...(item.external ? { target: "_blank", rel: "noopener noreferrer me" } : {})} aria-label={item.label} className="contact-social inline-flex min-h-11 items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/5 px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan">{Icon ? <Icon className="size-4 text-brand-cyan" /> : <Mail className="size-4 text-brand-cyan" aria-hidden="true" />}<span>{item.label}</span></a></li>;
      })}
    </ul>
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
        <div className="mb-7 min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><p className="text-xs font-bold uppercase text-primary">{eyebrow}</p>{action && <Link to={action.href} className="premium-action group inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{action.label} <ArrowRight className="shortcut-arrow size-4 text-primary rtl:rotate-180" aria-hidden="true" /></Link>}</div>
          <h2 className="mt-2 max-w-3xl font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">{title}</h2>{description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description, action, href, slug }: { icon: LucideIcon; title: string; description: string; action?: string; href?: "/services" | "/services/$slug"; slug?: string }) {
  return <article className="motion-card h-full rounded-lg border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-cyan/40 hover:shadow-platform"><span className="grid h-10 w-10 place-items-center rounded-md bg-brand-cyan/10 text-primary"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-display text-base font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>{action && href === "/services/$slug" && slug ? <Button variant="link" className="mt-3 h-auto px-0 text-xs" asChild><Link to="/services/$slug" params={{ slug }}>{action} <ArrowRight /></Link></Button> : action && href ? <Button variant="link" className="mt-3 h-auto px-0 text-xs" asChild><Link to={href}>{action} <ArrowRight /></Link></Button> : null}</article>;
}

function CompactPlatform({ image, imageAlt, icon: Icon, eyebrow, title, description, href, action, tone }: { image?: string; imageAlt?: string; icon: LucideIcon; eyebrow: string; title: string; description: string; href: "/umrah" | "/foundation" | "/register"; action: string; tone: "gold" | "green" | "blue" }) {
  const colors = tone === "gold" ? "bg-brand-gold/15 text-brand-gold" : tone === "green" ? "bg-brand-green/10 text-brand-green" : "bg-brand-cyan/10 text-primary";
  return <section className="border-b border-border bg-background py-5"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className={`grid gap-5 overflow-hidden rounded-lg border border-border bg-card shadow-sm ${image ? "md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-center" : "p-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"}`}>{image ? <SafeImage src={image} alt={imageAlt ?? ""} loading="lazy" width={720} height={720} className="aspect-[16/10] h-full max-h-52 w-full object-cover object-top md:aspect-square md:max-h-none" /> : <span className={`m-5 grid h-16 w-16 place-items-center rounded-full ${colors}`}><Icon className="h-8 w-8" /></span>}<div className={`min-w-0 ${image ? "px-5 md:px-0" : ""}`}><p className="text-xs font-bold uppercase text-primary">{eyebrow}</p><h2 className="mt-1 font-display text-xl font-bold">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p></div><Button variant="outline" className={`shrink-0 ${image ? "mx-5 mb-5 md:my-5 md:ml-0" : ""}`} asChild><Link to={href}>{action} <ArrowRight /></Link></Button></div></div></section>;
}

type HubItem = { id: string; slug: string; title: string; summary: string | null; category?: string | null; payload: unknown; imageUrl?: string | null; image_alt?: string | null; published_at?: string | null };
export function SelectedWorkSection({ items, updates }: { items?: HubItem[] | undefined; updates?: HubItem[] | undefined }) {
  const t = useSiteText();
  const { language } = useLanguage();
  const { carouselSeconds } = useSiteLayout();
  const scroller = useRef<HTMLDivElement>(null);
  const animating = useRef(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [canAuto, setCanAuto] = useState(false);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const seen = new Set<string>();
  const newsCards = [...(updates ?? [])].sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? "")).map((item) => ({ kind: "update" as const, id: item.id, slug: item.slug, name: item.title, excerpt: item.summary, image: item.imageUrl, alt: item.image_alt ?? item.title }));
  const projectCards = (items ?? []).map((item) => ({ kind: "project" as const, id: item.id, slug: item.slug, name: item.title, excerpt: null as string | null, image: item.imageUrl, alt: item.image_alt ?? item.title }));
  const projects = [...newsCards, ...projectCards].filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  const looped = projects.length >= 3;
  const track = looped ? [...projects.map((p) => ({ ...p, copy: 0 })), ...projects.map((p) => ({ ...p, copy: 1 }))] : projects.map((p) => ({ ...p, copy: 0 }));
  const imageKey = projects.map((p) => p.image ?? "").join("|");
  // Warm only the next few unique pictures once this section is visible. This avoids downloading
  // every card and both carousel copies while the hero and first viewport still need bandwidth.
  useEffect(() => {
    if (!visible || !imageKey) return;
    const upcoming = [...new Set(imageKey.split("|").filter(Boolean))].slice(0, 3);
    const timer = window.setTimeout(() => upcoming.forEach((src) => { const img = new Image(); img.decoding = "async"; img.src = src; }), 150);
    return () => window.clearTimeout(timer);
  }, [visible, imageKey]);
  const calm = () => (document.documentElement.dataset["motion"] ?? "full") !== "full" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** Eased ~0.9s glide by one card (snap is lifted during the glide so it cannot jerk the motion). */
  const glideTo = useCallback((el: HTMLDivElement, target: number) => {
    cancelAnimationFrame(animating.current);
    if (calm()) { el.scrollLeft = target; return; }
    const start = el.scrollLeft; const dist = target - start; const t0 = performance.now(); const dur = 900;
    el.style.scrollSnapType = "none";
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      el.scrollLeft = start + dist * e;
      if (p < 1) animating.current = requestAnimationFrame(step); else el.style.scrollSnapType = "";
    };
    animating.current = requestAnimationFrame(step);
  }, []);
  const scroll = useCallback((dir: number) => {
    const el = scroller.current; if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    const card = el.firstElementChild as HTMLElement | null;
    const stepPx = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    const looped = el.dataset["loop"] === "1";
    // The track holds the cards twice; jumping between identical positions is invisible, so the loop never rewinds.
    const half = looped ? (el.scrollWidth + 16) / 2 : 0;
    const max = el.scrollWidth - el.clientWidth;
    let pos = Math.abs(el.scrollLeft);
    if (looped) {
      if (dir > 0 && pos >= half - 4) { pos -= half; el.style.scrollSnapType = "none"; el.scrollLeft = rtl ? -pos : pos; }
      if (dir < 0 && pos <= 4) { pos += half; el.style.scrollSnapType = "none"; el.scrollLeft = rtl ? -pos : pos; }
    } else {
      if (dir > 0 && pos >= max - 4) { glideTo(el, 0); return; }
      if (dir < 0 && pos <= 4) { glideTo(el, rtl ? -max : max); return; }
    }
    const next = Math.min(max, Math.max(0, pos + dir * stepPx));
    glideTo(el, rtl ? -next : next);
  }, [glideTo]);
  useEffect(() => {
    const check = () => setCanAuto(!calm());
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const el = scroller.current; if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [projects.length]);
  useEffect(() => {
    if (!canAuto || !visible || userPaused || hoverPaused || projects.length < 2) return;
    const timer = window.setInterval(() => scroll(1), Math.round(carouselSeconds * 1000));
    return () => window.clearInterval(timer);
  }, [canAuto, visible, userPaused, hoverPaused, projects.length, scroll, carouselSeconds]);
  useEffect(() => () => cancelAnimationFrame(animating.current), []);
  const onScroll = () => { const el = scroller.current; if (!el) return; const width = looped ? (el.scrollWidth + 16) / 2 : el.scrollWidth; const n = Math.max(1, Math.ceil(width / el.clientWidth)); setPages(n); setPage(Math.min(n - 1, Math.round((Math.abs(el.scrollLeft) % width) / el.clientWidth))); };
  useEffect(() => { onScroll(); }, [projects.length]);
  if (!projects.length) return null;
  const round = "size-11 rounded-full border-brand-cyan/50 bg-brand-ink text-primary-foreground hover:bg-brand-cyan/15 hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink";
  return (
    <section className="bg-brand-ink py-10 text-primary-foreground sm:py-14" aria-labelledby="selected-work-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap">
          <h2 id="selected-work-title" className="flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap font-display text-[clamp(0.9rem,4.4vw,1.25rem)] font-bold uppercase leading-none tracking-wide text-primary-foreground sm:text-3xl">
            <span className="grid size-7 shrink-0 place-items-center rounded-full border border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan shadow-glow sm:size-9"><Megaphone className="size-3.5 sm:size-4.5" aria-hidden="true" /></span>
            <span className="min-w-0">{t("home.projectsTitle")}</span>
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-brand-cyan/50 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild><Link to="/projects"><FolderKanban className="size-4 text-brand-cyan" aria-hidden="true" /><span className="hidden sm:inline">Media Gallery</span><span className="sr-only sm:hidden">Media Gallery</span></Link></Button>
            {canAuto ? <Button type="button" variant="outline" size="icon" onClick={() => setUserPaused((v) => !v)} aria-label={userPaused ? "Resume automatic scrolling" : "Pause automatic scrolling"} aria-pressed={userPaused} className={round}>{userPaused ? <Play className="size-4" /> : <Pause className="size-4" />}</Button> : null}
            <Button type="button" variant="outline" size="icon" onClick={() => scroll(-1)} aria-label="Previous projects" className={round}><ArrowRight className="size-4 rotate-180 rtl:rotate-0" /></Button>
            <Button type="button" variant="outline" size="icon" onClick={() => scroll(1)} aria-label="Next projects" className={`${round} bg-brand-cyan/15`}><ArrowRight className="size-4 rtl:rotate-180" /></Button>
          </div>
        </div>
        {/* Native horizontal scrolling: vertical swipes and the mouse wheel still scroll the page, and a drag never counts as a tap. */}
        <div ref={scroller} data-loop={looped ? "1" : "0"} onScroll={onScroll} onMouseEnter={() => setHoverPaused(true)} onMouseLeave={() => setHoverPaused(false)} onFocusCapture={() => setHoverPaused(true)} onBlurCapture={() => setHoverPaused(false)} onTouchStart={() => { cancelAnimationFrame(animating.current); if (scroller.current) scroller.current.style.scrollSnapType = ""; setHoverPaused(true); }} onTouchEnd={() => window.setTimeout(() => setHoverPaused(false), 3500)} className="selected-work-track mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none]">
          {track.map((p, index) => {
            const clone = p.copy === 1;
            const linkProps = p.kind === "update" ? ({ to: "/blog/$slug", params: { slug: p.slug } } as const) : ({ to: "/projects/$slug", params: { slug: p.slug } } as const);
            return (
            <article key={`${p.kind}-${p.id}-${p.copy}`} aria-hidden={clone || undefined} inert={clone || undefined} className="motion-card w-[82%] shrink-0 snap-start overflow-hidden rounded-xl border border-brand-cyan/20 bg-primary-foreground/5 transition-transform duration-300 lg:hover:-translate-y-1 motion-reduce:transition-none sm:w-[46%] lg:w-[32%]">
              <Link {...linkProps} draggable={false} className="block aspect-[16/10] overflow-hidden bg-primary-foreground/10" aria-label={`${language === "ar" ? "عرض التفاصيل" : language === "ha" ? "Duba cikakkun bayanai" : "View details"}: ${p.name}`}>
                {p.image ? <SafeImage src={p.image} alt={clone ? "" : p.alt} loading="lazy" fetchPriority="low" decoding="async" sizes="(min-width: 1024px) 400px, (min-width: 640px) 46vw, 82vw" width={960} height={600} draggable={false} className="hub-float size-full object-cover" /> : <span className="grid size-full place-items-center"><FolderKanban className="size-10 opacity-60" /></span>}
              </Link>
              <div className="flex flex-col gap-2 p-4">
                {p.kind === "update" ? <span className="w-fit rounded-full border border-brand-cyan/60 px-2.5 py-0.5 text-xs font-semibold text-brand-cyan">{t("blog.updateLabel")}</span> : null}
                <h3 className="min-w-0 font-display text-base font-bold"><Link {...linkProps} className="hover:text-brand-cyan">{p.name}</Link></h3>
                {p.excerpt ? <p className="line-clamp-2 text-sm text-primary-foreground/75">{p.excerpt}</p> : null}
                <Link {...linkProps} className="inline-flex min-h-10 w-fit items-center gap-1 rounded-md border border-brand-cyan/60 px-4 text-sm font-semibold hover:bg-primary-foreground/10">{language === "ar" ? "عرض التفاصيل" : language === "ha" ? "Duba cikakkun bayanai" : "View Details"} <ArrowRight className="size-3.5 rtl:rotate-180" /></Link>
              </div>
            </article>
            );
          })}
        </div>
        {pages > 1 ? <div className="mt-4 flex justify-center gap-2" aria-hidden="true">{Array.from({ length: pages }, (_, i) => <span key={i} className={`size-2 rounded-full ${i === page ? "bg-brand-cyan" : "bg-primary-foreground/25"}`} />)}</div> : null}
      </div>
    </section>
  );
}
