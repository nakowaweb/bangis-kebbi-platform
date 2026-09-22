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

export function publicMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = process.env["SUPABASE_URL"];
  return base ? `${base}/storage/v1/object/public/site-media/${path}` : null;
}
