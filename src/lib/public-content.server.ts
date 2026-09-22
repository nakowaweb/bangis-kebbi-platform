import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

/** Server-side Supabase client using the publishable key. RLS limits reads to published content. */
export function createPublicSupabase() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const PUBLIC_ENTRY_FIELDS =
  "id,content_type,slug,title,summary,body,payload,image_path,image_alt,category,tags,author,language,gallery,project_url,completed_on,seo_title,seo_description,canonical_url,og_title,og_description,og_image_path,is_featured,sort_order,published_at,updated_at";

/** External links pass through unchanged; stored paths need a signed link (the media bucket is private). */
export function publicMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return /^https?:\/\//i.test(path) ? path : null;
}

/** Signs stored site-media paths so public pages can display admin-uploaded images. */
export async function signSiteMedia(paths: Array<string | null | undefined>): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter((path): path is string => !!path && !/^https?:\/\//i.test(path)))];
  if (unique.length === 0) return {};
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage.from("site-media").createSignedUrls(unique, 60 * 60 * 24);
  const signed: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) signed[item.path] = item.signedUrl;
  }
  return signed;
}

/** Resolves an image reference to a usable URL: external links as-is, stored paths from the signed map. */
export function mediaUrl(path: string | null | undefined, signed: Record<string, string>): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return signed[path] ?? null;
}

/* ------------------------------------------------------------------ *
 * Locale-aware CMS reads
 * ------------------------------------------------------------------ */

type TranslatableRow = {
  id: string;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  image_alt?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
};

const TRANSLATION_FIELDS = ["title", "summary", "body", "image_alt", "seo_title", "seo_description", "og_title", "og_description"] as const;

/**
 * Overlays published Hausa/Arabic translations onto English content rows.
 * English rows are returned untouched, and a missing translated field falls back
 * to the English original so a page is never half-empty.
 */
export async function applyTranslations<T extends TranslatableRow>(
  client: ReturnType<typeof createPublicSupabase>,
  rows: T[],
  language: string | null | undefined,
): Promise<T[]> {
  if (!language || language === "en" || rows.length === 0) return rows;
  const ids = rows.map((row) => row.id);
  const { data } = await client
    .from("content_translations")
    .select("content_entry_id,title,summary,body,image_alt,seo_title,seo_description,og_title,og_description")
    .in("content_entry_id", ids)
    .eq("language", language)
    .eq("status", "published");
  if (!data || data.length === 0) return rows;
  const byEntry = new Map(data.map((row) => [row.content_entry_id, row]));
  return rows.map((row) => {
    const translation = byEntry.get(row.id);
    if (!translation) return row;
    const merged: Record<string, unknown> = { ...row };
    for (const field of TRANSLATION_FIELDS) {
      const value = (translation as Record<string, unknown>)[field];
      if (typeof value === "string" && value.trim().length > 0) merged[field] = value;
    }
    return merged as T;
  });
}
