import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { SectionShell } from "@/components/platform-sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/reset-password")({
  head: () =>
    pageHead({
      title: "Set a New Password — BangisKebbi.com",
      description: "Securely set a new password for your BangisKebbi.com member account.",
      path: "/reset-password",
      noindex: true,
    }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) setRecovery(true);
    void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirm"))) { toast.error("Passwords do not match."); return; }
    setBusy(true);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const { error } = await supabase.auth.updateUser(
      recovery || !currentPassword ? { password } : ({ password, current_password: currentPassword } as never),
    );
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated.");
    await navigate({ to: "/dashboard" });
  }

  return (
    <main>
      <SectionShell eyebrow="Account Security" title="Set a New Password" description="Choose a strong password of at least 8 characters.">
        <form onSubmit={updatePassword} className="mx-auto grid max-w-md gap-4 rounded-xl border border-border bg-card p-6 shadow-platform">
          {!recovery && signedIn ? (
            <Input name="currentPassword" type="password" placeholder="Current password" aria-label="Current password" autoComplete="current-password" required />
          ) : null}
          <Input name="password" type="password" minLength={8} placeholder="New password" aria-label="New password" autoComplete="new-password" required />
          <Input name="confirm" type="password" minLength={8} placeholder="Confirm new password" aria-label="Confirm new password" autoComplete="new-password" required />
          <Button type="submit" className="h-12" disabled={busy}>{busy ? "Updating…" : "Update Password"}</Button>
          <Link to="/login" className="text-sm font-semibold text-brand-cyan">Back to login</Link>
        </form>
      </SectionShell>
    </main>
  );
}
