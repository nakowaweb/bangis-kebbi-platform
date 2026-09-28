import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, ClipboardList, FileText, Handshake, Heart, Info, Landmark, Plane, ShieldCheck, Users, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SafeImage } from "@/components/safe-image";
import heroKaaba from "@/assets/umrah/umrah-hero-kaaba.jpg";
import heroMadinah from "@/assets/umrah/umrah-hero-madinah.jpg";
import heroCity from "@/assets/umrah/umrah-hero-makkah-city.jpg";
import heroTravel from "@/assets/umrah/umrah-hero-travel.jpg";
import cardApply from "@/assets/umrah/journey-submit-documents.webp";
import cardGoal from "@/assets/umrah/umrah-support-balance.webp";
import cardTravel from "@/assets/umrah/journey-coordinate-travel.webp";
import cardRecords from "@/assets/umrah/journey-review-dashboard.webp";

export type LandingEntry = { slug: string; title: string; summary: string | null; imageUrl?: string | null; image_alt?: string | null; sort_order?: number };

export const umrahHeroFallbacks = [
  { slug: "umrah-hero-1", image: heroKaaba, alt: "The Kaaba and Masjid al-Haram at sunset" },
  { slug: "umrah-hero-2", image: heroMadinah, alt: "Al-Masjid an-Nabawi in Madinah at sunrise" },
  { slug: "umrah-hero-3", image: heroCity, alt: "Makkah Clock Tower and city at blue hour" },
  { slug: "umrah-hero-4", image: heroTravel, alt: "Passenger aircraft taking off at sunset" },
];

export const partnerSlideFallbacks = [
  { slug: "partners-slide-1", image: heroMadinah, alt: "Madinah" },
  { slug: "partners-slide-2", image: heroKaaba, alt: "Makkah" },
  { slug: "partners-slide-3", image: heroCity, alt: "Makkah city" },
  { slug: "partners-slide-4", image: heroTravel, alt: "Air travel" },
];

/** Resolve CMS-managed slides (by slug) with bundled fallbacks, keeping CMS order when set. */
export function resolveSlides(entries: LandingEntry[], fallbacks: typeof umrahHeroFallbacks) {
  return fallbacks
    .map((f, i) => {
      const e = entries.find((x) => x.slug === f.slug);
      return { src: e?.imageUrl || f.image, fallbackSrc: f.image, alt: e?.image_alt || f.alt, order: e?.sort_order ?? i };
    })
    .sort((a, b) => a.order - b.order);
}

export function intervalFrom(entries: LandingEntry[], slug: string) {
  const s = Number(entries.find((e) => e.slug === slug)?.summary);
  return Number.isFinite(s) && s >= 1 && s <= 30 ? s * 1000 : 3000;
}

export function FadeCarousel({ slides, interval, className = "" }: { slides: Array<{ src: string; fallbackSrc: string; alt: string }>; interval: number; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % slides.length), interval);
    return () => window.clearInterval(t);
  }, [slides.length, interval]);
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden="true">
      {slides.map((s, idx) => (
        <SafeImage key={s.src + idx} src={s.src} fallbackSrc={s.fallbackSrc} alt="" loading={idx === 0 ? "eager" : "lazy"} width={1920} height={1088}
          className={`absolute inset-0 size-full object-cover transition-[opacity,transform] duration-[1400ms] ease-out motion-reduce:transition-none ${idx === i ? "scale-105 opacity-100" : "scale-100 opacity-0"}`} />
      ))}
    </div>
  );
}

function useSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(Boolean(s)));
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}

const pill = "inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5";

