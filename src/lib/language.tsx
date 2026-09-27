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

export { languages, languageMeta, formatDate, isLanguageCode, defaultLanguage };
export type { LanguageCode, TranslationKey };

const STORAGE_KEY = "bk.language";

type LanguageContextValue = {
  language: LanguageCode;
  dir: "ltr" | "rtl";
  availableLanguages: typeof languages;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKey) => string;
  formatDate: (value: string | Date | null | undefined, withTime?: boolean) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

/** Reads ?lang= from the current URL so localized links are server-rendered in that language. */
function useUrlLanguage(): LanguageCode | null {
  return useRouterState({
    select: (state) => {
      const value = (state.location.search as Record<string, unknown> | undefined)?.["lang"];
      return isLanguageCode(value) ? value : null;
    },
  });
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const urlLanguage = useUrlLanguage();
  const navigate = useNavigate();
  // Server and first client render always agree; the stored preference is applied after hydration.
  const [stored, setStored] = useState<LanguageCode | null>(null);
  const [enabledCodes, setEnabledCodes] = useState<LanguageCode[]>(languages.map((item) => item.code));
  const requestedLanguage = urlLanguage ?? stored ?? defaultLanguage;
  const language = enabledCodes.includes(requestedLanguage) ? requestedLanguage : defaultLanguage;
  const meta = languageMeta(language);

  useEffect(() => {
    if (urlLanguage) return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isLanguageCode(saved)) setStored(saved);
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
        const configured = Array.isArray(config["enabledLanguages"])
          ? config["enabledLanguages"].filter(isLanguageCode)
          : [];
        if (active && configured.length > 0) setEnabledCodes(["en", ...configured.filter((code) => code !== "en")]);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir;
  }, [meta.code, meta.dir]);

  const setLanguage = useCallback(
    (next: LanguageCode) => {
      setStored(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      // Members keep the preference on their profile; visitors keep it locally only.
      void supabase.auth.getSession().then(({ data }) => {
        const userId = data.session?.user.id;
        if (userId) void supabase.from("profiles").update({ preferred_language: next }).eq("id", userId);
      });
      void navigate({
        search: ((prev: Record<string, unknown>) => ({
          ...prev,
          lang: next === defaultLanguage ? undefined : next,
        })) as never,
        replace: true,
      });
    },
    [navigate],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      dir: meta.dir,
      availableLanguages: languages.filter((item) => enabledCodes.includes(item.code)),
      setLanguage,
      t: (key: TranslationKey) => translate(language, key),
      formatDate: (input, withTime = false) => formatDate(input, language, withTime),
    }),
    [enabledCodes, language, meta.dir, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
