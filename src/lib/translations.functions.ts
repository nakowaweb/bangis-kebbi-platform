import { requireModule } from "@/lib/admin-access";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const translationLanguages = ["ar", "ha", "fr", "es", "tr", "de", "ur", "zh"] as const;
export type TranslationLanguage = (typeof translationLanguages)[number];

export const translationStatuses = ["draft", "ready", "published", "unpublished", "archived"] as const;
export type TranslationStatus = (typeof translationStatuses)[number];

export const translationLanguageLabels: Record<TranslationLanguage, string> = {
  ar: "🇸🇦 Arabic",
  ha: "🇳🇬 Hausa",
  fr: "🇫🇷 French",
  es: "🇪🇸 Spanish",
  tr: "🇹🇷 Turkish",
  de: "🇩🇪 German",
  ur: "🇵🇰 Urdu",
  zh: "🇨🇳 Chinese",
};

type AdminContext = {
  supabase: {
    rpc: (fn: "is_content_admin", args: { _user_id: string }) => PromiseLike<{ data: unknown; error: unknown }>;
  };
  userId: string;
};

async function requireContentAdmin(context: AdminContext) {
  const { data, error } = await context.supabase.rpc("is_content_admin", { _user_id: context.userId });
  if (error || !data) throw new Error("Administrator access is required.");
  await requireModule(context as never, "translations");
}

/** Every English entry plus its localized versions, for the admin translation workspace. */
export const listTranslationWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireContentAdmin(context as unknown as AdminContext);
    const [{ data: entries, error: entriesError }, { data: translations, error: translationsError }] = await Promise.all([
      context.supabase
        .from("content_entries")
        .select("id,content_type,slug,title,summary,body,image_alt,seo_title,seo_description,og_title,og_description,status,updated_at")
        .order("content_type", { ascending: true })
        .order("title", { ascending: true })
        .limit(400),
      context.supabase.from("content_translations").select("*").limit(1000),
    ]);
    if (entriesError) throw new Error(entriesError.message);
    if (translationsError) throw new Error(translationsError.message);
    return { entries: entries ?? [], translations: translations ?? [] };
  });

const saveInput = z.object({
  contentEntryId: z.string().uuid(),
  language: z.enum(translationLanguages),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(1000).optional().default(""),
  body: z.string().trim().max(20000).optional().default(""),
  imageAlt: z.string().trim().max(300).optional().default(""),
  seoTitle: z.string().trim().max(180).optional().default(""),
  seoDescription: z.string().trim().max(400).optional().default(""),
  ogTitle: z.string().trim().max(180).optional().default(""),
  ogDescription: z.string().trim().max(400).optional().default(""),
  status: z.enum(translationStatuses),
  isMachineGenerated: z.boolean().optional().default(false),
});

/** Creates or updates one language version. Each language has its own row — English is never overwritten. */
export const saveTranslation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => saveInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context as unknown as AdminContext);
    const reviewed = data.status === "published" || data.status === "ready";
    const record = {
      content_entry_id: data.contentEntryId,
      language: data.language,
      title: data.title,
      summary: data.summary || null,
      body: data.body || null,
      image_alt: data.imageAlt || null,
      seo_title: data.seoTitle || null,
      seo_description: data.seoDescription || null,
      og_title: data.ogTitle || null,
      og_description: data.ogDescription || null,
      status: data.status,
      is_machine_generated: data.isMachineGenerated,
      reviewed_by: reviewed ? context.userId : null,
      reviewed_at: reviewed ? new Date().toISOString() : null,
      updated_by: context.userId,
    };
    const { data: saved, error } = await context.supabase
      .from("content_translations")
      .upsert({ ...record, created_by: context.userId }, { onConflict: "content_entry_id,language" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: `saved ${data.language} translation (${data.status})`,
      content_type: "content_translation",
      content_id: saved.id,
      content_label: data.title,
    });
    return saved;
  });

export const deleteTranslation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context as unknown as AdminContext);
    const { error } = await context.supabase.from("content_translations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: "removed a translation",
      content_type: "content_translation",
      content_id: data.id,
    });
    return { ok: true };
  });

const languageNames: Record<TranslationLanguage, string> = {
  ar: "Modern Standard Arabic",
  ha: "Hausa",
  fr: "French",
  es: "Spanish",
  tr: "Turkish",
  de: "German",
  ur: "Urdu",
  zh: "Simplified Chinese",
};

/**
 * Produces a machine translation DRAFT only. It is returned to the editor for review and is
 * never written to the database or published automatically.
 */
export const generateTranslationDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ contentEntryId: z.string().uuid(), language: z.enum(translationLanguages) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context as unknown as AdminContext);
    const { data: entry, error } = await context.supabase
      .from("content_entries")
      .select("title,summary,body,image_alt,seo_title,seo_description,og_title,og_description")
      .eq("id", data.contentEntryId)
      .single();
    if (error || !entry) throw new Error("The English version could not be read.");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Automatic translation is not available right now. You can still write the translation by hand.");

    const source = {
      title: entry.title ?? "",
      summary: entry.summary ?? "",
      body: entry.body ?? "",
      imageAlt: entry.image_alt ?? "",
      seoTitle: entry.seo_title ?? "",
      seoDescription: entry.seo_description ?? "",
      ogTitle: entry.og_title ?? "",
      ogDescription: entry.og_description ?? "",
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              `You translate website content from English into ${languageNames[data.language]}. ` +
              "Translate faithfully. Never invent facts, claims, statistics, testimonials or promises that are not in the source. " +
              "Keep brand names such as BangisKebbi.com, Bangis Kebbi and BK Community Support Initiative unchanged. Keep the same paragraph breaks. " +
              "Leave a field as an empty string if the source field is empty. " +
              'Reply with JSON only, using exactly these keys: title, summary, body, imageAlt, seoTitle, seoDescription, ogTitle, ogDescription.',
          },
          { role: "user", content: JSON.stringify(source) },
        ],
      }),
    });

    if (response.status === 429) throw new Error("Too many translation requests right now. Please try again shortly.");
    if (response.status === 402) throw new Error("The automatic translation allowance has run out. Please add credits or write the translation by hand.");
    if (!response.ok) throw new Error("Automatic translation failed. You can still write the translation by hand.");

    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = payload.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("The translation draft could not be read. Please try again.");

    const draft = z
      .object({
        title: z.string().default(""),
        summary: z.string().default(""),
        body: z.string().default(""),
        imageAlt: z.string().default(""),
        seoTitle: z.string().default(""),
        seoDescription: z.string().default(""),
        ogTitle: z.string().default(""),
        ogDescription: z.string().default(""),
      })
      .parse(JSON.parse(match[0]));

    return { ...draft, isMachineGenerated: true as const };
  });
