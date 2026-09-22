import { Link, createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { SectionShell } from "@/components/platform-sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () =>
    pageHead({
      title: "Forgot Password — BangisKebbi.com",
      description: "Future password recovery page for secure BangisKebbi.com member access.",
      path: "/forgot-password",
      noindex: true,
    }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [busy, setBusy] = useState(false);
  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(String(form.get("email")), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("If an account exists, a recovery email has been sent.");
  }
  return (
    <main>
      <SectionShell eyebrow="Account Recovery" title="Forgot Password" description="Request a secure password recovery email for your account.">
        <form onSubmit={resetPassword} className="mx-auto grid max-w-md gap-4 rounded-xl border border-border bg-card p-6 shadow-platform">
          <Input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" required />
          <Button type="submit" className="h-12" disabled={busy}>{busy ? "Sending…" : "Send Reset Link"}</Button>
          <Link to="/login" className="text-sm font-semibold text-brand-cyan">Back to login</Link>
        </form>
      </SectionShell>
    </main>
  );
}