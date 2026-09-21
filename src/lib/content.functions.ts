import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database, Json } from "@/integrations/supabase/types";

const contentTypes = [
  "homepage", "about", "service", "project", "blog_post", "blog_category",
  "business", "umrah", "umrah_step", "umrah_faq", "umrah_notice", "foundation",
  "foundation_initiative", "foundation_update", "community", "contact",
] as const;
const contentStatuses = ["draft", "published", "unpublished", "archived"] as const;

const contentInput = z.object({
  id: z.string().uuid().optional(),
  contentType: z.enum(contentTypes),
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(1000).optional(),
  body: z.string().trim().max(20000).optional(),
  imagePath: z.string().trim().max(500).optional(),
  status: z.enum(contentStatuses),
  isEnabled: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(-100000).max(100000),
  scheduledFor: z.string().datetime().optional(),
  payload: z.record(z.string(), z.union([z.string().max(2000), z.number(), z.boolean(), z.null()])),
});

const settingsInput = z.object({
  id: z.string().uuid(),
  websiteName: z.string().trim().min(1).max(120),
  companyName: z.string().trim().min(1).max(160),
  location: z.string().trim().min(1).max(160),
  globalStatus: z.string().trim().min(1).max(160),
  contactEmail: z.union([z.literal(""), z.string().trim().email().max(254)]),
  phone: z.string().trim().max(40),
  whatsapp: z.string().trim().max(40),
  footerContent: z.string().trim().max(500),
  defaultLanguage: z.enum(["en", "ha", "ar"]),
  seoTitle: z.string().trim().min(1).max(180),
  seoDescription: z.string().trim().min(1).max(500),
});

function publicClient() {
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

async function requireContentAdmin(context: { supabase: ReturnType<typeof publicClient>; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_content_admin", { _user_id: context.userId });
  if (error || !data) throw new Error("Content administrator access is required.");
}

export const getPublicContent = createServerFn({ method: "GET" }).handler(async () => {
  const client = publicClient();
  const [{ data: settings }, { data: entries }] = await Promise.all([
    client.from("site_settings").select("website_name,company_name,location,global_status,contact_email,phone,whatsapp,footer_content,default_language,seo_title,seo_description,logo_path,favicon_path,profile_image_path,open_graph_image_path").eq("is_active", true).limit(1).maybeSingle(),
    client.from("content_entries").select("id,content_type,slug,title,summary,body,payload,image_path,is_featured,sort_order,published_at").order("sort_order", { ascending: true }).limit(200),
  ]);
  return { settings, entries: entries ?? [] };
});

export const getAdminWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireContentAdmin(context);
    const [{ data: settings }, { data: entries }, { data: media }, { data: audit }] = await Promise.all([
      context.supabase.from("site_settings").select("*").eq("setting_key", "primary").single(),
      context.supabase.from("content_entries").select("*").order("updated_at", { ascending: false }).limit(100),
      context.supabase.from("media_assets").select("*").is("deleted_at", null).order("created_at", { ascending: false }).limit(60),
      context.supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    return { settings, entries: entries ?? [], media: media ?? [], audit: audit ?? [], userId: context.userId };
  });

export const saveContentEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => contentInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const record = {
      content_type: data.contentType,
      slug: data.slug,
      title: data.title,
      summary: data.summary || null,
      body: data.body || null,
      image_path: data.imagePath || null,
      status: data.status,
      is_enabled: data.isEnabled,
      is_featured: data.isFeatured,
      sort_order: data.sortOrder,
      scheduled_for: data.scheduledFor || null,
      published_at: data.status === "published" ? new Date().toISOString() : null,
      payload: data.payload as Json,
      updated_by: context.userId,
      deleted_at: data.status === "archived" ? new Date().toISOString() : null,
    };
    const query = data.id
      ? context.supabase.from("content_entries").update(record).eq("id", data.id)
      : context.supabase.from("content_entries").insert(record);
    const { data: saved, error } = await query.select("*").single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const archiveContentEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const { error } = await context.supabase.from("content_entries").update({ status: "archived", deleted_at: new Date().toISOString(), updated_by: context.userId }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => settingsInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const { data: saved, error } = await context.supabase.from("site_settings").update({
      website_name: data.websiteName,
      company_name: data.companyName,
      location: data.location,
      global_status: data.globalStatus,
      contact_email: data.contactEmail || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      footer_content: data.footerContent,
      default_language: data.defaultLanguage,
      seo_title: data.seoTitle,
      seo_description: data.seoDescription,
      updated_by: context.userId,
    }).eq("id", data.id).select("*").single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const registerMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    name: z.string().trim().min(1).max(200),
    storagePath: z.string().trim().min(1).max(500),
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"]),
    altText: z.string().trim().max(500),
    byteSize: z.number().int().positive().max(10485760),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const { data: saved, error } = await context.supabase.from("media_assets").insert({
      name: data.name,
      storage_path: data.storagePath,
      mime_type: data.mimeType,
      alt_text: data.altText,
      byte_size: data.byteSize,
      width: data.width ?? null,
      height: data.height ?? null,
      uploaded_by: context.userId,
    }).select("*").single();
    if (error) throw new Error(error.message);
    await context.supabase.from("admin_audit_logs").insert({ admin_id: context.userId, action: "uploaded image", content_type: "media", content_id: saved.id, content_label: saved.name });
    return saved;
  });