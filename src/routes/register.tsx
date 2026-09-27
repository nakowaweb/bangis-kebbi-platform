import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { SectionShell } from "@/components/platform-sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CountryRegionFields } from "@/components/umrah/country-region-select";
import { pageHead } from "@/lib/seo";
import { languages } from "@/lib/i18n/dictionary";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: ({ match }) =>
    pageHead({ search: match.search,
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    setError(null);
    if (!String(form.get("country") ?? "").trim() || !String(form.get("city") ?? "").trim()) {
      setError("Please select your country and city.");
      return;
    }
    if (!password || !confirmPassword) {
      setError("Please enter and confirm your password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: String(form.get("fullName")),
          phone: String(form.get("phone")),
          country: String(form.get("country")),
          city: String(form.get("city")),
          region: String(form.get("region") ?? ""),
          preferred_language: String(form.get("preferredLanguage") || "en"),
        },
      },
    });
    setBusy(false);
    if (signUpError) {
      const raw = signUpError.message.toLowerCase();
      const message = raw.includes("password") && (raw.includes("weak") || raw.includes("at least") || raw.includes("easy to guess") || raw.includes("strength") || raw.includes("characters"))
        ? "That password is too weak. Use at least 8 characters with a mix of letters, numbers and symbols."
        : signUpError.message;
      setError(message);
      toast.error(message);
      return;
    }
    // Registration never keeps the visitor signed in; they sign in on the Login page.
    if (data.session) await supabase.auth.signOut();
    toast.success("Account created. Please sign in with your email and password.");
    await navigate({ to: "/login", replace: true });
  }
  return (
    <main>
      <SectionShell eyebrow="Join Now" title="Register" description="Create your account and become part of our growing global community.">
        <form onSubmit={register} className="mx-auto grid max-w-2xl gap-4 rounded-xl border border-border bg-card p-6 shadow-platform">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="fullName" placeholder="Full Name" aria-label="Full Name" autoComplete="name" required />
            <Input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="phone" type="tel" placeholder="Phone" aria-label="Phone" autoComplete="tel" required />
            <select name="preferredLanguage" aria-label="Preferred language" defaultValue="en" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              {languages.map((item) => <option key={item.code} value={item.code}>{item.flag} {item.nativeLabel}</option>)}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <CountryRegionFields countryName="country" regionName="region" cityName="city" countryLabel="Country" showLabels={false} />
          </div>
          <div className="relative">
            <Input name="password" type={showPassword ? "text" : "password"} minLength={8} placeholder="Password" aria-label="Password" autoComplete="new-password" className="pr-11" required />
            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <Input name="confirmPassword" type={showConfirm ? "text" : "password"} minLength={8} placeholder="Confirm Password" aria-label="Confirm Password" autoComplete="new-password" className="pr-11" required />
            <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"} className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Use at least 8 characters, and avoid common or leaked passwords.</p>
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
