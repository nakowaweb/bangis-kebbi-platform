import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { isWorldLanguage, worldLanguage } from "@/lib/i18n/world-languages";

async function sha(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Translates visible website text into any provider-supported language.
 * Results are cached, so each string is sent to the AI provider only once per language.
 */
export const translateTexts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      language: z.string().refine(isWorldLanguage, "Unsupported language"),
      texts: z.array(z.string().min(1).max(3000)).min(1).max(120),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    if (data.language === "en") return { translations: Object.fromEntries(data.texts.map((t) => [t, t])) };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Respect the Super Admin's enabled-language list when one is configured.
    const { data: settings } = await supabaseAdmin.from("site_settings").select("social_links").eq("is_active", true).limit(1).maybeSingle();
    const config = settings?.social_links && typeof settings.social_links === "object" && !Array.isArray(settings.social_links) ? settings.social_links as Record<string, unknown> : {};
    const enabled = Array.isArray(config["enabledLanguages"]) ? config["enabledLanguages"] : null;
    if (enabled && enabled.length > 0 && !enabled.includes(data.language)) throw new Error("This language is not enabled.");

    const unique = [...new Set(data.texts)];
    const hashes = await Promise.all(unique.map(sha));
    const { data: cached } = await supabaseAdmin
      .from("ui_text_translations")
      .select("source_hash,translated_text")
      .eq("language", data.language)
      .in("source_hash", hashes);
    const cache = new Map((cached ?? []).map((row) => [row.source_hash, row.translated_text]));
    const result: Record<string, string> = {};
    const missing: Array<{ text: string; hash: string }> = [];
    unique.forEach((text, i) => {
      const hit = cache.get(hashes[i]!);
      if (hit !== undefined) result[text] = hit;
      else missing.push({ text, hash: hashes[i]! });
    });
    if (missing.length === 0) return { translations: result };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Translation provider is not configured.");
    const target = worldLanguage(data.language);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              `Translate website interface and content strings into ${target.label} (${target.code}). ` +
              "Keep brand names (BangisKebbi.com, BangisKebbi Global Ltd, BK), personal names, URLs, emails, phone numbers and numbers unchanged. " +
              "Keep punctuation, symbols and arrows. If a string is already in the target language, return it unchanged. " +
              'Return only JSON: {"t": [translated strings in the same order and count]}.',
          },
          { role: "user", content: JSON.stringify(missing.map((m) => m.text)) },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (response.status === 429) throw new Error("Translation is busy. Please try again shortly.");
    if (response.status === 402) throw new Error("Translation credits are exhausted.");
    if (!response.ok) throw new Error("Translation failed.");
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    let list: unknown = [];
    try {
      const content = (payload.choices?.[0]?.message?.content ?? "{}").replace(/^```(?:json)?|```$/g, "").trim();
      list = (JSON.parse(content) as { t?: unknown }).t;
    } catch { list = []; }
    const translated = Array.isArray(list) && list.length === missing.length ? list : null;
    if (!translated) {
      missing.forEach((m) => { result[m.text] = m.text; });
      return { translations: result };
    }
    const rows = missing.map((m, i) => {
      const value = typeof translated[i] === "string" && translated[i] ? translated[i] as string : m.text;
      result[m.text] = value;
      return { language: data.language, source_hash: m.hash, source_text: m.text, translated_text: value };
    });
    await supabaseAdmin.from("ui_text_translations").upsert(rows, { onConflict: "language,source_hash", ignoreDuplicates: true });
    return { translations: result };
  });
