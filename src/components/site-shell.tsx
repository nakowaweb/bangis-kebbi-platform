import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import * as FlagIcons from "country-flag-icons/react/3x2";
import { ChevronDown, Globe, Languages, Mail, Menu, UserRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

import logoAssetSrc from "@/assets/bangis-logo-lockup.png";
const logoAsset = { url: logoAssetSrc };
import iconAssetSrc from "@/assets/bangis-app-icon.png";
const iconAsset = { url: iconAssetSrc };
import { platformLabels, socialIcons } from "@/components/social-icons";
import { useContactLinks } from "@/components/contact-actions";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GlobalSearch } from "@/components/global-search";
import { LanguageProvider, languageMeta, languages, useLanguage, type LanguageCode, type TranslationKey } from "@/lib/language";
import { worldLanguage } from "@/lib/i18n/world-languages";
import { listPublicSocialLinks } from "@/lib/social.functions";
import { navItems } from "@/lib/site-data";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ShellBody>{children}</ShellBody>
    </LanguageProvider>
  );
}

function ShellBody({ children }: { children: ReactNode }) {
  const { dir } = useLanguage();
  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}

function useSignedIn() {
  const [state, setState] = useState({ signedIn: false, isAdmin: false });
  useEffect(() => {
    let active = true;
    async function resolve(userId: string | undefined) {
      if (!userId) { if (active) setState({ signedIn: false, isAdmin: false }); return; }
      if (active) setState((current) => ({ ...current, signedIn: true }));
      // Display hint only — /admin is enforced by its route guard and server-side role checks.
      const { data } = await supabase.rpc("is_platform_admin", { _user_id: userId });
      if (active) setState({ signedIn: true, isAdmin: Boolean(data) });
    }
    void supabase.auth.getSession().then(({ data }) => resolve(data.session?.user.id));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => { void resolve(session?.user.id); });
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, []);
  return state;
}

/** Enabled official links, loaded once and cached for the whole session. */
function useSocialLinks() {
  const load = useServerFn(listPublicSocialLinks);
  return useQuery({ queryKey: ["public-social-links"], queryFn: () => load(), staleTime: 1000 * 60 * 30 });
}

