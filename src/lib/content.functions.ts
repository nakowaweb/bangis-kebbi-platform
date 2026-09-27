import { isWorldLanguage } from "@/lib/i18n/world-languages";
import { requireModule } from "@/lib/admin-access";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { PUBLIC_ENTRY_FIELDS, applyTranslations, createPublicSupabase, mediaUrl, signSiteMedia } from "@/lib/public-content.server";

const contentTypes = [
  "homepage", "about", "service", "project", "blog_post", "blog_category",
  "business", "umrah", "umrah_step", "umrah_faq", "umrah_notice", "umrah_requirement",
  "umrah_information", "umrah_contact", "foundation", "foundation_mission",
  "foundation_vision", "foundation_what_we_do",
  "foundation_initiative", "foundation_update", "community", "contact", "footer",
] as const;
const contentStatuses = ["draft", "published", "unpublished", "archived"] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional();

const contentInput = z.object({
  id: z.string().uuid().optional(),
  contentType: z.enum(contentTypes),
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(1000).optional(),
  body: z.string().trim().max(20000).optional(),
  imagePath: optionalText(500),
  imageAlt: optionalText(300),
  category: optionalText(120),
  author: optionalText(120),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  language: z.enum(["en", "ar", "ha", "fr", "es", "tr", "de", "ur", "zh"]).optional(),
  gallery: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
  projectUrl: z.union([z.literal(""), z.string().trim().url().max(500)]).optional(),
  completedOn: z.union([z.literal(""), z.string().trim().max(20)]).optional(),
  seoTitle: optionalText(180),
  seoDescription: optionalText(400),
  canonicalUrl: z.union([z.literal(""), z.string().trim().url().max(500)]).optional(),
  ogTitle: optionalText(180),
  ogDescription: optionalText(400),
  ogImagePath: optionalText(500),
  status: z.enum(contentStatuses),
  isEnabled: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(-100000).max(100000),
  scheduledFor: z.union([z.literal(""), z.null(), z.string().datetime()]).optional().transform((value) => value || undefined),
  publishedAt: z.string().datetime().optional(),
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
  defaultLanguage: z.enum(["en", "ar", "ha", "fr", "es", "tr", "de", "ur", "zh"]),
  seoTitle: z.string().trim().min(1).max(180),
  seoDescription: z.string().trim().min(1).max(500),
  googleSearchCx: z.union([z.literal(""), z.string().trim().regex(/^[A-Za-z0-9:_-]{5,100}$/, "The Search Engine ID contains invalid characters.")]),
  profileImagePath: z.string().trim().max(500),
  enabledLanguages: z.array(z.string().refine(isWorldLanguage)).min(3).max(200),
});

function publicClient() {
  return createPublicSupabase();
}

async function requireContentAdmin(context: { supabase: ReturnType<typeof publicClient>; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_content_admin", { _user_id: context.userId });
  if (error || !data) throw new Error("Content administrator access is required.");
  await requireModule(context as never, "content");
}

const languageInput = z.preprocess((v) => (["en", "ar", "ha", "fr", "es", "tr", "de", "ur", "zh"].includes(v as string) ? v : "en"), z.enum(["en", "ar", "ha", "fr", "es", "tr", "de", "ur", "zh"]));

export const getPublicContent = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ language: languageInput }).default({ language: "en" }).parse(input ?? {}))
  .handler(async ({ data }) => {
    const client = publicClient();
    const [{ data: settings }, { data: entries }] = await Promise.all([
      client.from("site_settings").select("website_name,company_name,location,global_status,contact_email,phone,whatsapp,footer_content,default_language,seo_title,seo_description,logo_path,favicon_path,profile_image_path,open_graph_image_path").eq("is_active", true).limit(1).maybeSingle(),
      client.from("content_entries").select(PUBLIC_ENTRY_FIELDS).order("sort_order", { ascending: true }).limit(200),
    ]);
    const translated = await applyTranslations(client, entries ?? [], data.language);
    const signed = await signSiteMedia([...translated.flatMap((row) => [row.image_path, row.og_image_path]), settings?.profile_image_path]);
    return {
      settings: settings ? { ...settings, profileImageUrl: mediaUrl(settings.profile_image_path, signed) } : settings,
      entries: translated.map((row) => ({
        ...row,
        imageUrl: mediaUrl(row.image_path, signed),
        ogImageUrl: mediaUrl(row.og_image_path ?? row.image_path, signed),
      })),
    };
  });

/** Public language availability, read server-side so signed-out visitors never hit protected database helpers. */
export const getPublicEnabledLanguages = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient()
    .from("site_settings")
    .select("social_links")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  const config = data?.social_links && typeof data.social_links === "object" && !Array.isArray(data.social_links)
    ? data.social_links as Record<string, unknown>
    : {};
  return Array.isArray(config["enabledLanguages"])
    ? config["enabledLanguages"].filter(isWorldLanguage)
    : [];
});

