import { Link, createFileRoute } from "@tanstack/react-router";

import { SectionShell } from "@/components/platform-sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/register")({
  head: () =>
    pageHead({
      title: "Register — Join BangisKebbi.com Community",
      description: "Future registration page for BangisKebbi.com members with profile, verification, applications and community access.",
      path: "/register",
    }),
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <main>
      <SectionShell eyebrow="Join Now" title="Register" description="The form structure is ready for secure member registration in a later phase.">
        <form className="mx-auto grid max-w-2xl gap-4 rounded-xl border border-border bg-card p-6 shadow-platform">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input placeholder="Full Name" aria-label="Full Name" required />
            <Input type="email" placeholder="Email" aria-label="Email" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input placeholder="Phone" aria-label="Phone" required />
            <Input placeholder="Country" aria-label="Country" required />
          </div>
          <Input type="password" placeholder="Password" aria-label="Password" required />
          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input type="checkbox" required className="mt-1 h-4 w-4 accent-brand-cyan" />
            <span>I accept the terms and community guidelines.</span>
          </label>
          <Button type="submit" className="h-12">Create Account</Button>
          <Link to="/login" className="text-sm font-semibold text-brand-cyan">Already have an account?</Link>
        </form>
      </SectionShell>
    </main>
  );
}
