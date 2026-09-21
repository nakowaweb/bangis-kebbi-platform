import { Link, createFileRoute } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { SectionShell } from "@/components/platform-sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

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
  const [busy, setBusy] = useState(false);
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    window.location.assign("/dashboard");
  }
  async function signInWithGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(result.error.message); setBusy(false); return; }
    if (result.redirected) return;
    window.location.assign("/dashboard");
  }
  return (
    <main>
      <SectionShell eyebrow="Secure Access" title="Login" description="Sign in to your account. Content-management access is restricted by administrator role.">
        <form onSubmit={signIn} className="mx-auto grid max-w-md gap-4 rounded-xl border border-border bg-card p-6 shadow-platform">
          <LockKeyhole className="h-8 w-8 text-brand-cyan" />
          <Input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" required />
          <Input name="password" type="password" placeholder="Password" aria-label="Password" autoComplete="current-password" required />
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
