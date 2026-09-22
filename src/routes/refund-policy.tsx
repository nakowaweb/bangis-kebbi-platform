import { createFileRoute } from "@tanstack/react-router";

import { SectionShell } from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/refund-policy")({
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "Refund Policy — BangisKebbi.com",
      description: "Refund policy placeholder for future payments, support programs and contribution workflows on BangisKebbi.com.",
      path: "/refund-policy",
    }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <main>
      <SectionShell eyebrow="Refund Policy" title="Refund Policy" description="Future payment and refund rules should be confirmed by the owner and any verified partners before processing payments.">
        <div className="prose-platform rounded-xl border border-border bg-card p-6 shadow-platform">
          <p>Refund requests, payment requests and contribution confirmations are planned for secure authenticated access in a later phase.</p>
          <p>No payment flow is active in Phase 1.</p>
        </div>
      </SectionShell>
    </main>
  );
}
