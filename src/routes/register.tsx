import { Link, createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { SectionShell } from "@/components/platform-sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";

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
  const [busy, setBusy] = useState(false);
  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password: String(form.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { full_name: String(form.get("fullName")), phone: String(form.get("phone")), country: String(form.get("country")) },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Check your email to confirm your account, then sign in.");
    event.currentTarget.reset();
  }
  return (
    <main>
      <SectionShell eyebrow="Join Now" title="Register" description="Create a secure account. Member services remain planned for a later phase.">
        <form onSubmit={register} className="mx-auto grid max-w-2xl gap-4 rounded-xl border border-border bg-card p-6 shadow-platform">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="fullName" placeholder="Full Name" aria-label="Full Name" autoComplete="name" required />
            <Input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="phone" type="tel" placeholder="Phone" aria-label="Phone" autoComplete="tel" required />
            <Input name="country" placeholder="Country" aria-label="Country" autoComplete="country-name" required />
          </div>
          <Input name="password" type="password" minLength={8} placeholder="Password" aria-label="Password" autoComplete="new-password" required />
          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input type="checkbox" required className="mt-1 h-4 w-4 accent-brand-cyan" />
            <span>I accept the terms and community guidelines.</span>
          </label>
          <Button type="submit" className="h-12" disabled={busy}>{busy ? "Creating account…" : "Create Account"}</Button>
          <Link to="/login" className="text-sm font-semibold text-brand-cyan">Already have an account?</Link>
        </form>
      </SectionShell>
    </main>
  );
}
