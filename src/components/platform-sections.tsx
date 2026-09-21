import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Code2,
  Globe2,
  HandHeart,
  Mail,
  MessageCircle,
  Network,
  Plane,
  type LucideIcon,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";

import appIconAsset from "@/assets/bangis-app-icon.png.asset.json";
import portraitAsset from "@/assets/bangis-portrait-source.png.asset.json";
import heroImage from "@/assets/muscat-hero.webp";
import resortImage from "@/assets/muscat-resort.webp";
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

const categoryCards: Array<{ title: string; detail: string; href: "/services" | "/business" | "/community" | "/umrah" | "/foundation" | "/about"; icon: LucideIcon; tone: string }> = [
  { title: "Web Design", detail: "Modern & responsive", href: "/services", icon: Code2, tone: "bg-primary" },
  { title: "Business", detail: "Real opportunities", href: "/business", icon: BriefcaseBusiness, tone: "bg-brand-green" },
  { title: "Community", detail: "People & network", href: "/community", icon: UsersRound, tone: "bg-primary" },
  { title: "Umrah", detail: "Support program", href: "/umrah", icon: Plane, tone: "bg-brand-gold" },
  { title: "BK Foundations", detail: "Helping people", href: "/foundation", icon: HandHeart, tone: "bg-brand-green" },
  { title: "Global Reach", detail: "Worldwide impact", href: "/about", icon: Globe2, tone: "bg-brand-ink" },
];

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-ink text-primary-foreground">
      <img src={heroImage} alt="Muscat waterfront at night" width={1600} height={900} fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-center lg:object-right" />
      <div className="absolute inset-0 -z-10 hero-surface" />
      <div className="mx-auto grid min-h-[640px] max-w-7xl items-end gap-4 px-4 pt-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(350px,.8fr)] lg:px-8 lg:pt-16">
        <div className="self-center pb-10 lg:pb-20">
          <p className="text-xs font-bold uppercase text-brand-cyan">More than a website</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-[1.02] sm:text-5xl lg:text-7xl">
            A GLOBAL PLATFORM
          </h1>
          <p className="mt-4 max-w-xl font-display text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
            Turning Ideas Into <span className="text-brand-cyan">Real Opportunities</span>
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            {["Learn", "Connect", "Build", "Support", "Grow", "Achieve"].map((word) => <span key={word} className="rounded-full border border-primary-foreground/35 px-3 py-1">{word}</span>)}
          </div>
          <p className="mt-5 max-w-lg text-sm leading-6 text-primary-foreground/80">Technology, people and practical digital solutions working together for a brighter future.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button className="h-12 bg-brand-cyan px-7 text-brand-ink shadow-glow hover:bg-brand-cyan-soft" asChild><Link to="/contact">Hire Me <ArrowRight /></Link></Button>
            <Button variant="outline" className="h-12 border-primary-foreground/35 bg-brand-ink/30 px-7 text-primary-foreground hover:bg-primary-foreground/10" asChild><Link to="/projects">Explore My Work</Link></Button>
          </div>
        </div>
        <div className="relative mx-auto h-[390px] w-full max-w-[500px] self-end sm:h-[470px] lg:h-[590px]">
          <img src={portraitAsset.url} alt="Abubakar Alhaji Abubakar, Bangis Kebbi" width={720} height={900} className="absolute bottom-0 left-1/2 h-full max-w-none -translate-x-1/2 object-contain object-bottom drop-shadow-2xl" />
          <div className="absolute bottom-5 right-0 rounded-md border border-primary-foreground/20 bg-brand-ink/85 px-4 py-3 text-xs backdrop-blur sm:bottom-8">
            <p className="font-bold">Muscat, Oman</p><p className="mt-1 text-primary-foreground/70">Working globally</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PillarsSection() {
  return (
    <section className="relative z-10 border-b border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:-mt-8 lg:grid-cols-6 lg:rounded-lg lg:bg-card lg:px-5 lg:shadow-platform">
        {categoryCards.map((item) => (
          <Link key={item.title} to={item.href} className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md border border-border bg-card p-3 transition hover:-translate-y-0.5 hover:border-brand-cyan/50 hover:shadow-platform">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${item.tone} ${item.title === "Umrah" ? "text-brand-ink" : "text-primary-foreground"}`}><item.icon className="h-5 w-5" /></span>
            <span className="min-w-0"><strong className="block truncate text-sm text-foreground">{item.title}</strong><span className="block truncate text-[11px] text-muted-foreground">{item.detail}</span></span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function AboutPreview() {
  return (
    <SectionShell eyebrow="About Me" title="A passion for technology, people and impact." description="I build practical digital solutions, connect people to opportunities and support initiatives that make a positive difference.">
      <div className="grid gap-7 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div className="relative min-h-[330px] overflow-hidden rounded-lg bg-secondary">
          <div className="absolute left-5 top-5 h-16 w-16 bg-[radial-gradient(circle,var(--brand-cyan)_2px,transparent_2px)] bg-[length:12px_12px] opacity-70" />
          <img src={portraitAsset.url} alt="Bangis Kebbi" loading="lazy" width={720} height={900} className="absolute bottom-0 left-0 h-[92%] w-[68%] object-contain object-bottom" />
          <blockquote className="absolute bottom-8 right-4 max-w-[48%] rounded-md bg-card p-4 text-xs leading-5 text-muted-foreground shadow-platform">“Technology gives you tools, but people give you opportunities.”</blockquote>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {aboutFacts.map((fact) => <div key={fact} className="flex gap-3 rounded-md border border-border bg-card p-4"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" /><p className="text-sm font-semibold">{fact}</p></div>)}
          <div className="sm:col-span-2 flex flex-wrap gap-3 pt-2"><Button asChild><Link to="/about">Work With Me <ArrowRight /></Link></Button><Button variant="outline" asChild><Link to="/contact">Let’s Connect</Link></Button></div>
        </div>
      </div>
    </SectionShell>
  );
}

export function ServicesSection({ full = false }: { full?: boolean }) {
  return (
    <SectionShell eyebrow="Services" title="Digital solutions for a better tomorrow." description="Focused, responsive work for brands, businesses and communities." action={!full ? { label: "View All Services", href: "/services" } : undefined}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {serviceCards.map((service) => <FeatureCard key={service.title} icon={service.icon} title={service.title} description={service.description} action="Learn More" href="/services" />)}
      </div>
    </SectionShell>
  );
}

const projectImages = [heroImage, resortImage, businessImage];
export function ProjectsSection({ full = false }: { full?: boolean }) {
  return (
    <SectionShell eyebrow="Featured Projects" title="Turning ideas into real results." description="Selected platform and website concepts, clearly marked until verified." action={!full ? { label: "View All Projects", href: "/projects" } : undefined}>
      {full && <div className="mb-5 flex flex-wrap gap-2">{projectCategories.map((category) => <Badge key={category} variant="outline">{category}</Badge>)}</div>}
      <div className="grid gap-4 md:grid-cols-3">
        {projects.map((project, index) => (
          <article key={project.slug} className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-platform">
            <div className="relative aspect-[16/9] overflow-hidden bg-brand-ink">
              <img src={projectImages[index] ?? heroImage} alt="" loading="lazy" width={1200} height={750} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              {index === 0 && <img src={appIconAsset.url} alt="BangisKebbi.com" loading="lazy" className="absolute left-5 top-5 h-14 w-14 rounded-lg" />}
            </div>
            <div className="p-5"><h3 className="font-display text-lg font-bold">{project.name}</h3><p className="mt-1 text-xs font-semibold text-primary">{project.category}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description}</p><Button variant="link" className="mt-2 px-0" asChild><Link to={index === 0 ? "/projects/bangiskebbi-com" : "/projects"}>View Project <ArrowRight /></Link></Button></div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

export function BusinessSection() {
  return (
    <SectionShell eyebrow="Business & Opportunities" title="Connection without borders." description="Digital services, business networking and legitimate opportunities—never investment returns or financial promises.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{businessCategories.map((item) => <FeatureCard key={item.title} icon={item.icon} title={item.title} description="A practical pathway for trusted connection and progress." />)}</div>
    </SectionShell>
  );
}

export function UmrahSection() {
  return (
    <CompactPlatform icon={Plane} eyebrow="Umrah Support Program" title="A simple, organized support journey." description="Helping members understand and follow an Umrah application and coordination process. No claim of visa authority or operator status." href="/umrah" action="Explore Umrah Support" tone="gold" />
  );
}

export function FoundationSection() {
  return (
    <CompactPlatform icon={HandHeart} eyebrow="BK Foundations" title="Supporting people and communities." description="Community contribution initiatives designed for transparent support—not investment, profit sharing or promised returns." href="/foundation" action="Support an Initiative" tone="green" />
  );
}

export function CommunitySection() {
  return (
    <CompactPlatform icon={UsersRound} eyebrow="Join Our Community" title="Connect, learn, share and grow together." description="A people-first network for learning, entrepreneurship and meaningful support." href="/register" action="Join Now" tone="blue" />
  );
}

export function BlogPreview() {
  return (
    <SectionShell eyebrow="Latest Updates" title="Insights, ideas and opportunities." description="A concise selection from technology, AI, business, community, Umrah and foundation updates." action={{ label: "View All Posts", href: "/blog" }}>
      <div className="grid gap-4 md:grid-cols-3">{blogPosts.map((post, index) => <article key={post.title} className="grid grid-cols-[96px_minmax(0,1fr)] overflow-hidden rounded-lg border border-border bg-card"><img src={projectImages[index]} alt="" loading="lazy" width={1200} height={750} className="h-full min-h-32 w-24 object-cover" /><div className="p-4"><p className="text-xs font-bold text-primary">{post.category}</p><h3 className="mt-1 font-display text-base font-bold leading-tight">{post.title}</h3><Button variant="link" className="mt-2 h-auto px-0 text-xs" asChild><Link to="/blog">Read More <ArrowRight /></Link></Button></div></article>)}</div>
    </SectionShell>
  );
}

export function ContactSection() {
  return (
    <section className="relative overflow-hidden bg-brand-ink py-12 text-primary-foreground">
      <div className="absolute inset-0 workspace-grid opacity-35" />
      <div className="relative mx-auto grid max-w-7xl gap-7 px-4 text-center sm:px-6 lg:px-8">
        <div><p className="text-xs font-bold uppercase text-brand-cyan">Contact</p><h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Let’s build something meaningful together.</h2><p className="mx-auto mt-3 max-w-2xl text-sm text-primary-foreground/75">Have a project, idea or partnership in mind? I’d love to hear from you.</p></div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row"><Button className="bg-background text-foreground hover:bg-secondary" asChild><Link to="/contact">Contact Me <ArrowRight /></Link></Button><Button variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" asChild><Link to="/contact"><MessageCircle /> WhatsApp</Link></Button><Button variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" asChild><Link to="/contact"><Mail /> Email</Link></Button></div>
      </div>
    </section>
  );
}

export function DashboardPreviewSection() {
  return <SectionShell eyebrow="Member Experience" title="A secure member space is planned for Phase 2." description="Applications, private documents, payments and member data are not active in this design phase."><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{dashboardPreview.map((item) => <FeatureCard key={item.label} icon={item.icon} title={item.label} description={item.value} />)}</div></SectionShell>;
}

export function TestimonialsPlaceholder() { return null; }

export function SectionShell({ eyebrow, title, description, action, children }: { eyebrow: string; title: string; description?: string; action?: { label: string; href: "/services" | "/projects" | "/blog" } | undefined; children: ReactNode }) {
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
