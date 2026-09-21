import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock3, LockKeyhole, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import appIconAsset from "@/assets/bangis-app-icon.png.asset.json";
import portraitAsset from "@/assets/bangis-portrait-source.png.asset.json";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  aboutAreas,
  aboutFacts,
  blogPosts,
  businessCategories,
  contactLinks,
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

export function HeroSection() {
  return (
    <section className="hero-surface overflow-hidden border-b border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] lg:px-8 lg:py-20">
        <div className="flex min-w-0 flex-col justify-center">
          <Badge className="w-fit border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/10">GLOBAL VISION • REAL IMPACT</Badge>
          <h1 className="mt-6 max-w-4xl font-display text-4xl font-extrabold leading-tight text-primary-foreground sm:text-5xl lg:text-7xl">
            TURNING IDEAS INTO <span className="text-brand-cyan">REAL OPPORTUNITIES</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-primary-foreground/82 sm:text-lg">
            I am Abubakar Alhaji Abubakar (Bangis Kebbi Nakowa), a digital entrepreneur, AI-assisted web designer and developer, business promoter, researcher and community builder. I create digital solutions, connect people to opportunities, and build platforms designed for meaningful impact.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button className="h-12 bg-brand-cyan px-6 text-brand-ink shadow-glow hover:bg-brand-cyan-soft" asChild>
              <Link to="/contact">HIRE ME <ArrowRight /></Link>
            </Button>
            <Button variant="outline" className="h-12 border-primary-foreground/25 bg-primary-foreground/5 px-6 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/projects">EXPLORE MY WORK</Link>
            </Button>
            <Button variant="outline" className="h-12 border-brand-green/40 bg-brand-green/10 px-6 text-primary-foreground hover:bg-brand-green/20" asChild>
              <Link to="/community">JOIN THE COMMUNITY</Link>
            </Button>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickStats.map((item) => (
              <div key={item.label} className="rounded-lg border border-primary-foreground/12 bg-primary-foreground/7 p-4 backdrop-blur">
                <item.icon className="h-5 w-5 text-brand-cyan" />
                <p className="mt-3 text-sm font-bold text-primary-foreground">{item.label}</p>
                <p className="mt-1 text-xs text-primary-foreground/70">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative min-h-[520px] lg:min-h-[640px]">
          <div className="absolute inset-x-8 top-8 h-44 rounded-full bg-brand-cyan/20 blur-3xl" />
          <div className="relative h-full overflow-hidden rounded-xl border border-primary-foreground/14 bg-primary-foreground/8 shadow-platform backdrop-blur">
            <div className="absolute inset-0 workspace-grid" />
            <div className="absolute left-5 right-5 top-5 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-primary-foreground/12 bg-brand-ink/75 p-4 backdrop-blur">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase text-brand-cyan">More than a website</p>
                <p className="truncate text-sm text-primary-foreground/80">A global platform</p>
              </div>
              <img src={appIconAsset.url} alt="Bangis Kebbi app icon" className="h-12 w-12 shrink-0 rounded-lg object-contain" />
            </div>
            <img src={portraitAsset.url} alt="Abubakar Alhaji Abubakar portrait" className="absolute bottom-0 left-1/2 z-10 h-[82%] max-w-none -translate-x-1/2 object-contain" />
            <div className="absolute bottom-5 left-5 right-5 z-20 rounded-lg border border-primary-foreground/12 bg-brand-ink/80 p-4 backdrop-blur">
              <p className="text-sm font-semibold text-primary-foreground">Technology gives you tools, but people give you opportunities.</p>
              <p className="mt-2 text-xs text-primary-foreground/70">Ideas • Technology • Business • People</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PillarsSection() {
  return (
    <SectionShell eyebrow="Brand pillars" title="Ideas, technology, business and people working together." description="BangisKebbi.com is designed as a practical platform for learning, connection, building, support, growth and achievement.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {philosophyCards.map((item) => (
          <FeatureCard key={item.title} icon={item.icon} title={item.title} description={item.description} />
        ))}
      </div>
    </SectionShell>
  );
}

export function AboutPreview() {
  return (
    <SectionShell eyebrow="About Bangis Kebbi" title="A professional digital identity with a people-first mission." description="Abubakar Alhaji Abubakar combines AI-assisted design, development, business promotion and community building into one purposeful platform.">
      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-platform">
          <img src={portraitAsset.url} alt="Abubakar Alhaji Abubakar" className="mx-auto h-[440px] w-full object-contain object-bottom" />
        </div>
        <div className="grid content-center gap-6">
          <div className="grid gap-3">
            {aboutFacts.map((fact) => (
              <div key={fact} className="flex items-start gap-3 rounded-lg border border-border bg-secondary p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
                <p className="text-sm font-semibold text-foreground">{fact}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {aboutAreas.map((area) => (
              <Badge key={area} variant="secondary" className="border-border bg-background text-foreground">
                {area}
              </Badge>
            ))}
          </div>
          <Button className="w-fit bg-primary text-primary-foreground" asChild>
            <Link to="/about">VIEW MY JOURNEY <ArrowRight /></Link>
          </Button>
        </div>
      </div>
    </SectionShell>
  );
}

export function ServicesSection({ full = false }: { full?: boolean }) {
  return (
    <SectionShell eyebrow="Services" title="Premium digital services for brands, businesses and communities." description="Clear, responsive and practical work across design, development, UI/UX and digital business support.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {serviceCards.map((service) => (
          <FeatureCard key={service.title} icon={service.icon} title={service.title} description={service.description} action="Learn More" href="/services" />
        ))}
      </div>
      {!full && (
        <div className="mt-8">
          <Button variant="outline" asChild>
            <Link to="/services">View all services <ArrowRight /></Link>
          </Button>
        </div>
      )}
    </SectionShell>
  );
}

export function ProjectsSection({ full = false }: { full?: boolean }) {
  return (
    <SectionShell eyebrow="Selected Work" title="Digital products, websites and experiences designed to turn ideas into practical solutions." description="The portfolio is prepared for future projects, case studies and category filtering.">
      <div className="mb-6 flex flex-wrap gap-2">
        {projectCategories.map((category) => (
          <Badge key={category} variant="outline" className="bg-background text-muted-foreground">
            {category}
          </Badge>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {projects.map((project) => (
          <article key={project.slug} className="overflow-hidden rounded-xl border border-border bg-card shadow-platform">
            <div className="platform-preview flex min-h-64 items-center justify-center p-8">
              <img src={appIconAsset.url} alt="BangisKebbi.com project" className="h-28 w-28 rounded-2xl object-contain shadow-platform" />
            </div>
            <div className="p-6">
              <Badge className="bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/10">{project.category}</Badge>
              <h3 className="mt-4 font-display text-2xl font-bold text-foreground">{project.name}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{project.description}</p>
              <Button className="mt-5" asChild>
                <Link to="/projects/bangiskebbi-com">View Project <ArrowRight /></Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
      {!full && (
        <div className="mt-8">
          <Button variant="outline" asChild>
            <Link to="/projects">Explore portfolio <ArrowRight /></Link>
          </Button>
        </div>
      )}
    </SectionShell>
  );
}

export function BusinessSection() {
  return (
    <SectionShell eyebrow="Business & Opportunities" title="Connecting people, ideas, technology and legitimate opportunities." description="Bangis Kebbi promotes digital services, professional networking and community-led opportunity without investment promises or financial return claims.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {businessCategories.map((item) => (
          <FeatureCard key={item.title} icon={item.icon} title={item.title} description="A focused pathway for trusted connection and practical progress." />
        ))}
      </div>
    </SectionShell>
  );
}

export function CommunitySection() {
  return (
    <SectionShell eyebrow="Bangis Kebbi Community" title="A human network for learning, entrepreneurship and meaningful support." description="The community is built to share useful information, support learning, technology, entrepreneurship and legitimate opportunities.">
      <div className="rounded-xl border border-border bg-brand-ink p-6 text-primary-foreground shadow-platform sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="max-w-3xl text-lg leading-8 text-primary-foreground/82">Members will eventually be able to register for an account, complete a profile and access community features from a secure dashboard.</p>
          </div>
          <Button className="bg-brand-cyan text-brand-ink hover:bg-brand-cyan-soft" asChild>
            <Link to="/register">JOIN THE COMMUNITY <ArrowRight /></Link>
          </Button>
        </div>
      </div>
    </SectionShell>
  );
}

export function UmrahSection() {
  return (
    <SectionShell eyebrow="Umrah Support Program" title="Organized Umrah application and coordination support." description="Supporting members through an organized Umrah application and coordination process, ready for future verified travel or Umrah partner configuration.">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-3">
          {umrahProcess.map((step, index) => (
            <div key={step} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-gold/18 text-sm font-bold text-brand-ink">{index + 1}</span>
              <p className="min-w-0 text-sm font-semibold text-foreground">{step}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-secondary p-6">
          <div className="flex items-center gap-3">
            <LockKeyhole className="h-6 w-6 text-brand-cyan" />
            <h3 className="font-display text-xl font-bold text-foreground">Status tracking</h3>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {umrahStatuses.map((status) => (
              <Badge key={status} variant="outline" className="bg-background text-muted-foreground">
                {status}
              </Badge>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-muted-foreground">Sensitive identity documents are planned for private storage with authorization before any live application flow is launched.</p>
        </div>
      </div>
    </SectionShell>
  );
}

export function FoundationSection() {
  return (
    <SectionShell eyebrow="Bangis Kebbi Foundation" title="Community-support initiatives with transparency and care." description="The Foundation is prepared for approved support initiatives, contribution confirmations and private contribution history without investment language or promised returns.">
      <div className="grid gap-4 md:grid-cols-3">
        {foundationInitiatives.map((initiative) => (
          <article key={initiative.title} className="rounded-xl border border-border bg-card p-6 shadow-platform">
            <div className="h-32 rounded-lg bg-brand-gold/15" />
            <Badge className="mt-5 bg-brand-green/10 text-brand-green hover:bg-brand-green/10">{initiative.status}</Badge>
            <h3 className="mt-4 font-display text-xl font-bold text-foreground">{initiative.title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{initiative.description}</p>
            <Button variant="outline" className="mt-5" asChild>
              <Link to="/foundation">View initiative</Link>
            </Button>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

export function BlogPreview() {
  return (
    <SectionShell eyebrow="Blog & Updates" title="Knowledge sharing across technology, AI, web design, business and community." description="SEO-friendly publishing is prepared for articles, drafts, scheduled posts and future admin workflows.">
      <div className="grid gap-4 md:grid-cols-3">
        {blogPosts.map((post) => (
          <article key={post.title} className="rounded-xl border border-border bg-card p-6 shadow-platform">
            <Badge variant="secondary" className="bg-secondary text-foreground">{post.category}</Badge>
            <h3 className="mt-4 font-display text-xl font-bold text-foreground">{post.title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
            <Button variant="link" className="mt-4 px-0" asChild>
              <Link to="/blog">Read update <ArrowRight /></Link>
            </Button>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

export function DashboardPreviewSection() {
  return (
    <SectionShell eyebrow="Member experience" title="A future-ready member dashboard without exposing private data." description="The app structure is prepared for profile, verification, applications, payments, contributions, notifications, support and settings.">
      <div className="rounded-xl border border-border bg-card p-4 shadow-platform sm:p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border pb-5">
          <div className="min-w-0">
            <h3 className="truncate font-display text-2xl font-bold text-foreground">Welcome, Member</h3>
            <p className="mt-1 text-sm text-muted-foreground">Overview • Profile • Verification • Applications • Documents • Payments</p>
          </div>
          <Badge className="shrink-0 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/10">Preview</Badge>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {dashboardPreview.map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-secondary p-4">
              <item.icon className="h-5 w-5 text-brand-cyan" />
              <p className="mt-3 text-sm font-bold text-foreground">{item.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-3 bg-secondary px-4 py-3 text-xs font-bold uppercase text-muted-foreground">
            <span>Item</span>
            <span>Status</span>
            <span>Updated</span>
          </div>
          {["Umrah application", "Foundation contribution", "Support message"].map((item) => (
            <div key={item} className="grid grid-cols-3 border-t border-border px-4 py-3 text-sm text-foreground">
              <span className="truncate">{item}</span>
              <span className="truncate">Empty state</span>
              <span className="truncate">Not started</span>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

export function ContactSection() {
  return (
    <SectionShell eyebrow="Contact" title="Start a professional conversation." description="Send a message about web design, development, business promotion, community support or platform collaboration.">
      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-xl border border-border bg-brand-ink p-6 text-primary-foreground shadow-platform">
          <h3 className="font-display text-2xl font-bold">BangisKebbi.com</h3>
          <p className="mt-4 text-sm leading-7 text-primary-foreground/78">Turning Ideas Into Real Opportunities.</p>
          <div className="mt-6 grid gap-3">
            {contactLinks.map((link) => (
              <Button key={link.label} variant="outline" className="justify-start border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/10">
                <link.icon />
                {link.label}
              </Button>
            ))}
          </div>
        </div>
        <form className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-platform">
          <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input required placeholder="Name" aria-label="Name" />
            <Input required type="email" placeholder="Email" aria-label="Email" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input placeholder="Phone" aria-label="Phone" />
            <Input required placeholder="Subject" aria-label="Subject" />
          </div>
          <Textarea required placeholder="Message" aria-label="Message" className="min-h-36" />
          <Button type="submit" className="h-12 bg-primary text-primary-foreground">Send Message</Button>
        </form>
      </div>
    </SectionShell>
  );
}

export function TestimonialsPlaceholder() {
  return (
    <SectionShell eyebrow="Testimonials" title="Real testimonials will appear after they are supplied by the owner." description="No client statements, awards or endorsements are invented in this Phase 1 design.">
      <div className="grid gap-4 md:grid-cols-3">
        {["Client name", "Community member", "Business contact"].map((item) => (
          <div key={item} className="rounded-xl border border-dashed border-border bg-secondary p-6">
            <Clock3 className="h-6 w-6 text-brand-cyan" />
            <p className="mt-4 text-sm font-semibold text-foreground">{item}</p>
            <p className="mt-2 text-sm text-muted-foreground">Placeholder reserved for a verified testimonial.</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export function SectionShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section className="border-b border-border bg-background py-14 sm:py-18 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 max-w-3xl">
          <Badge variant="outline" className="border-brand-cyan/30 bg-brand-cyan/8 text-brand-cyan">{eyebrow}</Badge>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">{title}</h2>
          {description && <p className="mt-4 text-base leading-8 text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description, action, href }: { icon: LucideIcon; title: string; description: string; action?: string; href?: "/services" }) {
  const card = (
    <div className="h-full rounded-xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-brand-cyan/40">
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 font-display text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
      {action && href && (
        <Button variant="link" className="mt-4 px-0" asChild>
          <Link to={href}>{action} <ArrowRight /></Link>
        </Button>
      )}
    </div>
  );

  return card;
}
