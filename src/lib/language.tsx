import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type LanguageCode = "en" | "ha" | "ar";

export const languages: Array<{ code: LanguageCode; short: string; label: string; dir: "ltr" | "rtl" }> = [
  { code: "en", short: "EN", label: "English", dir: "ltr" },
  { code: "ha", short: "HA", label: "Hausa", dir: "ltr" },
  { code: "ar", short: "AR", label: "Arabic", dir: "rtl" },
];

const fallbackLanguage = { code: "en", short: "EN", label: "English", dir: "ltr" } as const;

function getLanguageMeta(language: LanguageCode) {
  return languages.find((item) => item.code === language) ?? fallbackLanguage;
}

const navLabels: Record<LanguageCode, Record<string, string>> = {
  en: {
    home: "Home",
    about: "About",
    services: "Services",
    projects: "Projects",
    business: "Business",
    umrah: "Umrah",
    foundation: "Foundation",
    blog: "Blog",
    contact: "Contact",
    search: "Search",
    login: "Login",
    join: "Join Now",
    language: "Language",
  },
  ha: {
    home: "Gida",
    about: "Game da mu",
    services: "Ayyuka",
    projects: "Ayyuka na baya",
    business: "Kasuwanci",
    umrah: "Umrah",
    foundation: "Gidauniya",
    blog: "Labarai",
    contact: "Tuntuɓa",
    search: "Bincike",
    login: "Shiga",
    join: "Shiga Yanzu",
    language: "Harshe",
  },
  ar: {
    home: "الرئيسية",
    about: "من نحن",
    services: "الخدمات",
    projects: "الأعمال",
    business: "الأعمال",
    umrah: "العمرة",
    foundation: "المؤسسة",
    blog: "المدونة",
    contact: "اتصل",
    search: "بحث",
    login: "دخول",
    join: "انضم الآن",
    language: "اللغة",
  },
};

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  labels: Record<string, string>;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>("en");

  useEffect(() => {
    const current = getLanguageMeta(language);
    document.documentElement.lang = current.code;
    document.documentElement.dir = current.dir;
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, labels: navLabels[language] }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
