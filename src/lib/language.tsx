import { useNavigate, useRouterState } from "@tanstack/react-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  defaultLanguage,
  formatDate,
  isLanguageCode,
  languageMeta,
  languages,
  translate,
  type LanguageCode,
  type TranslationKey,
} from "@/lib/i18n/dictionary";
import { isWorldLanguage, worldLanguage, worldLanguages, type WorldLanguage } from "@/lib/i18n/world-languages";
import { LiveTranslator } from "@/lib/live-translator";

export { languages, languageMeta, formatDate, isLanguageCode, defaultLanguage };
export type { LanguageCode, TranslationKey };

const STORAGE_KEY = "bk.language";
/** Languages with fully reviewed built-in copy; every other language is translated live. */
const REVIEWED = new Set(["en", "ar", "ha"]);

type LanguageContextValue = {
  /** Reviewed dictionary language used by built-in copy (English when the active language has none). */
  language: LanguageCode;
  /** The visitor's selected language code — any provider-supported language. */
  activeLanguage: string;
  dir: "ltr" | "rtl";
  availableLanguages: typeof languages;
  /** Every enabled provider-supported language, for the searchable menu. */
  worldOptions: WorldLanguage[];
  setLanguage: (language: string) => void;
  t: (key: TranslationKey) => string;
  formatDate: (value: string | Date | null | undefined, withTime?: boolean) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function useUrlLanguage(): string | null {
  return useRouterState({
    select: (state) => {
      const value = (state.location.search as Record<string, unknown> | undefined)?.["lang"];
      return isWorldLanguage(value) ? value : null;
    },
  });
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const urlLanguage = useUrlLanguage();
  const navigate = useNavigate();
  const [stored, setStored] = useState<string | null>(null);
  const [enabledCodes, setEnabledCodes] = useState<string[] | null>(null);
  const requested = urlLanguage ?? stored ?? defaultLanguage;
  const isEnabled = (code: string) => !enabledCodes || enabledCodes.includes(code) || ["en", "ar", "ha"].includes(code);
  const activeLanguage = isEnabled(requested) ? requested : defaultLanguage;
  const language: LanguageCode = isLanguageCode(activeLanguage) ? activeLanguage : defaultLanguage;
  const world = worldLanguage(activeLanguage);

  useEffect(() => {
    if (urlLanguage) return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isWorldLanguage(saved)) setStored(saved);
    } catch {
      /* storage unavailable — English stays the default */
    }
  }, [urlLanguage]);

  useEffect(() => {
    let active = true;
    void supabase
      .from("site_settings")
      .select("social_links")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const config = data?.social_links && typeof data.social_links === "object" && !Array.isArray(data.social_links)
          ? data.social_links as Record<string, unknown>
          : {};
        const configured = Array.isArray(config["enabledLanguages"]) ? config["enabledLanguages"].filter(isWorldLanguage) : [];
        if (active && configured.length > 0) setEnabledCodes([...new Set(["en", "ar", "ha", ...configured])]);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.documentElement.lang = world.code;
    document.documentElement.dir = world.dir;
  }, [world.code, world.dir]);

  const setLanguage = useCallback(
    (next: string) => {
      if (!isWorldLanguage(next)) return;
      setStored(next);
      try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
      if (isLanguageCode(next)) {
        void supabase.auth.getSession().then(({ data }) => {
          const userId = data.session?.user.id;
          if (userId) void supabase.from("profiles").update({ preferred_language: next }).eq("id", userId);
        });
      }
      void navigate({
        search: ((prev: Record<string, unknown>) => ({ ...prev, lang: next === defaultLanguage ? undefined : next })) as never,
        replace: true,
      });
    },
    [navigate],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      activeLanguage,
      dir: world.dir,
      availableLanguages: languages.filter((item) => !enabledCodes || enabledCodes.includes(item.code) || item.primary),
      worldOptions: worldLanguages.filter((item) => !enabledCodes || enabledCodes.includes(item.code)),
      setLanguage,
      t: (key: TranslationKey) => translate(language, key),
      formatDate: (input, withTime = false) => formatDate(input, isLanguageCode(activeLanguage) ? language : defaultLanguage, withTime),
    }),
    [activeLanguage, enabledCodes, language, world.dir, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
      <LiveTranslator language={REVIEWED.has(activeLanguage) ? null : activeLanguage} />
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
