import { createFileRoute } from "@tanstack/react-router";

import { SectionShell } from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "Terms — BangisKebbi.com",
      description: "Terms placeholder for BangisKebbi.com services, community features and future member access.",
      path: "/terms",
    }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main>
      <SectionShell eyebrow="Terms" title="Terms of Use" description="Detailed terms should be reviewed and supplied by the owner before launch.">
        <div className="prose-platform rounded-xl border border-border bg-card p-6 shadow-platform">
          <p>BangisKebbi.com provides digital services, community information and future member features for legitimate opportunities and support programs.</p>
          <p>The platform does not present Foundation contributions or business opportunities as investments or promised financial returns.</p>
        </div>
      </SectionShell>
    </main>
  );
}
