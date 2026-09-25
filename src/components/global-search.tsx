import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Globe2, LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import businessImage from "@/assets/business-website.webp";
import communityImage from "@/assets/bangis-official-community.webp";
import portraitImage from "@/assets/bangis-official-hero.webp";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { articles, projects, services } from "@/lib/portfolio-content";
import { getPublicSearchConfig, searchPublicSite, type SiteSearchResult } from "@/lib/search.functions";

const staticResults: SiteSearchResult[] = [
  { id: "page-about", title: "About BangisKebbi.com", category: "Page", snippet: "Ideas, technology, business, people and the work of Abubakar Alhaji Abubakar.", url: "/about", imageUrl: portraitImage },
  { id: "page-umrah", title: "Umrah Support", category: "Umrah", snippet: "Respectful information, preparation guidance and member support for Umrah.", url: "/umrah", imageUrl: null },
  { id: "page-foundation", title: "BK Community Support Initiative", category: "Community Support", snippet: "Practical community support and humanitarian initiatives.", url: "/foundation", imageUrl: communityImage },
  { id: "page-community", title: "Community", category: "Community", snippet: "Connect, learn, build and grow through the BangisKebbi.com community.", url: "/community", imageUrl: communityImage },
  { id: "page-cv", title: "Abubakar Alhaji Abubakar — CV", category: "CV", snippet: "AI Web Designer & Web Developer in Kebbi State, Nigeria. Experience since 2024.", url: "/cv", imageUrl: portraitImage },
  { id: "credential-cac", title: "CAC Certificate of Incorporation", category: "Company Credentials", snippet: "BANGISKEBBI GLOBAL LTD · RC 9884960 · Private Company Limited by Shares · Incorporated 24 September 2026.", url: "/#company-credentials", imageUrl: null },
  ...services.map((item) => ({ id: `service-${item.slug}`, title: item.title.en, category: "Service", snippet: item.summary.en, url: `/services/${item.slug}`, imageUrl: item.image })),
  ...projects.map((item) => ({ id: `project-${item.slug}`, title: item.title.en, category: "Project", snippet: item.summary.en, url: `/projects/${item.slug}`, imageUrl: item.image })),
  ...articles.map((item) => ({ id: `article-${item.slug}`, title: item.title.en, category: "Blog", snippet: item.summary.en, url: `/blog/${item.slug}`, imageUrl: item.image })),
  { id: "page-business", title: "Business & Digital Solutions", category: "Business", snippet: "Professional website and practical digital solution creation.", url: "/business", imageUrl: businessImage },
];

