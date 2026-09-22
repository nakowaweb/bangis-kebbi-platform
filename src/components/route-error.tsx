import { Link } from "@tanstack/react-router";

import { SectionShell } from "@/components/platform-sections";
import { Button } from "@/components/ui/button";

/**
 * Friendly fallback when a page cannot load its content (network or database problem).
 * Deliberately shows no technical detail to visitors.
 */
export function RouteError() {
  return (
    <main>
      <SectionShell
        eyebrow="Temporary problem"
        title="This page could not load"
        description="Something went wrong while loading this content. Please check your connection and try again in a moment."
      >
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => window.location.reload()}>Try again</Button>
          <Button asChild variant="outline">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </SectionShell>
    </main>
  );
}
