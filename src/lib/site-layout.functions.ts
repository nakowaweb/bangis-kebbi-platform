import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { requireModule } from "@/lib/admin-access";
import { createPublicSupabase, mediaUrl, signSiteMedia } from "@/lib/public-content.server";
import { DEFAULT_LAYOUT, HOMEPAGE_SECTIONS, LAYOUT_SLUG, SERVICE_MINI_SLUGS, TEXT_OVERRIDE_KEYS, normalizeLayout, type SiteLayout } from "@/lib/site-layout";

async function withUrls(layout: SiteLayout) {
  const signed = await signSiteMedia([...Object.values(layout.minis), ...layout.hero.slides.map((s) => s.path)] as string[]);
  const miniUrls: Record<string, string> = {};
  for (const [slug, path] of Object.entries(layout.minis)) {
    const url = path ? mediaUrl(path, signed) : null;
    if (url) miniUrls[slug] = url;
  }
  const heroUrls: Record<string, string> = {};
  for (const slide of layout.hero.slides) {
    const url = mediaUrl(slide.path, signed);
    if (url) heroUrls[slide.path] = url;
  }
  return { ...layout, miniUrls, heroUrls };
}

/** Public homepage layout: visibility, order, motion, EN/AR/HA text overrides and signed service illustration links. */
export const getSiteLayout = createServerFn({ method: "GET" }).handler(async () => {
  const client = createPublicSupabase();
  const { data } = await client.from("content_entries").select("payload").eq("content_type", "homepage").eq("slug", LAYOUT_SLUG).maybeSingle();
  const layout = normalizeLayout(data?.payload);
  return withUrls(layout);
});

const langText = z.object({ en: z.string().trim().max(300), ar: z.string().trim().max(300), ha: z.string().trim().max(300) });
const layoutInput = z.object({
  sections: z.record(z.enum(HOMEPAGE_SECTIONS), z.boolean()),
  order: z.array(z.enum(HOMEPAGE_SECTIONS)).max(HOMEPAGE_SECTIONS.length),
  motion: z.enum(["full", "reduced", "off"]),
  marqueeSeconds: z.number().min(6).max(60).optional(),
  carouselSeconds: z.number().min(2).max(10).optional(),
  text: z.record(z.enum(TEXT_OVERRIDE_KEYS), langText),
  minis: z.record(z.enum(SERVICE_MINI_SLUGS), z.string().trim().max(500)),
  hero: z.object({
    slides: z.array(z.object({ path: z.string().trim().min(1).max(500), alt: z.string().trim().max(300), label: z.string().trim().max(120), enabled: z.boolean() })).max(8),
    intervalSeconds: z.number().min(2).max(30),
    transitionMs: z.number().int().min(300).max(4000),
  }).optional(),
});

/** Admin read of the saved layout (including unsigned storage paths for the editor). */
export const getAdminSiteLayout = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: ok } = await context.supabase.rpc("is_content_admin", { _user_id: context.userId });
    if (!ok) throw new Error("Content administrator access is required.");
    const { data } = await context.supabase.from("content_entries").select("payload").eq("content_type", "homepage").eq("slug", LAYOUT_SLUG).maybeSingle();
    const layout = normalizeLayout(data?.payload);
    return withUrls(layout);
  });

export const saveSiteLayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => layoutInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("is_content_admin", { _user_id: context.userId });
    if (!ok) throw new Error("Content administrator access is required.");
    await requireModule(context as never, "content");
    const layout: SiteLayout = normalizeLayout(data);
    const payload = layout as unknown as Json;
    const { data: existing } = await context.supabase.from("content_entries").select("id").eq("content_type", "homepage").eq("slug", LAYOUT_SLUG).maybeSingle();
    const record = {
      content_type: "homepage", slug: LAYOUT_SLUG, title: "Homepage layout & site text", payload,
      status: "published" as const, is_enabled: true, sort_order: 9000, published_at: new Date().toISOString(), updated_by: context.userId,
    };
    const query = existing
      ? context.supabase.from("content_entries").update(record).eq("id", existing.id)
      : context.supabase.from("content_entries").insert(record);
    const { data: saved, error } = await query.select("id").single();
    if (error) throw new Error(error.message);
    await context.supabase.from("admin_audit_logs").insert({ admin_id: context.userId, action: "updated homepage layout", content_type: "content_entries", content_id: saved.id, content_label: "Homepage layout & site text", metadata: { motion: layout.motion, order: layout.order } as Json });
    return { ok: true, defaults: DEFAULT_LAYOUT };
  });
