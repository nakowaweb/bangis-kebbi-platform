import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { worldLanguages } from "@/lib/i18n/world-languages";

const REQUIRED = ["en", "ar", "ha"];

/** Super Admin control for every provider-supported language. English, Arabic and Hausa stay on. */
export function LanguageAvailability({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const list = worldLanguages.filter((l) => !q || `${l.label} ${l.nativeLabel} ${l.code}`.toLowerCase().includes(q));
  const enabled = new Set([...REQUIRED, ...value]);
  return (
    <fieldset className="grid gap-3 rounded-lg border border-border p-4">
      <legend className="px-2 text-sm font-semibold">Available website languages ({enabled.size} of {worldLanguages.length})</legend>
      <p className="text-xs text-muted-foreground">English, Arabic and Hausa stay visible in the header. Every other enabled language appears in the searchable More menu and is translated automatically by Lovable AI, then cached.</p>
      <div className="flex flex-wrap gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search languages" className="max-w-xs" />
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(worldLanguages.map((l) => l.code))}>Enable all</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(REQUIRED)}>Only primary</Button>
      </div>
      <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
        {list.map((l) => {
          const required = REQUIRED.includes(l.code);
          return (
            <label key={l.code} className="flex items-center justify-between gap-3 rounded-md border border-border p-2.5 text-sm">
              <span className="min-w-0 truncate">{l.nativeLabel} <span className="text-xs text-muted-foreground">· {l.label}</span></span>
              <Switch checked={enabled.has(l.code)} disabled={required} onCheckedChange={(next) => onChange(next ? [...new Set([...value, l.code])] : value.filter((c) => c !== l.code))} />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