export function UmrahLanding({ entries, partnerCount }: { entries: LandingEntry[]; partnerCount: number }) {
  const signedIn = useSignedIn();
  const slides = resolveSlides(entries, umrahHeroFallbacks);
  const interval = intervalFrom(entries, "umrah-hero-settings");
  const partnerSlides = resolveSlides(entries, partnerSlideFallbacks);
  const text = (slug: string, fallback: string) => entries.find((e) => e.slug === slug)?.title || fallback;

  const cards = [
    { title: "Apply for Umrah", body: "Fill in your details and upload the required documents to register for Umrah support.", icon: FileText, image: cardApply, to: signedIn ? "/dashboard" : "/login", tone: "bg-card" },
    { title: "My Umrah Savings Goal", body: "Set your personal savings goal to plan for your Umrah journey at your own pace.", icon: Wallet, image: cardGoal, to: signedIn ? "/dashboard" : "/login", tone: "bg-success/10", goal: true },
    { title: "Travel Partners", body: "Explore travel partners who provide Umrah packages and travel services.", icon: Plane, image: cardTravel, to: "/partners", tone: "bg-brand-gold/10" },
    { title: "My Records", body: "View your application status, savings history and all your Umrah records.", icon: ClipboardList, image: cardRecords, to: signedIn ? "/dashboard" : "/login", tone: "bg-accent/40" },
  ] as const;

  return (
    <div className="bg-background">
      <section className="relative isolate overflow-hidden bg-brand-ink text-primary-foreground">
        <FadeCarousel slides={slides} interval={interval} />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-ink via-brand-ink/80 to-brand-ink/10" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:px-8">
          <div className="max-w-2xl animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-gold/70 bg-brand-ink/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-gold backdrop-blur"><Landmark className="size-4" />{text("umrah-landing-eyebrow", "Umrah Support & Planning")}</span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              {text("umrah-landing-title", "Your Umrah Journey")}<br /><span className="text-brand-gold">{text("umrah-landing-title-2", "Starts With a Plan")}</span>
            </h1>
            <p className="mt-4 text-base leading-7 text-primary-foreground/90 sm:text-lg">{text("umrah-landing-subtitle", "Preparation • Application Support • Personal Savings Goals • Travel Connections • Guidance & Support")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={signedIn ? "/dashboard" : "/register"} className={`${pill} bg-success text-primary-foreground shadow-lg`}><FileText className="size-5" />Apply for Umrah<ArrowRight className="size-4" /></Link>
              <Link to={signedIn ? "/dashboard" : "/login"} className={`${pill} border border-primary-foreground/70 bg-brand-ink/30 backdrop-blur`}><Wallet className="size-5" />Start My Umrah Goal<ArrowRight className="size-4" /></Link>
              <Link to="/partners" className={`${pill} border border-brand-cyan bg-card text-foreground`}><Handshake className="size-5" />Explore Travel Partners<ArrowRight className="size-4" /></Link>
            </div>
          </div>
          <ul className="hidden content-center gap-5 rounded-2xl border border-brand-gold/40 bg-brand-ink/60 p-6 backdrop-blur lg:grid">
            {[[Plane, "Guidance & Support"], [Users, "Travel Partners"], [ShieldCheck, "Safe & Transparent Process"], [Heart, "Community Support"]].map(([Icon, label]) => {
              const I = Icon as typeof Plane;
              return <li key={label as string} className="flex items-center gap-3 text-sm"><span className="grid size-11 place-items-center rounded-full bg-primary-foreground/10"><I className="size-5" /></span>{label as string}</li>;
            })}
          </ul>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Link key={c.title} to={c.to} className={`group relative flex min-h-64 flex-col overflow-hidden rounded-xl border border-border ${c.tone} p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}>
              <div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><c.icon className="size-5" /></span><h2 className="font-display text-lg font-bold">{c.title}</h2><ChevronRight className="ms-auto size-5 transition group-hover:translate-x-1" /></div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{c.body}</p>
              {"goal" in c ? (
                <div className="mt-auto rounded-lg border border-border bg-card p-3 text-sm">
                  <p className="font-semibold">Your Goal Progress</p>
                  <p className="mt-2 text-muted-foreground">{signedIn === null ? "…" : signedIn ? "No recorded contributions yet." : "Sign in to view your Umrah Goal."}</p>
                </div>
              ) : (
                <SafeImage src={c.image} alt="" loading="lazy" width={200} height={140} className="mt-auto ms-auto h-28 w-auto object-contain" />
              )}
            </Link>
          ))}
        </div>

        <section className="rounded-xl border border-border bg-secondary/40 p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline gap-3"><Users className="size-7 self-center text-primary" /><h2 className="font-display text-2xl font-bold">How It Works</h2><p className="text-sm text-muted-foreground">A simple process to start your Umrah journey</p></div>
          <ol className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[["Register / Apply", "Create your account and fill in the Umrah form.", "bg-primary"], ["Set Your Goal", "Choose your savings goal and plan ahead.", "bg-success"], ["Get Guidance", "Receive support and recommended options.", "bg-brand-gold"], ["Travel with Partners", "Complete your journey through travel partners.", "bg-accent-foreground"]].map(([t, b, bg], i) => (
              <li key={t} className="flex gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-full ${bg} font-bold text-primary-foreground`}>{i + 1}</span><div><p className="font-semibold">{t}</p><p className="text-sm text-muted-foreground">{b}</p></div></li>
            ))}
          </ol>
        </section>

        <section>
          <div className="flex flex-wrap items-center gap-3"><Handshake className="size-8 text-primary" /><h2 className="font-display text-2xl font-bold">Our Travel Partners</h2><p className="text-sm text-muted-foreground">Travel partners who provide Umrah packages and related travel services.</p><Link to="/partners" className="ms-auto inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold">View All Partners<ArrowRight className="size-4" /></Link></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {partnerSlides.map((s) => (
              <Link key={s.src} to="/partners" className="group relative block h-40 overflow-hidden rounded-xl">
                <SafeImage src={s.src} fallbackSrc={s.fallbackSrc} alt={s.alt} loading="lazy" width={480} height={272} className="size-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-md bg-card/95 px-3 py-1.5 text-xs font-medium"><Info className="size-4 text-primary" />{partnerCount > 0 ? "View verified partner details" : "Partner details pending verification"}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-brand-gold/40 bg-brand-gold/10 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3"><ShieldCheck className="size-8" /><h2 className="font-display text-xl font-bold">Important Notice</h2></div>
          <p className="text-sm leading-6 text-muted-foreground sm:border-s sm:border-border sm:ps-4">{text("umrah-landing-notice", "This Umrah section is a support and planning service only. It is not an investment platform. We do not guarantee earnings, visas or travel. All travel arrangements are made through independent partners. Please do your own research.")}</p>
        </section>
      </div>
    </div>
  );
}
