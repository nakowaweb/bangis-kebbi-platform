import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Languages, Save, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteTranslation,
  generateTranslationDraft,
  listTranslationWorkspace,
  saveTranslation,
  translationLanguageLabels,
  translationLanguages,
  translationStatuses,
  type TranslationLanguage,
  type TranslationStatus,
} from "@/lib/translations.functions";

type Draft = {
  id?: string;
  title: string;
  summary: string;
  body: string;
  imageAlt: string;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  status: TranslationStatus;
  isMachineGenerated: boolean;
};

const emptyDraft: Draft = { title: "", summary: "", body: "", imageAlt: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "", status: "draft", isMachineGenerated: false };

export function AdminTranslationManager() {
  const queryClient = useQueryClient();
  const load = useServerFn(listTranslationWorkspace);
  const save = useServerFn(saveTranslation);
  const remove = useServerFn(deleteTranslation);
  const generate = useServerFn(generateTranslationDraft);

  const [language, setLanguage] = useState<TranslationLanguage>("ar");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const workspace = useQuery({ queryKey: ["admin-translations"], queryFn: () => load() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-translations"] });

  const entries = workspace.data?.entries ?? [];
  const translations = workspace.data?.translations ?? [];

  const byKey = useMemo(() => new Map(translations.map((row) => [`${row.content_entry_id}:${row.language}`, row])), [translations]);
  const visible = useMemo(
    () => entries.filter((entry) => `${entry.title} ${entry.content_type} ${entry.slug}`.toLowerCase().includes(query.toLowerCase())),
    [entries, query],
  );
  const selected = entries.find((entry) => entry.id === selectedId) ?? null;

  function openEntry(entryId: string, lang: TranslationLanguage) {
    setSelectedId(entryId);
    setLanguage(lang);
    const existing = byKey.get(`${entryId}:${lang}`);
    setDraft(existing
      ? {
          id: existing.id,
          title: existing.title ?? "",
          summary: existing.summary ?? "",
          body: existing.body ?? "",
          imageAlt: existing.image_alt ?? "",
          seoTitle: existing.seo_title ?? "",
          seoDescription: existing.seo_description ?? "",
          ogTitle: existing.og_title ?? "",
          ogDescription: existing.og_description ?? "",
          status: existing.status as TranslationStatus,
          isMachineGenerated: existing.is_machine_generated,
        }
      : emptyDraft);
  }

  const saveMutation = useMutation({
    mutationFn: (status: TranslationStatus) =>
      save({ data: { contentEntryId: selectedId as string, language, title: draft.title, summary: draft.summary, body: draft.body, imageAlt: draft.imageAlt, seoTitle: draft.seoTitle, seoDescription: draft.seoDescription, ogTitle: draft.ogTitle, ogDescription: draft.ogDescription, status, isMachineGenerated: draft.isMachineGenerated } }),
    onSuccess: (_row, status) => { toast.success(`Translation saved as ${status}`); setDraft({ ...draft, status }); refresh(); },
    onError: (error) => toast.error(error.message),
  });

  const generateMutation = useMutation({
    mutationFn: () => generate({ data: { contentEntryId: selectedId as string, language } }),
    onSuccess: (result) => {
      setDraft({ ...draft, ...result, status: "draft" });
      toast.success("Draft generated. Review it, then save or publish.");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Translation removed"); setDraft(emptyDraft); refresh(); },
    onError: (error) => toast.error(error.message),
  });

  if (workspace.isPending) return <Skeleton className="h-72 w-full" />;
  if (workspace.isError) return <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">{workspace.error.message}</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search content" aria-label="Search content to translate" />
          <Select value={language} onValueChange={(value) => { const next = value as TranslationLanguage; if (selectedId) openEntry(selectedId, next); else setLanguage(next); }}>
            <SelectTrigger className="sm:w-56" aria-label="Language"><SelectValue /></SelectTrigger>
            <SelectContent>
              {translationLanguages.map((code) => <SelectItem key={code} value={code}>{translationLanguageLabels[code]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">English is the original. Each language is stored separately and never overwrites another.</p>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {visible.length === 0 ? <p className="p-10 text-center text-sm text-muted-foreground">No content matches this view.</p> : visible.map((entry) => {
            const row = byKey.get(`${entry.id}:${language}`);
            return (
              <button key={entry.id} type="button" onClick={() => openEntry(entry.id, language)} className={`grid w-full gap-2 border-b border-border p-4 text-left transition last:border-b-0 hover:bg-secondary/60 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${selectedId === entry.id ? "bg-secondary/60" : ""}`}>
                <span className="min-w-0">
                  <strong className="block truncate text-sm">{entry.title}</strong>
                  <span className="mt-1 block text-xs text-muted-foreground">{entry.content_type.replaceAll("_", " ")} · {entry.slug}</span>
                </span>
                <span className="flex items-center gap-2">
                  {row?.is_machine_generated && row.status !== "published" ? <Badge variant="outline"><Sparkles className="h-3 w-3" /> Draft</Badge> : null}
                  <Badge variant={row?.status === "published" ? "default" : "secondary"}>{row ? row.status : "not translated"}</Badge>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
        {!selected ? (
          <div className="grid gap-3 py-10 text-center text-sm text-muted-foreground"><Languages className="mx-auto h-8 w-8 text-primary" />Choose a content item to translate.</div>
        ) : (
          <div className="grid gap-4">
            <div>
              <h3 className="font-display text-lg font-bold">{translationLanguageLabels[language]}</h3>
              <p className="mt-1 text-xs text-muted-foreground">English original: {selected.title}</p>
            </div>
            <Button variant="outline" disabled={generateMutation.isPending} onClick={() => generateMutation.mutate()}>
              <Sparkles /> {generateMutation.isPending ? "Generating…" : "Generate translation draft"}
            </Button>
            <p className="text-xs text-muted-foreground">Generated text is never published automatically — review and edit it first.</p>

            <TranslationField label="Title" english={selected.title}><Input value={draft.title} maxLength={200} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></TranslationField>
            <TranslationField label="Short description" english={selected.summary}><Textarea value={draft.summary} maxLength={1000} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} /></TranslationField>
            <TranslationField label="Full content" english={selected.body}><Textarea className="min-h-40" value={draft.body} maxLength={20000} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></TranslationField>
            <TranslationField label="Image description" english={selected.image_alt}><Input value={draft.imageAlt} maxLength={300} onChange={(event) => setDraft({ ...draft, imageAlt: event.target.value })} /></TranslationField>

            <div className="rounded-lg border border-dashed border-border p-4">
              <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">Search &amp; social</p>
              <div className="grid gap-3">
                <TranslationField label="Search title" english={selected.seo_title}><Input value={draft.seoTitle} maxLength={180} onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })} /></TranslationField>
                <TranslationField label="Meta description" english={selected.seo_description}><Textarea value={draft.seoDescription} maxLength={400} onChange={(event) => setDraft({ ...draft, seoDescription: event.target.value })} /></TranslationField>
                <TranslationField label="Social title" english={selected.og_title}><Input value={draft.ogTitle} maxLength={180} onChange={(event) => setDraft({ ...draft, ogTitle: event.target.value })} /></TranslationField>
                <TranslationField label="Social description" english={selected.og_description}><Textarea value={draft.ogDescription} maxLength={400} onChange={(event) => setDraft({ ...draft, ogDescription: event.target.value })} /></TranslationField>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Current state</span><Badge variant={draft.status === "published" ? "default" : "secondary"}>{draft.status}</Badge></div>
            <div className="grid grid-cols-2 gap-2">
              {(["draft", "ready", "published", "unpublished", "archived"] satisfies TranslationStatus[]).filter((status) => translationStatuses.includes(status)).map((status) => (
                <Button key={status} variant={status === "published" ? "default" : "outline"} size="sm" disabled={!draft.title || saveMutation.isPending} onClick={() => saveMutation.mutate(status)}>
                  <Save /> {status === "draft" ? "Save draft" : status === "ready" ? "Mark ready" : status === "published" ? "Publish" : status === "unpublished" ? "Unpublish" : "Archive"}
                </Button>
              ))}
            </div>
            {draft.id ? (
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 /> Remove this translation</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Remove this language version?</AlertDialogTitle><AlertDialogDescription>The English original and other languages are not affected.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(draft.id as string)}>Remove</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        )}
      </aside>
    </div>
  );
}

function TranslationField({ label, english, children }: { label: string; english?: string | null; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <Label asChild><span>{label}</span></Label>
      {english ? <span className="line-clamp-3 rounded-md bg-secondary/60 p-2 text-xs text-muted-foreground">{english}</span> : null}
      {children}
    </label>
  );
}
