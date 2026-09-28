import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList, FileText, Wallet } from "lucide-react";
import { MemberUmrahPanel } from "@/components/umrah/member-umrah";
import { UmrahGoalPanel, UmrahRecordsPanel } from "@/components/umrah/umrah-goal";

type Tab = "application" | "goal" | "records";

export const Route = createFileRoute("/_authenticated/my-umrah")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab | undefined } => ({ tab: (["application", "goal", "records"] as const).find((t) => t === s["tab"]) }),
  head: () => ({ meta: [
    { title: "My Umrah — Bangis Kebbi" },
    { name: "description", content: "Your private Umrah application, personal goal and records." },
    { property: "og:title", content: "My Umrah — Bangis Kebbi" },
    { property: "og:description", content: "Your private Umrah application, personal goal and records." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: MyUmrah,
});

const tabs = [
  { id: "application", label: "Application", icon: FileText },
  { id: "goal", label: "My Umrah Goal", icon: Wallet },
  { id: "records", label: "My Records", icon: ClipboardList },
] as const;

function MyUmrah() {
  const { user } = Route.useRouteContext();
  const tab: Tab = Route.useSearch().tab ?? "application";
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/umrah" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to Umrah</Link>
      <h1 className="mt-3 font-display text-3xl font-bold">My Umrah</h1>
      <nav className="mt-5 flex gap-2 overflow-x-auto border-b border-border" aria-label="Umrah sections">
        {tabs.map((t) => (
          <Link key={t.id} to="/my-umrah" search={{ tab: t.id }} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm font-semibold ${tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}><t.icon className="size-4" />{t.label}</Link>
        ))}
      </nav>
      <div className="mt-6">
        {tab === "application" ? <MemberUmrahPanel userId={user.id} /> : tab === "goal" ? <UmrahGoalPanel userId={user.id} /> : <UmrahRecordsPanel userId={user.id} />}
      </div>
    </main>
  );
}