const publicListInput = z.object({ contentType: z.enum(contentTypes), language: languageInput });

/** Published entries of one content area, ordered for public listing pages. */
export const listPublicEntries = createServerFn({ method: "GET" })
  .validator((input: unknown) => publicListInput.parse(input))
  .handler(async ({ data }) => {
    const client = createPublicSupabase();
    const { data: rows } = await client
      .from("content_entries")
      .select(PUBLIC_ENTRY_FIELDS)
      .eq("content_type", data.contentType)
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false })
      .limit(200);
    const list = await applyTranslations(client, rows ?? [], data.language);
    const signed = await signSiteMedia(list.flatMap((row) => [row.image_path, row.og_image_path]));
    return list.map((row) => ({
      ...row,
      imageUrl: mediaUrl(row.image_path, signed),
      ogImageUrl: mediaUrl(row.og_image_path ?? row.image_path, signed),
    }));
  });

/** A single published entry, used by public detail pages. */
export const getPublicEntry = createServerFn({ method: "GET" })
  .validator((input: unknown) => publicListInput.extend({ slug: z.string().trim().min(1).max(160) }).parse(input))
  .handler(async ({ data }) => {
    const client = createPublicSupabase();
    const { data: found } = await client
      .from("content_entries")
      .select(PUBLIC_ENTRY_FIELDS)
      .eq("content_type", data.contentType)
      .eq("slug", data.slug)
      .maybeSingle();
    if (!found) return null;
    const [row] = await applyTranslations(client, [found], data.language);
    if (!row) return null;
    const payload = (row.payload && typeof row.payload === "object" && !Array.isArray(row.payload) ? row.payload : {}) as Record<string, unknown>;
    const videoPath = typeof payload["videoPath"] === "string" ? (payload["videoPath"] as string) : null;
    const galleryPaths = Array.isArray(row.gallery) ? (row.gallery as unknown[]).filter((item): item is string => typeof item === "string") : [];
    const signed = await signSiteMedia([row.image_path, row.og_image_path, videoPath, ...galleryPaths]);
    return {
      ...row,
      imageUrl: mediaUrl(row.image_path, signed),
      ogImageUrl: mediaUrl(row.og_image_path ?? row.image_path, signed),
      videoFileUrl: mediaUrl(videoPath, signed),
      galleryUrls: galleryPaths.map((path) => mediaUrl(path, signed)).filter((url): url is string => !!url),
    };
  });

export const getAdminWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireContentAdmin(context);
    const [{ data: settings }, { data: entries }, { data: media }, { data: audit }] = await Promise.all([
      context.supabase.from("site_settings").select("*").eq("setting_key", "primary").single(),
      context.supabase.from("content_entries").select("*").order("updated_at", { ascending: false }).limit(100),
       context.supabase.from("media_assets").select("*").order("created_at", { ascending: false }),
      context.supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    return { settings, entries: entries ?? [], media: media ?? [], audit: audit ?? [], userId: context.userId };
  });

export const saveContentEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => contentInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const record = {
      content_type: data.contentType,
      slug: data.slug,
      title: data.title,
      summary: data.summary || null,
      body: data.body || null,
      image_path: data.imagePath || null,
      image_alt: data.imageAlt || null,
      category: data.category || null,
      author: data.author || null,
      tags: data.tags ?? [],
      language: data.language ?? "en",
      gallery: (data.gallery ?? []) as unknown as Json,
      project_url: data.projectUrl || null,
      completed_on: data.completedOn || null,
      seo_title: data.seoTitle || null,
      seo_description: data.seoDescription || null,
      canonical_url: data.canonicalUrl || null,
      og_title: data.ogTitle || null,
      og_description: data.ogDescription || null,
      og_image_path: data.ogImagePath || null,
      status: data.status,
      is_enabled: data.isEnabled,
      is_featured: data.isFeatured,
      sort_order: data.sortOrder,
      scheduled_for: data.scheduledFor || null,
      published_at: data.status === "published" ? (data.publishedAt || data.scheduledFor || new Date().toISOString()) : (data.publishedAt || null),
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
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const { error } = await context.supabase.from("content_entries").update({ status: "archived", deleted_at: new Date().toISOString(), updated_by: context.userId }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const restoreContentEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const { data: restored, error } = await context.supabase.from("content_entries").update({ status: "draft", deleted_at: null, published_at: null, updated_by: context.userId }).eq("id", data.id).select("id,title").single();
    if (error) throw new Error(error.message);
    await context.supabase.from("admin_audit_logs").insert({ admin_id: context.userId, action: "restored content", content_type: "content", content_id: restored.id, content_label: restored.title });
    return restored;
  });

