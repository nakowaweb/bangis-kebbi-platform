import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { SectionShell } from "@/components/platform-sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { authDestination, rememberAuthDestination } from "@/lib/auth-destination";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: (search) => searchSchema.parse(search),
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "Login — BangisKebbi.com Member Access",
      description: "Member login for BangisKebbi.com community, Umrah support, Foundation contributions and dashboard access.",
      path: "/login",
      noindex: true,
    }),
  component: LoginPage,
});

function safePath(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    setError(null);
    setUnconfirmedEmail(null);
    setBusy(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: String(form.get("password")),
      });
      if (signInError || !data.session) {
        const message = signInError?.message ?? "We could not start your session. Please try again.";
        if (/confirm/i.test(message)) setUnconfirmedEmail(email);
        setError(message);
        toast.error(message);
        return;
      }
      const to = await authDestination(data.session.user.id, safePath(search.redirect));
      await navigate({ to, replace: true });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Network error. Please check your connection and try again.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    if (!unconfirmedEmail) return;
    setBusy(true);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: unconfirmedEmail,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    setBusy(false);
    if (resendError) { setError(resendError.message); toast.error(resendError.message); return; }
    toast.success("Confirmation email sent again. Please check your inbox and spam folder.");
  }

  async function signInWithGoogle() {
    setError(null);
    setBusy(true);
    try {
      rememberAuthDestination(safePath(search.redirect));
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) { setError(result.error.message); toast.error(result.error.message); return; }
      if (result.redirected) return;
      const { data } = await supabase.auth.getUser();
      const to = data.user ? await authDestination(data.user.id, safePath(search.redirect)) : "/dashboard";
      await navigate({ to, replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <SectionShell eyebrow="Secure Access" title="Login" description="Welcome back! Sign in to your BangisKebbi.com account.">
        <form onSubmit={signIn} className="mx-auto grid max-w-md gap-4 rounded-xl border border-border bg-card p-6 shadow-platform">
          <LockKeyhole className="h-8 w-8 text-brand-cyan" />
          <Input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" required />
          <Input name="password" type="password" placeholder="Password" aria-label="Password" autoComplete="current-password" required />
          {error ? (
            <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <p>{error}</p>
              {unconfirmedEmail ? (
                <button type="button" onClick={resendConfirmation} disabled={busy} className="mt-2 font-semibold underline">
                  Resend the confirmation email
                </button>
              ) : null}
            </div>
          ) : null}
          <Button type="submit" className="h-12" disabled={busy}>{busy ? "Signing in…" : "Login"}</Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
          <Button type="button" variant="outline" className="h-12" disabled={busy} onClick={signInWithGoogle}>Continue with Google</Button>
          <Link to="/forgot-password" className="text-sm font-semibold text-brand-cyan">Forgot password?</Link>
          <Link to="/register" className="text-sm font-semibold text-brand-cyan">Create an account</Link>
        </form>
      </SectionShell>
    </main>
  );
}
