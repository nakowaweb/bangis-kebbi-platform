import { Link, createFileRoute } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";

import { SectionShell } from "@/components/platform-sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  head: () =>
    pageHead({
      title: "Login — BangisKebbi.com Member Access",
      description: "Future member login for BangisKebbi.com community, Umrah support, Foundation contributions and dashboard access.",
      path: "/login",
    }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <main>
      <SectionShell eyebrow="Member Access" title="Login" description="Member accounts will be connected in a later phase after the Phase 1 design review.">
        <form className="mx-auto grid max-w-md gap-4 rounded-xl border border-border bg-card p-6 shadow-platform">
          <LockKeyhole className="h-8 w-8 text-brand-cyan" />
          <Input type="email" placeholder="Email" aria-label="Email" required />
          <Input type="password" placeholder="Password" aria-label="Password" required />
          <Button type="submit" className="h-12">Login</Button>
          <Link to="/forgot-password" className="text-sm font-semibold text-brand-cyan">Forgot password?</Link>
          <Link to="/register" className="text-sm font-semibold text-brand-cyan">Create an account</Link>
        </form>
      </SectionShell>
    </main>
  );
}
