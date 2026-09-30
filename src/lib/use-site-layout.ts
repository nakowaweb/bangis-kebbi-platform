import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";

import { useLanguage } from "@/lib/language";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { DEFAULT_LAYOUT, TEXT_OVERRIDE_KEYS, type TextOverrideKey } from "@/lib/site-layout";
import { getSiteLayout } from "@/lib/site-layout.functions";

export function useSiteLayout() {
  const load = useServerFn(getSiteLayout);
  const query = useQuery({ queryKey: ["site-layout"], queryFn: () => load(), staleTime: 1000 * 60 * 5 });
  return query.data ?? { ...DEFAULT_LAYOUT, miniUrls: {} as Record<string, string> };
}

/** Translation lookup that prefers Super Admin EN/AR/HA overrides, then the reviewed dictionary. */
export function useSiteText() {
  const { t, language } = useLanguage();
  const layout = useSiteLayout();
  return (key: TranslationKey) => {
    if ((TEXT_OVERRIDE_KEYS as readonly string[]).includes(key)) {
      const entry = layout.text[key as TextOverrideKey];
      const value = entry ? (language === "ar" ? entry.ar : language === "ha" ? entry.ha : language === "en" ? entry.en : "") : "";
      if (value.trim()) return value.trim();
    }
    return t(key);
  };
}

/** Applies the Super Admin motion preference to the whole site. */
export function useMotionPreference() {
  const layout = useSiteLayout();
  useEffect(() => {
    document.documentElement.dataset["motion"] = layout.motion;
  }, [layout.motion]);
}
