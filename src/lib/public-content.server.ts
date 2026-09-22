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
