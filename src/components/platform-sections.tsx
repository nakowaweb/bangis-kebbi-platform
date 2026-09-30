import { Link } from "@tanstack/react-router";
import {
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
  Plane,
  Play,
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

export function HeroSection({ intervalSeconds = 3, content, slides, location = "Kebbi State, Nigeria", globalStatus = "Working globally" }: { content?: { eyebrow?: string | undefined; title?: string | undefined; subtitle?: string | undefined; description?: string | undefined; primaryCta?: string | undefined; secondaryCta?: string | undefined } | undefined; slides?: HeroSlideInput[]; location?: string; globalStatus?: string; intervalSeconds?: number }) {
  const { t } = useLanguage();
  return (
    <section className="relative isolate overflow-hidden bg-brand-ink text-primary-foreground">
      <HeroCarousel
        slides={slides}
        location={/abuja/i.test(location) ? "Kebbi State, Nigeria" : location}
        globalStatus={globalStatus}
        intervalMs={Math.min(30, Math.max(1, intervalSeconds)) * 1000}
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

function HeroCarousel({ intervalMs, slides, location, globalStatus, eyebrow, subtitle, primaryCta, secondaryCta }: { slides?: HeroSlideInput[] | undefined; location: string; globalStatus: string; eyebrow: string; subtitle: string; primaryCta: string; secondaryCta: string; intervalMs: number }) {
  const { t } = useLanguage();
  const heroSlides = slides?.length ? slides.slice(0, 3) : fallbackHeroSlides;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const reducedMotion = useRef(false);
  useEffect(() => { reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);
  const move = useCallback((step: number) => setActive((current) => (current + step + heroSlides.length) % heroSlides.length), [heroSlides.length]);
  useEffect(() => {
    if (paused || reducedMotion.current) return;
    const timer = window.setInterval(() => move(1), intervalMs);
    return () => window.clearInterval(timer);
  }, [move, paused, intervalMs]);
  return (
    <div className="hero-stage relative w-full overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)} onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => { const end = event.changedTouches[0]?.clientX; if (touchStart.current !== null && end !== undefined && Math.abs(end - touchStart.current) > 45) move(end < touchStart.current ? 1 : -1); touchStart.current = null; }} aria-roledescription="carousel" aria-label="BangisKebbi.com highlights">
      {heroSlides.map((slide, index) => (
        <figure key={slide.label} aria-hidden={active !== index} className={`hero-slide absolute inset-0 ${active === index ? "hero-slide-active" : ""}`}>
          <SafeImage src={slide.src} {...(slide.fallbackSrc ? { fallbackSrc: slide.fallbackSrc } : {})} alt={active === index ? slide.alt : ""} width={1264} height={848} fetchPriority={index === 0 ? "high" : undefined} loading={index === 0 ? "eager" : "lazy"} className="hero-slide-image h-full w-full object-cover object-center" />
        </figure>
      ))}
      <div className="pointer-events-none absolute inset-0 z-10 hero-reference-overlay" />
      <div className="pointer-events-none absolute inset-0 z-10 workspace-grid opacity-25" />
      <div className="relative z-20 mx-auto flex min-h-[620px] max-w-7xl items-end px-12 pb-20 pt-52 sm:min-h-[660px] sm:px-20 sm:pb-24 sm:pt-64 lg:min-h-[650px] lg:items-center lg:px-16 lg:py-14 xl:min-h-[690px] xl:px-20">
        <div className="hero-copy-enter min-w-0 max-w-[640px] lg:w-[55%]">
          <p className="hero-accent-text text-sm font-bold tracking-wide sm:text-base">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.06] sm:mt-4 sm:text-5xl xl:text-6xl">
            <span className="hero-line hero-line-1 block text-primary-foreground">{t("home.heroBusinessTitleTop")}</span>
            <span className="hero-line hero-line-2 hero-title-b block">{t("home.heroBusinessTitleBottom")}</span>
          </h1>
          <p className="hero-line hero-line-3 mt-5 max-w-xl text-base font-medium leading-7 text-primary-foreground/80 sm:text-lg">{subtitle}</p>
          <div className="hero-cta-enter mt-7 flex flex-wrap gap-3">
            <Button className="h-12 bg-brand-cyan px-7 text-brand-ink shadow-glow hover:bg-brand-cyan-soft sm:h-14 sm:px-9 sm:text-base" asChild><Link to="/projects">{primaryCta} <ArrowRight /></Link></Button>
            <Button variant="outline" className="h-12 border-primary-foreground/40 bg-brand-ink/45 px-7 text-primary-foreground backdrop-blur hover:bg-primary-foreground/10 sm:h-14 sm:px-9 sm:text-base" asChild><Link to="/contact">{secondaryCta}</Link></Button>
          </div>
          <div className="hero-location location-badge-motion mt-6 inline-flex items-center gap-3 rounded-md border border-primary-foreground/20 bg-brand-ink/70 px-4 py-3 backdrop-blur-md sm:px-5">
            <MapPin className="h-7 w-7 shrink-0 fill-primary-foreground text-brand-ink" aria-hidden="true" />
            <span><span className="flex items-center gap-2 text-sm font-bold sm:text-base">{location}<span className="inline-flex h-4 w-4 overflow-hidden rounded-full border border-primary-foreground/40" aria-hidden="true"><span className="w-1/3 bg-brand-green" /><span className="w-1/3 bg-primary-foreground" /><span className="w-1/3 bg-brand-green" /></span></span><span className="mt-0.5 flex items-center gap-1.5 text-xs text-primary-foreground/80 sm:text-sm"><Globe2 className="h-3.5 w-3.5 text-brand-cyan" aria-hidden="true" />{globalStatus}</span></span>
          </div>
        </div>
      </div>
      <Button type="button" variant="outline" size="icon" onClick={() => move(-1)} className="absolute left-1 top-1/2 z-30 -translate-y-1/2 border-primary-foreground/30 bg-brand-ink/75 text-primary-foreground backdrop-blur hover:bg-brand-ink sm:left-4" aria-label="Previous hero slide"><ChevronLeft /></Button>
      <Button type="button" variant="outline" size="icon" onClick={() => move(1)} className="absolute right-1 top-1/2 z-30 -translate-y-1/2 border-primary-foreground/30 bg-brand-ink/75 text-primary-foreground backdrop-blur hover:bg-brand-ink sm:right-4" aria-label="Next hero slide"><ChevronRight /></Button>
      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-0.5" aria-label="Choose hero slide">{heroSlides.map((slide, index) => <Button key={slide.label} type="button" variant="ghost" size="icon" onClick={() => setActive(index)} className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10" aria-label={`Show slide ${index + 1}: ${slide.label}`} aria-current={active === index ? "true" : undefined}><span className={`h-1.5 rounded-full transition-all ${active === index ? "w-8 bg-brand-cyan" : "w-5 bg-primary-foreground/45"}`} /></Button>)}</div>
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

export function ServicesSection({ full = false, items }: { full?: boolean; items?: Array<{ id: string; slug: string; title: string; summary: string | null; imageUrl?: string | null }> | undefined }) {
  const { t, language } = useLanguage();
  const fallbackBySlug = new Map(portfolioServices.map((item) => [item.slug, item]));
  const visibleServices = items?.length
    ? items.map((item, index) => {
      const fallback = fallbackBySlug.get(item.slug);
      return { slug: item.slug, title: item.title, description: item.summary ?? t("home.serviceFallback"), image: item.imageUrl ?? fallback?.image, imageAlt: fallback ? text(fallback.imageAlt, language) : item.title, icon: serviceCards[index % serviceCards.length]?.icon ?? Code2 };
    })
    : portfolioServices.map((item, index) => ({ slug: item.slug, title: text(item.title, language), description: text(item.summary, language), image: item.image, imageAlt: text(item.imageAlt, language), icon: serviceCards[index % serviceCards.length]?.icon ?? Code2 }));
  return (
    <SectionShell eyebrow={t("home.servicesEyebrow")} title={t("home.servicesTitle")} description={t("home.servicesDescription")} >
      {!full ? <div className="service-strip mb-6 overflow-hidden rounded-xl border border-brand-cyan/25 py-3" aria-hidden="true"><div className="service-strip-track flex w-max items-center gap-8 whitespace-nowrap text-xs font-bold uppercase sm:text-sm">{[...visibleServices, ...visibleServices].map((service, index) => <span key={`${service.slug}-${index}`} className="inline-flex items-center gap-8"><span className="service-strip-text">{service.title}</span><span className="text-brand-green">•</span></span>)}</div></div> : null}
      <ul className="grid gap-2.5 md:hidden">
        {visibleServices.map((service, index) => {
          const mini = serviceMinis[service.slug] ?? serviceMiniOrder[index % serviceMiniOrder.length];
          const sub = serviceSubtitles[service.slug];
          return <li key={service.slug}><Link to="/services/$slug" params={{ slug: service.slug }} className="group grid min-h-[72px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-sm transition active:scale-[0.99] active:bg-secondary hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <img src={mini} alt="" aria-hidden="true" loading="lazy" width={256} height={256} className="service-mini size-14 shrink-0 object-contain" />
            <span className="min-w-0"><strong className="block truncate font-display text-sm font-bold">{service.title}</strong><span className="block truncate text-xs text-muted-foreground">{sub ? (language === "ar" ? sub.ar : language === "ha" ? sub.ha : sub.en) : service.description}</span></span>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary">{t("common.viewMore")} <ArrowRight className="shortcut-arrow size-3.5 rtl:rotate-180" aria-hidden="true" /></span>
          </Link></li>;
        })}
      </ul>
      <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {visibleServices.map((service, index) => {
          const mini = serviceMinis[service.slug] ?? serviceMiniOrder[index % serviceMiniOrder.length];
          return <article key={service.slug} className="motion-card group relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-platform">
            <div className="relative aspect-[8/5] overflow-hidden bg-secondary">
              <SafeImage src={service.image} alt={service.imageAlt} loading="lazy" width={1200} height={752} className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            </div>
            <div className="relative flex flex-1 flex-col px-5 pb-5 pt-8">
              <img src={mini} alt="" aria-hidden="true" loading="lazy" width={256} height={256} className="service-mini absolute -top-9 left-3 size-16 object-contain drop-shadow-md rtl:left-auto rtl:right-3" />
              <h3 className="font-display text-lg font-bold leading-6">{service.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{service.description}</p>
              <Link to="/services/$slug" params={{ slug: service.slug }} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">{t("common.viewMore")} <ArrowRight className="shortcut-arrow size-4 rtl:rotate-180" aria-hidden="true" /></Link>
            </div>
          </article>;
        })}
      </div>
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
  const { t } = useLanguage();
  const points = [
    { label: t("foundation.previewPeople"), icon: UsersRound, tone: "bg-brand-cyan/10 text-primary" },
    { label: t("foundation.previewDevelopment"), icon: Sprout, tone: "bg-brand-green/10 text-brand-green" },
    { label: t("foundation.previewTransparency"), icon: ShieldCheck, tone: "bg-brand-gold/15 text-brand-gold" },
    { label: t("foundation.previewDignity"), icon: HeartHandshake, tone: "bg-secondary text-primary" },
  ];
  return (
    <section className="section-reveal border-b border-border bg-secondary/50 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="group grid overflow-hidden rounded-lg border border-border bg-card shadow-platform transition duration-300 hover:-translate-y-0.5 hover:shadow-glow lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,.92fr)]">
          <div className="flex min-w-0 flex-col justify-center p-6 sm:p-9 lg:p-12">
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-green/10 text-brand-green"><HandHeart className="size-6" /></span>
              <p className="text-xs font-bold uppercase text-primary">{t("foundation.previewEyebrow")}</p>
            </div>
            <h2 className="mt-5 max-w-xl font-display text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">{title ?? t("foundation.previewTitle")}</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">{description ?? t("foundation.previewDescription")}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {points.map((point) => <div key={point.label} className="flex min-w-0 items-center gap-3 rounded-md border border-border bg-background p-3 transition duration-300 group-hover:border-primary/20"><span className={`grid size-10 shrink-0 place-items-center rounded-full ${point.tone}`}><point.icon className="size-5" /></span><span className="text-sm font-semibold leading-5 text-foreground">{point.label}</span></div>)}
            </div>
            <Button className="mt-7 h-12 w-full font-bold sm:w-fit sm:px-7" asChild><Link to="/foundation">{t("foundation.previewAction")} <ArrowRight /></Link></Button>
          </div>
          <div className="relative min-h-64 overflow-hidden bg-secondary sm:min-h-80 lg:min-h-[520px]">
            <SafeImage src={image ?? communitySupportBanner} fallbackSrc={communitySupportBanner} alt={imageAlt ?? "Nigerian Muslim community members sharing educational support with children"} loading="eager" fetchPriority="high" decoding="async" width={1920} height={640} className="absolute inset-0 size-full object-cover object-[68%_center] transition duration-700 group-hover:scale-[1.015]" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card/35 to-transparent lg:hidden" />
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
        <div className="flex flex-col justify-center gap-3 sm:flex-row"><Button className="bg-background text-foreground hover:bg-secondary" asChild><Link to="/contact">{t("common.contactMe")} <ArrowRight /></Link></Button>{links.linkedin ? <Button className="bg-brand-cyan text-brand-ink hover:bg-brand-cyan-soft" asChild><a href={links.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin /> LinkedIn</a></Button> : null}<Button variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" asChild>{links.whatsapp ? <a href={links.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle /> {t("common.whatsapp")}</a> : <Link to="/contact"><MessageCircle /> {t("common.whatsapp")}</Link>}</Button><Button variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" asChild>{links.email ? <a href={links.email}><Mail /> {t("common.email")}</a> : <Link to="/contact"><Mail /> {t("common.email")}</Link>}</Button></div>
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

function FeatureCard({ icon: Icon, title, description, action, href, slug }: { icon: LucideIcon; title: string; description: string; action?: string; href?: "/services" | "/services/$slug"; slug?: string }) {
  return <article className="motion-card h-full rounded-lg border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-cyan/40 hover:shadow-platform"><span className="grid h-10 w-10 place-items-center rounded-md bg-brand-cyan/10 text-primary"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-display text-base font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>{action && href === "/services/$slug" && slug ? <Button variant="link" className="mt-3 h-auto px-0 text-xs" asChild><Link to="/services/$slug" params={{ slug }}>{action} <ArrowRight /></Link></Button> : action && href ? <Button variant="link" className="mt-3 h-auto px-0 text-xs" asChild><Link to={href}>{action} <ArrowRight /></Link></Button> : null}</article>;
}

function CompactPlatform({ image, imageAlt, icon: Icon, eyebrow, title, description, href, action, tone }: { image?: string; imageAlt?: string; icon: LucideIcon; eyebrow: string; title: string; description: string; href: "/umrah" | "/foundation" | "/register"; action: string; tone: "gold" | "green" | "blue" }) {
  const colors = tone === "gold" ? "bg-brand-gold/15 text-brand-gold" : tone === "green" ? "bg-brand-green/10 text-brand-green" : "bg-brand-cyan/10 text-primary";
  return <section className="border-b border-border bg-background py-5"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className={`grid gap-5 overflow-hidden rounded-lg border border-border bg-card shadow-sm ${image ? "md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-center" : "p-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"}`}>{image ? <SafeImage src={image} alt={imageAlt ?? ""} loading="lazy" width={720} height={720} className="aspect-[16/10] h-full max-h-52 w-full object-cover object-top md:aspect-square md:max-h-none" /> : <span className={`m-5 grid h-16 w-16 place-items-center rounded-full ${colors}`}><Icon className="h-8 w-8" /></span>}<div className={`min-w-0 ${image ? "px-5 md:px-0" : ""}`}><p className="text-xs font-bold uppercase text-primary">{eyebrow}</p><h2 className="mt-1 font-display text-xl font-bold">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p></div><Button variant="outline" className={`shrink-0 ${image ? "mx-5 mb-5 md:my-5 md:ml-0" : ""}`} asChild><Link to={href}>{action} <ArrowRight /></Link></Button></div></div></section>;
}

export function SelectedWorkSection({ items }: { items?: Array<{ id: string; slug: string; title: string; summary: string | null; category?: string | null; payload: unknown; imageUrl?: string | null; image_alt?: string | null }> | undefined }) {
  const { t } = useLanguage();
  const scroller = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("all");
  const projects = (items ?? []).map((item) => {
    const payload = typeof item.payload === "object" && item.payload && !Array.isArray(item.payload) ? (item.payload as Record<string, unknown>) : {};
    return { slug: item.slug, name: item.title, category: item.category ?? (typeof payload["category"] === "string" ? String(payload["category"]) : ""), image: item.imageUrl, alt: item.image_alt ?? item.title };
  });
  const categories = Array.from(new Set(projects.map((p) => p.category).filter(Boolean)));
  const visible = filter === "all" ? projects : projects.filter((p) => p.category === filter);
  const scroll = (dir: number) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: "smooth" });
  if (!projects.length) return null;
  return (
    <section className="bg-brand-ink py-10 text-primary-foreground sm:py-14" aria-labelledby="selected-work-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:flex lg:flex-wrap">
          <div className="flex min-w-0 items-center gap-4 lg:flex-1">
            <h2 id="selected-work-title" className="shrink-0 font-display text-2xl font-bold sm:text-3xl">{t("home.projectsTitle")}</h2>
            <span className="hidden h-px flex-1 bg-gradient-to-r from-brand-gold to-transparent sm:block" aria-hidden="true" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" className="border-brand-cyan/40 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild><Link to="/projects"><FolderKanban className="size-4 text-brand-cyan" aria-hidden="true" />Media Gallery</Link></Button>
            <Button type="button" variant="outline" size="icon" onClick={() => scroll(-1)} aria-label="Previous projects" className="rounded-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><ArrowRight className="size-4 rotate-180 rtl:rotate-0" /></Button>
            <Button type="button" variant="outline" size="icon" onClick={() => scroll(1)} aria-label="Next projects" className="rounded-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><ArrowRight className="size-4 rtl:rotate-180" /></Button>
          </div>
        </div>
        {categories.length > 1 && <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter projects">
          {["all", ...categories].map((c) => <Button key={c} type="button" size="sm" variant="outline" aria-pressed={filter === c} onClick={() => setFilter(c)} className={`shrink-0 ${filter === c ? "border-brand-cyan bg-brand-cyan text-brand-ink hover:bg-brand-cyan-soft" : "border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"}`}>{c === "all" ? "All" : c}</Button>)}
        </div>}
        <div ref={scroller} className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 motion-reduce:scroll-auto">
          {visible.map((p) => (
            <article key={p.slug} className="w-[85%] shrink-0 snap-start overflow-hidden rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 sm:w-[46%] lg:w-[32%]">
              <Link to="/projects/$slug" params={{ slug: p.slug }} className="block aspect-[16/9] overflow-hidden bg-brand-ink" aria-label={`${t("common.viewProject")}: ${p.name}`}>
                {p.image ? <SafeImage src={p.image} alt={p.alt} loading="lazy" width={960} height={540} className="size-full object-cover transition duration-500 hover:scale-[1.03] motion-reduce:transition-none" /> : <span className="grid size-full place-items-center"><FolderKanban className="size-10 opacity-60" /></span>}
              </Link>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4">
                <h3 className="truncate font-display text-base font-bold">{p.name}</h3>
                <Link to="/projects/$slug" params={{ slug: p.slug }} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md border border-brand-cyan/50 px-3 text-xs font-semibold hover:bg-primary-foreground/10">View Case Study <ArrowRight className="size-3.5 rtl:rotate-180" /></Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
