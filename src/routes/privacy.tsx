import { createFileRoute } from "@tanstack/react-router";

import { SectionShell } from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead({
      title: "Privacy Policy — BangisKebbi.com",
      description: "Privacy principles for BangisKebbi.com member accounts, contact messages, applications and future private documents.",
      path: "/privacy",
    }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main>
      <SectionShell eyebrow="Privacy" title="Privacy Policy" description="Detailed legal wording should be reviewed and supplied by the owner before public launch.">
        <div className="prose-platform rounded-xl border border-border bg-card p-6 shadow-platform">
          <p>BangisKebbi.com is designed to protect member information, application records and sensitive documents with private access controls before any live data collection begins.</p>
          <p>Donor information, identity documents and account details should not be publicly exposed.</p>
        </div>
      </SectionShell>
    </main>
  );
}