function SiteHeader() {
  const { t } = useLanguage();
  const signedIn = useSignedIn();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto grid min-h-20 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6 lg:flex lg:gap-x-1 lg:px-3 xl:gap-x-2 xl:px-5">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="BangisKebbi.com home">
          <img src={logoAsset.url} alt="BangisKebbi.com" className="h-12 w-auto max-w-[210px] shrink object-contain sm:max-w-[250px] lg:max-w-[180px] xl:max-w-[210px]" />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label={t("nav.main")}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              activeOptions={{ exact: item.href === "/" }}
              activeProps={{ className: "text-brand-cyan" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="rounded-md px-2 py-2 text-xs font-semibold transition-colors hover:bg-secondary hover:text-foreground xl:px-2.5 xl:text-sm"
            >
              {t(`nav.${item.labelKey}` as TranslationKey)}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-1 lg:flex xl:gap-2">
          <GlobalSearch />
          {signedIn ? (
            <Button size="sm" className="bg-brand-cyan text-brand-ink shadow-glow hover:bg-brand-cyan-soft" asChild>
              <Link to="/dashboard">
                <UserRound />
                {t("common.dashboard")}
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">
                  <UserRound />
                  {t("common.login")}
                </Link>
              </Button>
              <Button size="sm" className="bg-brand-cyan text-brand-ink shadow-glow hover:bg-brand-cyan-soft" asChild>
                <Link to="/register">{t("common.join")}</Link>
              </Button>
            </>
          )}
          <LanguageSelector />
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <GlobalSearch />
          <MobileMenu />
        </div>
        <div className="col-span-2 min-w-0 lg:hidden"><LanguageSelector compact /></div>
      </div>
    </header>
  );
}

function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { activeLanguage, setLanguage, t, worldOptions } = useLanguage();
  const [open, setOpen] = useState(false);
  const primary = languages.filter((item) => item.primary);
  const additional = worldOptions.filter((item) => !["en", "ar", "ha"].includes(item.code));
  const current = additional.find((item) => item.code === activeLanguage);
  const LanguageMarker = ({ country }: { country: string | undefined }) => {
    const Flag = country ? FlagIcons[country as keyof typeof FlagIcons] : undefined;
    return Flag ? (
      <Flag aria-hidden="true" className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover shadow-sm ring-1 ring-border" />
    ) : (
      <Languages aria-hidden="true" className="h-4 w-5 shrink-0 text-muted-foreground" />
    );
  };

  return (
    <div data-no-translate className="grid min-w-0 grid-cols-4 gap-1 sm:flex sm:justify-end sm:gap-1.5" aria-label={t("common.language")}>
      {primary.map((item) => (
        <Button
          key={item.code}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setLanguage(item.code)}
          aria-pressed={activeLanguage === item.code}
          className={`h-8 min-w-0 gap-1 border-border bg-background px-1.5 text-[11px] font-semibold shadow-sm sm:px-2.5 sm:text-xs ${activeLanguage === item.code ? "border-brand-cyan bg-secondary text-primary" : "text-foreground"}`}
        >
          <LanguageMarker country={worldLanguage(item.code).country} />
          <span className={compact ? "truncate" : ""}>{item.nativeLabel}</span>
        </Button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-label="More languages"
            className={`h-8 min-w-0 gap-1 border-border bg-background px-1.5 text-[11px] font-semibold text-primary shadow-sm sm:px-2.5 sm:text-xs ${current ? "border-brand-cyan bg-secondary" : ""}`}
          >
            <LanguageMarker country={current?.country} />
            <span className="truncate">{current ? current.nativeLabel : "More"}</span>
            <ChevronDown className="h-3 w-3 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={6} className="w-64 rounded-lg border-border p-0 shadow-platform">
          <Command>
            <CommandInput placeholder={`Search ${additional.length} languages…`} className="h-9 text-sm" />
            <CommandList className="max-h-72">
              <CommandEmpty>No language found.</CommandEmpty>
              {additional.map((item) => (
                <CommandItem
                  key={item.code}
                  value={`${item.label} ${item.nativeLabel} ${item.code}`}
                  onSelect={() => { setLanguage(item.code); setOpen(false); }}
                  className={`grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-2 text-sm ${activeLanguage === item.code ? "font-semibold text-primary" : ""}`}
                >
                  <LanguageMarker country={item.country} />
                  <span className="truncate">{item.nativeLabel}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.label}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function MobileMenu() {
  const { t } = useLanguage();
  const signedIn = useSignedIn();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t("nav.openMenu")} className="border-border bg-background/80">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88vw] overflow-y-auto border-border bg-background p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-5 text-left">
          <SheetTitle className="flex items-center gap-3">
            <img src={iconAsset.url} alt="BK" className="h-10 w-10 rounded-lg object-contain" />
            <span>BangisKebbi.com</span>
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-6 px-5 py-6">
          <nav className="grid gap-2" aria-label={t("nav.mobile")}>
            {navItems.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link
                  to={item.href}
                  activeOptions={{ exact: item.href === "/" }}
                  className="rounded-lg border border-border bg-card px-4 py-3 text-base font-semibold text-foreground shadow-sm"
                >
                  {t(`nav.${item.labelKey}` as TranslationKey)}
                </Link>
              </SheetClose>
            ))}
          </nav>
          <div className="grid gap-3 border-t border-border pt-5">
            <GlobalSearch mobile />
            {signedIn ? (
              <SheetClose asChild>
                <Button className="h-12 justify-start bg-brand-cyan text-brand-ink hover:bg-brand-cyan-soft" asChild>
                  <Link to="/dashboard">{t("common.dashboard")}</Link>
                </Button>
              </SheetClose>
            ) : (
              <>
                <SheetClose asChild>
                  <Button variant="outline" className="h-12 justify-start" asChild>
                    <Link to="/login">{t("common.login")}</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button className="h-12 justify-start bg-brand-cyan text-brand-ink hover:bg-brand-cyan-soft" asChild>
                    <Link to="/register">{t("common.join")}</Link>
                  </Button>
                </SheetClose>
              </>
            )}
            <div className="rounded-lg border border-border bg-secondary p-3">
              <p className="mb-2 text-sm font-semibold text-foreground">{t("common.language")}</p>
              <LanguageSelector />
            </div>
            <SocialRow />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Official links configured by the Super Admin, with canonical launch fallbacks. */
function SocialRow() {
  const links = useSocialLinks();
  const contact = useContactLinks();
  const items = links.data ?? [];
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" aria-label="Follow Us">
      {items.map((item) => {
        const Icon = socialIcons[item.platform];
        const label = item.display_label || platformLabels[item.platform] || item.platform;
        return (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label={label}
            title={label}
            className="social-card flex h-11 min-w-0 items-center justify-center gap-2 rounded-md bg-primary px-3 text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan sm:w-11 sm:px-0"
          >
            {Icon ? <Icon className="h-5 w-5" /> : <span className="text-xs font-bold uppercase">{label.slice(0, 2)}</span>}
            <span className="truncate text-xs font-semibold sm:sr-only">{label}</span>
          </a>
        );
      })}
      <a
        href={contact.email}
        aria-label="Email"
        title="Email"
        className="social-card flex h-11 min-w-0 items-center justify-center gap-2 rounded-md bg-primary px-3 text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan sm:w-11 sm:px-0"
      >
        <Mail className="h-5 w-5" />
        <span className="truncate text-xs font-semibold sm:sr-only">Email</span>
      </a>
    </div>
  );
}

function SiteFooter() {
  const { t } = useLanguage();
  const groups: Array<[TranslationKey, "/services" | "/projects" | "/business" | "/umrah" | "/foundation" | "/blog" | "/contact"]> = [
    ["nav.services", "/services"],
    ["nav.projects", "/projects"],
    ["nav.business", "/business"],
    ["nav.umrah", "/umrah"],
    ["nav.foundation", "/foundation"],
    ["nav.blog", "/blog"],
    ["nav.contact", "/contact"],
  ];
  const policies: Array<[TranslationKey, "/privacy" | "/terms" | "/refund-policy"]> = [
    ["footer.privacy", "/privacy"],
    ["footer.terms", "/terms"],
    ["footer.refund", "/refund-policy"],
  ];

  return (
    <footer className="border-t border-border bg-background text-foreground">
      <div className="mx-auto grid max-w-7xl gap-9 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_0.8fr_1fr] lg:px-8">
        <div>
          <img src={logoAsset.url} alt="BangisKebbi.com" className="h-14 w-auto object-contain" />
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">{t("footer.tagline")}</p>
          <p className="mt-3 text-xs font-bold uppercase text-primary">{t("footer.company")}</p>
          <div className="mt-4"><FooterLanguage /></div>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase text-primary">{t("common.quickLinks")}</h2>
          <div className="mt-4 grid gap-2 text-sm">
            {groups.slice(0, 4).map(([key, href]) => (
              <Link key={href} to={href} className="text-muted-foreground transition-colors hover:text-primary">
                {t(key)}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase text-primary">{t("common.platforms")}</h2>
          <div className="mt-4 grid gap-3 text-sm">
            {groups.slice(4).map(([key, href]) => (
              <Link key={href} to={href} className="text-muted-foreground transition-colors hover:text-primary">
                {t(key)}
              </Link>
            ))}
            <Link to="/cv" className="text-muted-foreground transition-colors hover:text-primary">CV</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase text-primary">{t("common.followUs")}</h2>
          <div className="mt-4"><SocialRow /></div>
          <p className="mt-5 text-sm font-bold">{t("footer.foundation")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("footer.foundationLine")}</p>
        </div>
      </div>
      <div className="border-t border-border bg-brand-ink px-4 py-5 text-center text-xs text-primary-foreground/70">
        © 2026 BangisKebbi.com. {t("footer.rights")} ·{" "}
        {policies.map(([key, href], index) => (
          <span key={href}>
            {index > 0 ? " · " : ""}
            <Link to={href} className="hover:text-brand-cyan">
              {t(key)}
            </Link>
          </span>
        ))}
      </div>
    </footer>
  );
}

function FooterLanguage() {
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">{t("common.language")}</p>
      <div className="flex flex-wrap gap-2">
        {availableLanguages.filter((item) => item.primary).map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setLanguage(item.code as LanguageCode)}
            aria-current={item.code === language ? "true" : undefined}
            className={`min-h-11 rounded-md border px-3 py-2 text-sm font-semibold transition ${item.code === language ? "border-brand-cyan bg-brand-cyan/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
          >
            <span aria-hidden="true">{item.flag}</span> {item.nativeLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
