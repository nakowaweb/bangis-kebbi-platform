import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, SearchCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { testGoogleSearchCx } from "@/lib/content.functions";

export function SearchConfigTest({ cx }: { cx: string }) {
  const test = useServerFn(testGoogleSearchCx);
  const [state, setState] = useState<{ status: "idle" | "testing" | "ok" | "fail"; message?: string }>({ status: "idle" });
  useEffect(() => setState({ status: "idle" }), [cx]);
  async function run() {
    setState({ status: "testing" });
    try {
      const result = await test({ data: { cx: cx.trim() } });
      setState({ status: result.ok ? "ok" : "fail", message: result.message });
    } catch (error) {
      setState({ status: "fail", message: error instanceof Error ? error.message : "Test failed." });
    }
  }
  return (
    <div className="mt-3 grid gap-2">
      <Button type="button" size="sm" variant="outline" className="w-fit" disabled={!cx.trim() || state.status === "testing"} onClick={run}>
        {state.status === "testing" ? <Loader2 className="animate-spin" /> : <SearchCheck />} Test Search Configuration
      </Button>
      {state.status === "ok" ? <p className="flex items-center gap-2 text-xs text-primary"><CheckCircle2 className="size-4" /> {state.message}</p> : null}
      {state.status === "fail" ? <p className="flex items-center gap-2 text-xs text-destructive"><XCircle className="size-4" /> {state.message}</p> : null}
    </div>
  );
}