export const deleteContentEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const { data: roles, error: roleError } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "super_admin");
    if (roleError || !roles?.length) throw new Error("Super Admin access is required to permanently delete content.");
    const { data: row, error: readError } = await context.supabase.from("content_entries").select("id,title,status,deleted_at").eq("id", data.id).single();
    if (readError) throw new Error(readError.message);
    if (row.status !== "archived" || !row.deleted_at) throw new Error("Archive this item before permanently deleting it.");
    const { error } = await context.supabase.from("content_entries").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("admin_audit_logs").insert({ admin_id: context.userId, action: "permanently deleted content", content_type: "content", content_id: row.id, content_label: row.title });
    return { ok: true };
  });

export const archiveMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const { data: media, error } = await context.supabase.from("media_assets").update({ deleted_at: new Date().toISOString() }).eq("id", data.id).select("id,name").single();
    if (error) throw new Error(error.message);
    await context.supabase.from("admin_audit_logs").insert({ admin_id: context.userId, action: "archived media", content_type: "media", content_id: media.id, content_label: media.name });
    return { ok: true };
  });

export const restoreMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const { data: media, error } = await context.supabase.from("media_assets").update({ deleted_at: null }).eq("id", data.id).select("id,name").single();
    if (error) throw new Error(error.message);
    await context.supabase.from("admin_audit_logs").insert({ admin_id: context.userId, action: "restored media", content_type: "media", content_id: media.id, content_label: media.name });
    return { ok: true };
  });

export const replaceMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(200),
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml", "video/mp4", "video/webm", "video/quicktime"]),
    byteSize: z.number().int().positive().max(52428800),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const { data: current, error: readError } = await context.supabase.from("media_assets").select("id,name,mime_type,storage_path,deleted_at").eq("id", data.id).single();
    if (readError) throw new Error(readError.message);
    if (current.deleted_at) throw new Error("Restore this media before replacing it.");
    const currentKind = current.mime_type.startsWith("video/") ? "video" : "image";
    const nextKind = data.mimeType.startsWith("video/") ? "video" : "image";
    if (currentKind !== nextKind) throw new Error(`Choose another ${currentKind} file so existing content remains compatible.`);
    const { data: saved, error } = await context.supabase.from("media_assets").update({
      name: data.name,
      mime_type: data.mimeType,
      byte_size: data.byteSize,
      width: data.width ?? null,
      height: data.height ?? null,
    }).eq("id", data.id).select("*").single();
    if (error) throw new Error(error.message);
    await context.supabase.from("admin_audit_logs").insert({ admin_id: context.userId, action: "replaced media file", content_type: "media", content_id: saved.id, content_label: saved.name });
    return saved;
  });

export const removeMediaFromContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid(), confirmed: z.literal(true) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const { data: media, error: readError } = await context.supabase.from("media_assets").select("id,name,storage_path,usage_count").eq("id", data.id).single();
    if (readError) throw new Error(readError.message);
    const path = media.storage_path;
    const { data: entries, error: refError } = await context.supabase.from("content_entries").select("id,image_path,og_image_path,gallery,payload");
    if (refError) throw new Error(refError.message);
    const refs = (entries ?? []).filter((entry) => entry.image_path === path || entry.og_image_path === path || JSON.stringify(entry.gallery ?? []).includes(path) || JSON.stringify(entry.payload ?? {}).includes(path));
    for (const entry of refs) {
      const gallery = Array.isArray(entry.gallery) ? entry.gallery.filter((item) => item !== path) : entry.gallery;
      const payload = entry.payload && typeof entry.payload === "object" && !Array.isArray(entry.payload)
        ? Object.fromEntries(Object.entries(entry.payload as Record<string, Json>).map(([key, value]) => [key, value === path ? null : value]))
        : entry.payload;
      const { error } = await context.supabase.from("content_entries").update({
        image_path: entry.image_path === path ? null : entry.image_path,
        og_image_path: entry.og_image_path === path ? null : entry.og_image_path,
        gallery,
        payload,
        updated_by: context.userId,
      }).eq("id", entry.id);
      if (error) throw new Error(error.message);
    }
    if (media.usage_count !== 0) {
      const { error } = await context.supabase.from("media_assets").update({ usage_count: 0 }).eq("id", media.id);
      if (error) throw new Error(error.message);
    }
    await context.supabase.from("admin_audit_logs").insert({ admin_id: context.userId, action: `removed media from ${refs.length} content item(s)`, content_type: "media", content_id: media.id, content_label: media.name });
    return { ok: true, removedReferences: refs.length };
  });

