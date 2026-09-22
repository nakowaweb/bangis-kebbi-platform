import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import appIconAsset from "@/assets/bangis-app-icon.png.asset.json";
import { SectionShell } from "@/components/platform-sections";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/projects/bangiskebbi-com")({
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "BangisKebbi.com Project — Global Digital Platform",
      description:
        "Project detail for BangisKebbi.com, a premium personal-brand and business platform for ideas, technology, business and people.",
      path: "/projects/bangiskebbi-com",
    }),
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const points = ["Personal brand platform", "Business and opportunity sections", "Umrah and Foundation landing experiences", "Multilingual-ready architecture"];

  return (
    <main>
      <SectionShell eyebrow="Project Detail" title="BangisKebbi.com" description="A complete new premium design direction for a global digital platform.">
        <Button variant="outline" className="mb-6" asChild>
          <Link to="/projects"><ArrowLeft /> Back to projects</Link>
        </Button>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="platform-preview flex min-h-96 items-center justify-center rounded-xl border border-border p-10 shadow-platform">
            <img src={appIconAsset.url} alt="BangisKebbi.com project icon" className="h-36 w-36 rounded-3xl object-contain shadow-platform" />
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-platform">
            <h2 className="font-display text-2xl font-bold text-foreground">Project scope</h2>
            <div className="mt-5 grid gap-3">
              {points.map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-lg bg-secondary p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
                  <span className="text-sm font-semibold text-foreground">{point}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-7 text-muted-foreground">This page is ready for future case-study images, live links, technology notes and measurable outcomes when they are verified by the owner.</p>
          </div>
        </div>
      </SectionShell>
    </main>
  );
}
