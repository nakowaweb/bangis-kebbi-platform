import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_SOCIAL_LINKS } from "@/lib/contact-details";
import { createPublicSupabase } from "@/lib/public-content.server";

export const socialPlatforms = ["linkedin", "whatsapp", "facebook", "tiktok", "youtube", "instagram", "x", "telegram"] as const;
export type SocialPlatform = (typeof socialPlatforms)[number];

const httpsUrl = z.string().trim().min(1).max(500).url();

/** WhatsApp allows wa.me / api.whatsapp.com links; every other platform must be a plain HTTPS link. */
function validateUrl(platform: SocialPlatform, url: string) {
  const parsed = httpsUrl.safeParse(url);
  if (!parsed.success) throw new Error("Enter a complete web address, starting with https://");
  const value = new URL(parsed.data);
  if (value.protocol !== "https:") throw new Error("The web address must start with https://");
  if (platform === "whatsapp") {
    const host = value.hostname.replace(/^www\./, "");
    if (!["wa.me", "api.whatsapp.com", "whatsapp.com", "chat.whatsapp.com"].includes(host)) {
      throw new Error("Use a WhatsApp link such as https://wa.me/234...");
    }
  }
  return value.toString();
}

async function requireContentAdmin(context: { supabase: { rpc: (fn: "is_content_admin", args: { _user_id: string }) => PromiseLike<{ data: unknown; error: unknown }> }; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_content_admin", { _user_id: context.userId });
  if (error || !data) throw new Error("Administrator access is required.");
}

/** Enabled official links for the public website. */
export const listPublicSocialLinks = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await createPublicSupabase()
    .from("site_social_links")
    .select("id,platform,url,display_label,icon_key,sort_order")
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true })
    .limit(20);
  if (error || !data?.length) return [...DEFAULT_SOCIAL_LINKS];
  return data;
});

/** Every link, including disabled ones, for the admin manager. */
export const listSocialLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireContentAdmin(context);
    const { data, error } = await context.supabase
      .from("site_social_links")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const saveInput = z.object({
  id: z.string().uuid().optional(),
  platform: z.enum(socialPlatforms),
  url: z.string().trim().min(1).max(500),
  displayLabel: z.string().trim().max(60),
  iconKey: z.string().trim().max(40).optional(),
  isEnabled: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export const saveSocialLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => saveInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const url = validateUrl(data.platform, data.url);
    const record = {
      platform: data.platform,
      url,
      display_label: data.displayLabel || data.platform,
      icon_key: data.iconKey || null,
      is_enabled: data.isEnabled,
      sort_order: data.sortOrder,
      updated_by: context.userId,
    };
    const query = data.id
      ? context.supabase.from("site_social_links").update(record).eq("id", data.id)
      : context.supabase.from("site_social_links").insert({ ...record, created_by: context.userId });
    const { data: saved, error } = await query.select("*").single();
    if (error) throw new Error(error.message.includes("unique") ? "That platform already has a link. Edit the existing one instead." : error.message);
    await context.supabase.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: data.id ? "updated social link" : "added social link",
      content_type: "social_link",
      content_id: saved.id,
      content_label: saved.platform,
    });
    return saved;
  });

export const deleteSocialLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const { error } = await context.supabase.from("site_social_links").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: "removed social link",
      content_type: "social_link",
      content_id: data.id,
    });
    return { ok: true };
  });