export const deleteMediaAssetPermanently = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid(), confirmName: z.string().max(200), removeDependencies: z.boolean().default(false) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const { data: roles, error: roleError } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "super_admin");
    if (roleError || !roles?.length) throw new Error("Super Admin access is required to permanently delete media.");
    const { data: media, error: readError } = await context.supabase.from("media_assets").select("id,name,storage_path,deleted_at,is_protected,usage_count").eq("id", data.id).single();
    if (readError) throw new Error(readError.message);
    if (!media.deleted_at) throw new Error("Archive this media before permanently deleting it.");
    if (media.is_protected) throw new Error("Protected brand media cannot be permanently deleted.");
    if (data.confirmName.trim() !== media.name) throw new Error("Type the exact file name to confirm permanent deletion.");

    const path = media.storage_path;
    const { data: entries, error: refError } = await context.supabase.from("content_entries").select("id,title,image_path,og_image_path,gallery,payload");
    if (refError) throw new Error(refError.message);
    const refs = (entries ?? []).filter((entry) => entry.image_path === path || entry.og_image_path === path || JSON.stringify(entry.gallery ?? []).includes(path) || JSON.stringify(entry.payload ?? {}).includes(path));
    if ((refs.length > 0 || media.usage_count > 0) && !data.removeDependencies) {
      return { ok: false as const, dependencies: refs.map((entry) => entry.title), usageCount: media.usage_count };
    }

    for (const entry of refs) {
      const gallery = Array.isArray(entry.gallery) ? entry.gallery.filter((item) => item !== path) : entry.gallery;
      const payload = entry.payload && typeof entry.payload === "object" && !Array.isArray(entry.payload)
        ? Object.fromEntries(Object.entries(entry.payload as Record<string, Json>).map(([key, value]) => [key, value === path ? null : value]))
        : entry.payload;
      const { error } = await context.supabase.from("content_entries").update({
        image_path: entry.image_path === path ? null : entry.image_path,
        og_image_path: entry.og_image_path === path ? null : entry.og_image_path,
        gallery, payload, updated_by: context.userId,
      }).eq("id", entry.id);
      if (error) throw new Error(error.message);
    }
    if (media.usage_count > 0) {
      const { error } = await context.supabase.from("media_assets").update({ usage_count: 0 }).eq("id", media.id);
      if (error) throw new Error(error.message);
    }

    const { error: storageError } = await context.supabase.storage.from("site-media").remove([path]);
    if (storageError) throw new Error(`Storage file could not be deleted: ${storageError.message}`);
    const { error: deleteError } = await context.supabase.from("media_assets").delete().eq("id", media.id);
    if (deleteError) throw new Error(deleteError.message);
    await context.supabase.from("admin_audit_logs").insert({ admin_id: context.userId, action: refs.length || media.usage_count ? `permanently deleted media and removed ${refs.length} reference(s)` : "permanently deleted media", content_type: "media", content_id: media.id, content_label: media.name });
    return { ok: true as const, removedReferences: refs.length };
  });

export const saveSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => settingsInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const { data: current } = await context.supabase.from("site_settings").select("social_links").eq("id", data.id).single();
    const currentConfig = current?.social_links && typeof current.social_links === "object" && !Array.isArray(current.social_links)
      ? current.social_links as Record<string, Json | undefined>
      : {};
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
      social_links: { ...currentConfig, googleSearchCx: data.googleSearchCx, enabledLanguages: data.enabledLanguages },
      profile_image_path: data.profileImagePath || null,
      updated_by: context.userId,
    }).eq("id", data.id).select("*").single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const registerMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({
    name: z.string().trim().min(1).max(200),
    storagePath: z.string().trim().min(1).max(500),
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml", "video/mp4", "video/webm", "video/quicktime"]),
    altText: z.string().trim().max(500),
    byteSize: z.number().int().positive().max(52428800),
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
    await context.supabase.from("admin_audit_logs").insert({ admin_id: context.userId, action: "uploaded media", content_type: "media", content_id: saved.id, content_label: saved.name });
    return saved;
  });
/** Checks a Google Programmable Search Engine ID against Google's own loader; never claims success without Google accepting it. */
export const testGoogleSearchCx = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ cx: z.string().trim().regex(/^[A-Za-z0-9:_-]{5,100}$/, "Enter a valid Search Engine ID.") }).parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    try {
      const response = await fetch(`https://cse.google.com/cse.js?cx=${encodeURIComponent(data.cx)}`, { headers: { accept: "*/*" } });
      const text = await response.text();
      const valid = response.ok && !/<html/i.test(text.slice(0, 300));
      return valid
        ? { ok: true as const, message: "Google accepted this Search Engine ID. Save settings to activate Web Search." }
        : { ok: false as const, message: `Google rejected this Search Engine ID (status ${response.status}). Check the ID in your Programmable Search Engine control panel.` };
    } catch {
      return { ok: false as const, message: "Google could not be reached to test the ID. Try again shortly." };
    }
  });
