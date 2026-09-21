import { Link, createFileRoute } from "@tanstack/react-router";

import { SectionShell } from "@/components/platform-sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/forgot-password")({
  head: () =>
    pageHead({
      title: "Forgot Password — BangisKebbi.com",
      description: "Future password recovery page for secure BangisKebbi.com member access.",
      path: "/forgot-password",
    }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <main>
      <SectionShell eyebrow="Account Recovery" title="Forgot Password" description="Password reset email delivery will be connected in a later secure account phase.">
        <form className="mx-auto grid max-w-md gap-4 rounded-xl border border-border bg-card p-6 shadow-platform">
          <Input type="email" placeholder="Email" aria-label="Email" required />
          <Button type="submit" className="h-12">Send Reset Link</Button>
          <Link to="/login" className="text-sm font-semibold text-brand-cyan">Back to login</Link>
        </form>
      </SectionShell>
    </main>
  );
}