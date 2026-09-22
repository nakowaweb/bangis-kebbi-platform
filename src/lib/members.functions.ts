import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const manageableRoles = ["member", "content_manager", "support", "finance", "admin", "super_admin"] as const;

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_platform_admin", { _user_id: context.userId });
  if (error || !data) throw new Error("Administrator access is required.");
}

async function requireSuperAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
  if (error || !data) throw new Error("Super Admin access is required.");
}

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        search: z.string().trim().max(120).default(""),
        status: z.enum(["all", "active", "inactive"]).default("all"),
        page: z.number().int().min(0).max(1000).default(0),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const pageSize = 20;
    let query = context.supabase
      .from("profiles")
      .select("id,full_name,email,phone,country,city,preferred_language,is_active,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(data.page * pageSize, data.page * pageSize + pageSize - 1);

    if (data.search) {
      const term = `%${data.search.replaceAll("%", "")}%`;
      query = query.or(`full_name.ilike.${term},email.ilike.${term},country.ilike.${term},city.ilike.${term}`);
    }
    if (data.status !== "all") query = query.eq("is_active", data.status === "active");

    const { data: members, count, error } = await query;
    if (error) throw new Error(error.message);

    type MemberRow = {
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
      country: string | null;
      city: string | null;
      preferred_language: string;
      is_active: boolean;
      created_at: string;
    };
    const rows = (members ?? []) as MemberRow[];
    const ids = rows.map((member) => member.id);
    const { data: roleRows } = ids.length
      ? await context.supabase.from("user_roles").select("user_id,role").in("user_id", ids)
      : { data: [] as { user_id: string; role: string }[] };

    return {
      members: rows.map((member) => ({
        ...member,
        roles: (roleRows ?? []).filter((row: { user_id: string }) => row.user_id === member.id).map((row: { role: string }) => row.role),
      })),
      total: count ?? 0,
      page: data.page,
      pageSize,
    };
  });

export const setMemberActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ userId: z.string().uuid(), isActive: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const { data: updated, error } = await context.supabase
      .from("profiles")
      .update({ is_active: data.isActive })
      .eq("id", data.userId)
      .select("id,full_name")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: data.isActive ? "activated member account" : "deactivated member account",
      content_type: "member",
      content_id: data.userId,
      content_label: updated.full_name || data.userId,
    });
    return { ok: true };
  });

export const setMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z.object({ userId: z.string().uuid(), role: z.enum(manageableRoles), grant: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context as never);
    if (data.userId === context.userId && data.role === "super_admin" && !data.grant) {
      throw new Error("You cannot remove your own Super Admin role.");
    }
    const { error } = data.grant
      ? await context.supabase.from("user_roles").insert({ user_id: data.userId, role: data.role })
      : await context.supabase.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
    if (error && !error.message.includes("duplicate key")) throw new Error(error.message);
    await context.supabase.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: `${data.grant ? "granted" : "removed"} role ${data.role}`,
      content_type: "user_roles",
      content_id: data.userId,
      content_label: data.role,
    });
    return { ok: true };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as never);
    const [members, active, entries, published, media, notifications] = await Promise.all([
      context.supabase.from("profiles").select("id", { count: "exact", head: true }),
      context.supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
      context.supabase.from("content_entries").select("id", { count: "exact", head: true }).is("deleted_at", null),
      context.supabase.from("content_entries").select("id", { count: "exact", head: true }).eq("status", "published").is("deleted_at", null),
      context.supabase.from("media_assets").select("id", { count: "exact", head: true }).is("deleted_at", null),
      context.supabase.from("notifications").select("id", { count: "exact", head: true }),
    ]);
    const { data: recent } = await context.supabase
      .from("admin_audit_logs")
      .select("id,action,content_type,content_label,created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    return {
      members: members.count ?? 0,
      activeMembers: active.count ?? 0,
      entries: entries.count ?? 0,
      publishedEntries: published.count ?? 0,
      media: media.count ?? 0,
      notifications: notifications.count ?? 0,
      recent: (recent ?? []) as { id: string; action: string; content_type: string; content_label: string | null; created_at: string }[],
    };
  });