export function GlobalSearch({ mobile = false }: { mobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const searchSite = useServerFn(searchPublicSite);
  const loadConfig = useServerFn(getPublicSearchConfig);
  const normalized = query.trim().toLowerCase();
  const remote = useQuery({ queryKey: ["site-search", normalized], queryFn: () => searchSite({ data: { query: normalized } }), enabled: open && normalized.length >= 2, staleTime: 60_000 });
  const config = useQuery({ queryKey: ["public-search-config"], queryFn: () => loadConfig(), enabled: open, staleTime: 300_000 });
  useEffect(() => { if (open) window.setTimeout(() => inputRef.current?.focus(), 80); }, [open]);
  const local = useMemo(() => normalized.length < 2 ? [] : staticResults.filter((item) => `${item.title} ${item.category} ${item.snippet}`.toLowerCase().includes(normalized)), [normalized]);
  const results = useMemo(() => {
    const merged = [...local, ...(remote.data?.results ?? [])];
    return [...new Map(merged.map((item) => [`${item.url}-${item.title}`, item])).values()].slice(0, 18);
  }, [local, remote.data?.results]);
  const googleCx = config.data?.googleCx || remote.data?.googleCx || "";

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setQuery(""); }}>
      <DialogTrigger asChild><Button variant={mobile ? "outline" : "ghost"} size={mobile ? "default" : "icon"} className={mobile ? "h-12 w-full justify-start" : undefined} aria-label="Search BangisKebbi.com"><Search />{mobile ? "Search" : null}</Button></DialogTrigger>
      <DialogContent className="top-[8vh] max-h-[84vh] w-[calc(100%-2rem)] max-w-3xl translate-y-0 grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden p-0 sm:top-[10vh]">
        <DialogHeader className="border-b border-border px-5 py-5 pr-12 text-left"><DialogTitle className="font-display text-xl">Search BangisKebbi.com</DialogTitle><DialogDescription>Find public pages, services, projects, articles and credentials.</DialogDescription></DialogHeader>
        <div className="relative px-5 pt-4"><Search className="absolute left-8 top-7 h-5 w-5 text-muted-foreground" /><Input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages, services, projects, CAC…" className="h-12 pl-11 pr-11" />{query ? <Button variant="ghost" size="icon" onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="absolute right-6 top-5" aria-label="Clear search"><X /></Button> : null}</div>
        <Tabs defaultValue="site" className="min-h-0 px-5 pb-5">
          <TabsList className="mt-3 grid w-full grid-cols-2"><TabsTrigger value="site"><Search /> Site Search</TabsTrigger><TabsTrigger value="web"><Globe2 /> Web Search</TabsTrigger></TabsList>
          <TabsContent value="site" className="max-h-[54vh] overflow-y-auto pt-3">
            {!normalized ? <SearchState title="Start searching" detail="Enter a name, service, project, topic or credential." /> : normalized.length < 2 ? <SearchState title="Keep typing" detail="Enter at least two characters." /> : results.length === 0 ? <SearchState title="No results" detail={remote.isFetching ? "Checking the latest public CMS content…" : `Nothing public matched “${query.trim()}”.`} loading={remote.isFetching} /> : <div className="grid gap-2">{remote.isFetching ? <p className="pb-1 text-xs text-muted-foreground" role="status">Checking the latest public CMS content…</p> : null}{results.map((item) => <a key={`${item.id}-${item.url}`} href={item.url} onClick={() => setOpen(false)} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border bg-card p-3 transition hover:border-brand-cyan/50 hover:bg-secondary"><div className="h-14 w-16 overflow-hidden rounded-md bg-secondary">{item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" width={128} height={112} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-primary"><Search className="h-5 w-5" /></span>}</div><div className="min-w-0"><p className="text-xs font-bold uppercase text-primary">{item.category}</p><h3 className="truncate text-sm font-bold">{item.title}</h3><p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{item.snippet}</p></div><ExternalLink className="h-4 w-4 text-muted-foreground" /></a>)}</div>}
          </TabsContent>
          <TabsContent value="web" className="pt-3"><div className="rounded-lg border border-border bg-secondary p-6 text-center"><Globe2 className="mx-auto h-9 w-9 text-primary" /><h3 className="mt-3 font-display text-lg font-bold">Search the wider web</h3>{googleCx ? <><p className="mt-2 text-sm text-muted-foreground">Google Programmable Search Engine is configured.</p>{normalized ? <Button className="mt-5" asChild><a href={`https://cse.google.com/cse?cx=${encodeURIComponent(googleCx)}&q=${encodeURIComponent(query.trim())}`} target="_blank" rel="noopener noreferrer"><Globe2 /> Search the Web</a></Button> : <Button className="mt-5" disabled><Globe2 /> Enter a search above</Button>}</> : <><p className="mt-2 text-sm text-muted-foreground">Web search is not configured yet.</p><p className="mt-1 text-xs text-muted-foreground">Site Search remains available.</p></>}</div></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function SearchState({ title, detail, loading = false }: { title: string; detail: string; loading?: boolean }) {
  return <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-border bg-secondary p-6 text-center"><div>{loading ? <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-primary" /> : <Search className="mx-auto h-8 w-8 text-primary" />}<p className="mt-3 font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div></div>;
}