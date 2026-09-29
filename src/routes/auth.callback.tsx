import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { authDestination, takeAuthDestination } from "@/lib/auth-destination";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/auth/callback")({
  head: () => pageHead({ title: "Completing sign in — BangisKebbi.com", description: "Securely completing your BangisKebbi.com sign in.", path: "/auth/callback", noindex: true }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function finishSignIn() {
      const params = new URLSearchParams(window.location.search);
      const callbackError = params.get("error_description") ?? params.get("error");
      if (callbackError) { setError(callbackError); return; }

      const user = await waitForAuthenticatedUser();
      if (!active) return;
      if (!user) {
        setError("Your Google session could not be completed. Please return to Login and try again.");
        return;
      }
      const to = await authDestination(user.id, takeAuthDestination());
      if (active) await navigate({ to, replace: true });
    }
    void finishSignIn();
    return () => { active = false; };
  }, [navigate]);

  return <main className="grid min-h-[55vh] place-items-center px-4 py-12"><div className="max-w-md text-center">{error ? <><h1 className="font-display text-2xl font-bold">Sign in was not completed</h1><p role="alert" className="mt-3 text-sm text-muted-foreground">{error}</p><Button className="mt-6" onClick={() => navigate({ to: "/login", replace: true })}>Return to Login</Button></> : <><LoaderCircle className="mx-auto size-8 animate-spin text-primary" /><h1 className="mt-4 font-display text-2xl font-bold">Completing your sign in</h1><p className="mt-2 text-sm text-muted-foreground">Please wait while we securely open your account.</p></>}</div></main>;
}

async function waitForAuthenticatedUser() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data } = await supabase.auth.getUser();
    if (data.user) return data.user;
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }
  return null;
}