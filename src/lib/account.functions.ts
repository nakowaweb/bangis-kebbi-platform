import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const profileInput = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40),
  country: z.string().trim().max(80),
  city: z.string().trim().max(80),
  preferredLanguage: z.enum(["en", "ha", "ar"]),
});

export type MemberAccount = Awaited<ReturnType<typeof loadAccount>>;

async function loadAccount(context: { supabase: any; userId: string; claims: Record<string, unknown> }) {
  const { supabase, userId, claims } = context;
  await supabase.rpc("ensure_member_role");

  let { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!profile) {
    const metadata = (claims["user_metadata"] ?? {}) as Record<string, string | undefined>;
    const { data: created } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name: metadata["full_name"] ?? "",
        email: (claims["email"] as string | undefined) ?? "",
        phone: metadata["phone"] ?? null,
        country: metadata["country"] ?? null,
        city: metadata["city"] ?? null,
        preferred_language: metadata["preferred_language"] ?? "en",
      })
      .select("*")
      .single();
    profile = created ?? null;
  }

  const [{ data: roleRows }, { count: unreadCount }, { data: documents }, { data: activityRows }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("notification_recipients").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
    supabase.from("member_documents").select("id,document_type,original_name,review_status,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("member_activities").select("id,title,description,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
  ]);

  const roles = (roleRows ?? []).map((row: { role: string }) => row.role);

  // Server-side truth: the one-time owner bootstrap is only offered while no super admin exists.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin");
  const superAdminExists = (count ?? 0) > 0;

  return {
    profile,
    roles,
    superAdminExists,
    isAdmin: roles.includes("admin") || roles.includes("super_admin"),
    isSuperAdmin: roles.includes("super_admin"),
    unreadCount: unreadCount ?? 0,
    recentActivities: (activityRows ?? []) as { id: string; title: string; description: string | null; created_at: string }[],
    documents: documents ?? [],
  };
}

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => loadAccount(context as never));

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => profileInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        phone: data.phone || null,
        country: data.country || null,
        city: data.city || null,
        preferred_language: data.preferredLanguage,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** One-time bootstrap: succeeds only while no super admin exists yet. */
export const claimFirstSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_first_super_admin");
    if (error) throw new Error(error.message);
    return { claimed: Boolean(data) };
  });
