import { Link } from "@tanstack/react-router";
import { Menu, Search, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import logoAsset from "@/assets/bangis-logo-lockup.png.asset.json";
import iconAsset from "@/assets/bangis-app-icon.png.asset.json";
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
import { LanguageProvider, languages, useLanguage, type LanguageCode } from "@/lib/language";
import { navItems } from "@/lib/site-data";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
    </LanguageProvider>
  );
}

function SiteHeader() {
  const { labels } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto grid h-20 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:flex sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="BangisKebbi.com home">
          <img src={logoAsset.url} alt="BangisKebbi.com" className="h-12 w-auto max-w-[210px] shrink object-contain sm:max-w-[250px]" />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              activeOptions={{ exact: item.href === "/" }}
              activeProps={{ className: "text-brand-cyan" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-secondary hover:text-foreground"
            >
              {labels[item.labelKey] ?? item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <SearchMenu />
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">
              <UserRound />
              {labels["login"]}
            </Link>
          </Button>
          <Button size="sm" className="bg-brand-cyan text-brand-ink shadow-glow hover:bg-brand-cyan-soft" asChild>
            <Link to="/register">{labels["join"]}</Link>
          </Button>
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
  const { labels } = useLanguage();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={labels["search"]}>
          <Search />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 border-border bg-popover p-3 shadow-platform">
        <DropdownMenuLabel>{labels["search"]}</DropdownMenuLabel>
        <Input placeholder="Search services, projects, Umrah, foundation" className="mt-2 h-11" />
        <DropdownMenuSeparator />
        {["AI web design", "Umrah support", "Foundation", "Business networking"].map((item) => (
          <DropdownMenuItem key={item}>{item}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LanguageMenu({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, labels } = useLanguage();
  const current = languages.find((item) => item.code === language) ?? {
    code: "en",
    short: "EN",
    label: "English",
    dir: "ltr",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-border bg-background/80">
          {compact ? current.short : current.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-border bg-popover shadow-platform">
        <DropdownMenuLabel>{labels["language"]}</DropdownMenuLabel>
        {languages.map((item) => (
          <DropdownMenuItem key={item.code} onSelect={() => setLanguage(item.code as LanguageCode)}>
            <span className="font-semibold">{item.short}</span>
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileMenu() {
  const { labels } = useLanguage();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open menu" className="border-border bg-background/80">
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
          <nav className="grid gap-2" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link
                  to={item.href}
                  activeOptions={{ exact: item.href === "/" }}
                  className="rounded-lg border border-border bg-card px-4 py-3 text-base font-semibold text-foreground shadow-sm"
                >
                  {labels[item.labelKey] ?? item.label}
                </Link>
              </SheetClose>
            ))}
          </nav>
          <div className="grid gap-3 border-t border-border pt-5">
            <SheetClose asChild>
              <Button variant="outline" className="h-12 justify-start" asChild>
                <Link to="/login">{labels["login"]}</Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button className="h-12 justify-start bg-brand-cyan text-brand-ink hover:bg-brand-cyan-soft" asChild>
                <Link to="/register">{labels["join"]}</Link>
              </Button>
            </SheetClose>
            <div className="rounded-lg border border-border bg-secondary p-3">
              <p className="mb-2 text-sm font-semibold text-foreground">{labels["language"]}</p>
              <LanguageMenu />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SiteFooter() {
  const groups = [
    ["Services", "/services"],
    ["Projects", "/projects"],
    ["Business", "/business"],
    ["Umrah", "/umrah"],
    ["Foundation", "/foundation"],
    ["Blog", "/blog"],
    ["Contact", "/contact"],
  ] as const;
  const policies = [
    ["Privacy Policy", "/privacy"],
    ["Terms", "/terms"],
    ["Refund Policy", "/refund-policy"],
  ] as const;

  return (
    <footer className="border-t border-border bg-brand-ink text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <img src={logoAsset.url} alt="BangisKebbi.com" className="h-14 w-auto rounded-md bg-primary-foreground object-contain p-2" />
          <p className="mt-5 max-w-md text-sm leading-7 text-primary-foreground/80">
            BangisKebbi.com is a global personal-brand and business platform for ideas, technology, business and people.
          </p>
          <p className="mt-4 text-sm font-semibold text-brand-cyan">Technology gives you tools, but people give you opportunities.</p>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase text-brand-cyan">Quick Links</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {groups.map(([label, href]) => (
              <Link key={href} to={href} className="text-primary-foreground/80 transition-colors hover:text-brand-cyan">
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase text-brand-cyan">Legal</h2>
          <div className="mt-4 grid gap-3 text-sm">
            {policies.map(([label, href]) => (
              <Link key={href} to={href} className="text-primary-foreground/80 transition-colors hover:text-brand-cyan">
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-primary-foreground/70">
            <span>LinkedIn</span>
            <span>GitHub</span>
            <span>WhatsApp</span>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-5 text-center text-xs text-primary-foreground/70">
        © BangisKebbi.com. All Rights Reserved.
      </div>
    </footer>
  );
}
