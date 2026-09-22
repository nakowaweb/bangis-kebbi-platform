import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
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
      noindex: true,
    }),
  component: RegisterPage,
});

function RegisterPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password: String(form.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: String(form.get("fullName")),
          phone: String(form.get("phone")),
          country: String(form.get("country")),
          city: String(form.get("city")),
          preferred_language: String(form.get("preferredLanguage") || "en"),
        },
      },
    });
    setBusy(false);
    if (signUpError) { setError(signUpError.message); toast.error(signUpError.message); return; }
    toast.success("Welcome to BangisKebbi.com");
    if (data.session) { await navigate({ to: "/dashboard", replace: true }); return; }
    await navigate({ to: "/login", replace: true });
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="city" placeholder="City" aria-label="City" autoComplete="address-level2" required />
            <select name="preferredLanguage" aria-label="Preferred language" defaultValue="en" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="en">English</option>
              <option value="ha">Hausa</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
          <Input name="password" type="password" minLength={8} placeholder="Password" aria-label="Password" autoComplete="new-password" required />
          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input type="checkbox" required className="mt-1 h-4 w-4 accent-brand-cyan" />
            <span>I accept the terms and community guidelines.</span>
          </label>
          {error ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="h-12" disabled={busy}>{busy ? "Creating account…" : "Create Account"}</Button>
          <Link to="/login" className="text-sm font-semibold text-brand-cyan">Already have an account?</Link>
        </form>
      </SectionShell>
    </main>
  );
}
