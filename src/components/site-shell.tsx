import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Menu, Search, UserRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

import logoAssetSrc from "@/assets/bangis-logo-lockup.png";
const logoAsset = { url: logoAssetSrc };
import iconAssetSrc from "@/assets/bangis-app-icon.png";
const iconAsset = { url: iconAssetSrc };
import { platformLabels, socialIcons } from "@/components/social-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LanguageProvider, languageMeta, languages, useLanguage, type LanguageCode, type TranslationKey } from "@/lib/language";
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
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => subscription.subscription.unsubscribe();
  }, []);
  return signedIn;
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
      <div className="mx-auto grid h-20 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:flex sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="BangisKebbi.com home">
          <img src={logoAsset.url} alt="BangisKebbi.com" className="h-12 w-auto max-w-[210px] shrink object-contain sm:max-w-[250px]" />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label={t("nav.main")}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              activeOptions={{ exact: item.href === "/" }}
              activeProps={{ className: "text-brand-cyan" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-secondary hover:text-foreground"
            >
              {t(`nav.${item.labelKey}` as TranslationKey)}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <SearchMenu />
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
          <LanguageMenu compact />
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <LanguageMenu compact />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

function SearchMenu() {
  const { t } = useLanguage();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("common.search")}>
          <Search />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 border-border bg-popover p-3 shadow-platform">
        <DropdownMenuLabel>{t("common.search")}</DropdownMenuLabel>
        <Input placeholder={t("common.searchPlaceholder")} className="mt-2 h-11" />
        <DropdownMenuSeparator />
        {(["nav.services", "nav.umrah", "nav.foundation", "nav.business"] as TranslationKey[]).map((key) => (
          <DropdownMenuItem key={key}>{t(key)}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LanguageMenu({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  const current = languageMeta(language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 min-w-11 border-border bg-background/80" aria-label={t("common.language")}>
          {compact ? current.short : current.nativeLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-border bg-popover shadow-platform">
        <DropdownMenuLabel>{t("common.language")}</DropdownMenuLabel>
        {languages.map((item) => (
          <DropdownMenuItem key={item.code} onSelect={() => setLanguage(item.code as LanguageCode)} className="gap-2">
            <span className="font-semibold">{item.short}</span>
            <span>{item.nativeLabel}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
              <LanguageMenu />
            </div>
            <SocialRow />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Official links configured by the Super Admin. Nothing renders until at least one is enabled. */
function SocialRow() {
  const links = useSocialLinks();
  const items = links.data ?? [];
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
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
            className="grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
          >
            {Icon ? <Icon className="h-5 w-5" /> : <span className="text-xs font-bold uppercase">{label.slice(0, 2)}</span>}
          </a>
        );
      })}
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
  const { language, setLanguage, t } = useLanguage();
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">{t("common.language")}</p>
      <div className="flex flex-wrap gap-2">
        {languages.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setLanguage(item.code as LanguageCode)}
            aria-current={item.code === language ? "true" : undefined}
            className={`min-h-11 rounded-md border px-3 py-2 text-sm font-semibold transition ${item.code === language ? "border-brand-cyan bg-brand-cyan/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
          >
            {item.nativeLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
