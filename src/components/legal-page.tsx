import { SectionShell } from "@/components/platform-sections";
import { useLanguage } from "@/lib/language";

type Section = { title: string; body: string };
type LegalCopy = { eyebrow: string; title: string; description: string; updated: string; sections: Section[] };
type ManagedLegalCopy = { title: string; summary: string | null; body: string | null } | null;

export function LegalPage({ copy, managed }: { copy: Record<"en" | "ar" | "ha", LegalCopy>; managed?: ManagedLegalCopy }) {
  const { language } = useLanguage();
  const page = copy[language];
  return <main><SectionShell eyebrow={page.eyebrow} title={managed?.title ?? page.title} description={managed?.summary ?? page.description}><p className="mb-6 text-xs text-muted-foreground">{page.updated}</p>{managed?.body ? <div className="max-w-4xl whitespace-pre-line text-sm leading-7 text-muted-foreground">{managed.body}</div> : <div className="grid max-w-4xl gap-8">{page.sections.map((section) => <section key={section.title}><h2 className="font-display text-xl font-bold">{section.title}</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{section.body}</p></section>)}</div>}</SectionShell></main>;
}