import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminModules, requireModule } from "@/lib/admin-access";

// super_admin is intentionally NOT manageable from the app.
const manageableRoles = ["member", "content_manager", "support", "finance", "admin"] as const;
const moduleIds = adminModules.map((m) => m.id) as [string, ...string[]];

type Ctx = { supabase: any; userId: string };

async function requireAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("is_platform_admin", { _user_id: context.userId });
  if (error || !data) throw new Error("Administrator access is required.");
}

async function requireSuperAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
  if (error || !data) throw new Error("Super Admin access is required.");
}

async function assertNotSuperAdminTarget(context: Ctx, userId: string) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: userId, _role: "super_admin" });
  if (data) throw new Error("The Super Admin account is protected and cannot be changed here.");
}

async function audit(context: Ctx, action: string, contentId: string, label: string | null) {
  await context.supabase.from("admin_audit_logs").insert({
    admin_id: context.userId, action, content_type: "member", content_id: contentId, content_label: label,
  });
}

/** What the signed-in admin may see in the admin workspace. */
export const getMyAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    await requireAdmin(ctx);
    const { data: isSuper } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "super_admin" });
    if (isSuper) return { isSuperAdmin: true, modules: moduleIds as string[] };
    const { data } = await ctx.supabase.from("admin_permissions").select("module").eq("user_id", ctx.userId);
    return { isSuperAdmin: false, modules: ((data ?? []) as { module: string }[]).map((r) => r.module) };
  });

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z.object({
      search: z.string().trim().max(120).default(""),
      status: z.enum(["all", "active", "inactive"]).default("all"),
      page: z.number().int().min(0).max(1000).default(0),
    }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireAdmin(ctx);
    await requireModule(ctx, "members");
    const pageSize = 20;
    // The permanent Member ID column comes from the V7 update. Databases without it (e.g. the test copy)
    // still list members by their real account ID instead of failing with "profiles.member_id does not exist".
    const run = (withMemberId: boolean) => {
      let query = ctx.supabase
        .from("profiles")
        .select(`id,${withMemberId ? "member_id," : ""}full_name,email,phone,country,city,preferred_language,is_active,created_at`, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(data.page * pageSize, data.page * pageSize + pageSize - 1);
      if (data.search) {
        const term = `%${data.search.replaceAll("%", "").replaceAll(",", " ")}%`;
        query = query.or(`${withMemberId ? `member_id.ilike.${term},` : ""}full_name.ilike.${term},email.ilike.${term},country.ilike.${term},city.ilike.${term}`);
      }
      if (data.status !== "all") query = query.eq("is_active", data.status === "active");
      return query;
    };
    let { data: members, count, error } = await run(true);
    if (error && /member_id/.test(error.message)) ({ data: members, count, error } = await run(false));
    if (error) throw new Error(error.message);

    type MemberRow = { id: string; member_id: string | null; full_name: string; email: string; phone: string | null; country: string | null; city: string | null; preferred_language: string; is_active: boolean; created_at: string };
    const rows = (members ?? []) as MemberRow[];
    const ids = rows.map((m) => m.id);
    const [{ data: roleRows }, { data: permRows }] = ids.length
      ? await Promise.all([
          ctx.supabase.from("user_roles").select("user_id,role").in("user_id", ids),
          ctx.supabase.from("admin_permissions").select("user_id,module").in("user_id", ids),
        ])
      : [{ data: [] }, { data: [] }];
    return {
      members: rows.map((m) => ({
        ...m,
        roles: ((roleRows ?? []) as { user_id: string; role: string }[]).filter((r) => r.user_id === m.id).map((r) => r.role),
        modules: ((permRows ?? []) as { user_id: string; module: string }[]).filter((r) => r.user_id === m.id).map((r) => r.module),
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
    const ctx = context as unknown as Ctx;
    await requireSuperAdmin(ctx);
    await assertNotSuperAdminTarget(ctx, data.userId);
    const { data: updated, error } = await ctx.supabase.from("profiles").update({ is_active: data.isActive }).eq("id", data.userId).select("id,full_name").single();
    if (error) throw new Error(error.message);
    await audit(ctx, data.isActive ? "activated member account" : "deactivated member account", data.userId, updated.full_name || data.userId);
    return { ok: true };
  });

export const updateMemberProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z.object({
      userId: z.string().uuid(),
      fullName: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(255),
      phone: z.string().trim().max(40),
      country: z.string().trim().max(80),
      city: z.string().trim().max(80),
      preferredLanguage: z.enum(["en", "ar", "ha", "fr", "es", "tr", "de", "ur", "zh"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireSuperAdmin(ctx);
    if (data.userId !== ctx.userId) await assertNotSuperAdminTarget(ctx, data.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: current } = await supabaseAdmin.from("profiles").select("email").eq("id", data.userId).maybeSingle();
    if (current && current.email !== data.email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { email: data.email, email_confirm: true });
      if (authError) throw new Error(authError.message);
    }
    const { error } = await supabaseAdmin.from("profiles").update({
      full_name: data.fullName, email: data.email, phone: data.phone || null,
      country: data.country || null, city: data.city || null, preferred_language: data.preferredLanguage,
    }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    await audit(ctx, "updated member profile", data.userId, data.fullName);
    return { ok: true };
  });

export const resetMemberPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z.object({ userId: z.string().uuid(), newPassword: z.string().min(8).max(128), forceChange: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireSuperAdmin(ctx);
    await assertNotSuperAdminTarget(ctx, data.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.newPassword });
    if (error) throw new Error(error.message);
    const { error: flagError } = await supabaseAdmin.from("profiles").update({ must_change_password: data.forceChange } as never).eq("id", data.userId);
    if (flagError) throw new Error(flagError.message);
    // The password itself is never logged or returned.
    await audit(ctx, data.forceChange ? "reset member password (change required at next login)" : "reset member password", data.userId, null);
    return { ok: true };
  });

export const deleteMemberPermanently = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ userId: z.string().uuid(), confirmEmail: z.string().trim().max(255) }).parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireSuperAdmin(ctx);
    if (data.userId === ctx.userId) throw new Error("You cannot delete your own account.");
    await assertNotSuperAdminTarget(ctx, data.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin.from("profiles").select("email,full_name").eq("id", data.userId).maybeSingle();
    if (!profile || profile.email.toLowerCase() !== data.confirmEmail.toLowerCase()) {
      throw new Error("The confirmation email does not match this member.");
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await audit(ctx, "permanently deleted member account", data.userId, `${profile.full_name || ""} <${profile.email}>`);
    return { ok: true };
  });

export const setMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ userId: z.string().uuid(), role: z.enum(manageableRoles), grant: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireSuperAdmin(ctx);
    await assertNotSuperAdminTarget(ctx, data.userId);
    const { error } = data.grant
      ? await ctx.supabase.from("user_roles").insert({ user_id: data.userId, role: data.role })
      : await ctx.supabase.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
    if (error && !error.message.includes("duplicate key")) throw new Error(error.message);
    if (!data.grant && data.role === "admin") {
      await ctx.supabase.from("admin_permissions").delete().eq("user_id", data.userId);
    }
    await ctx.supabase.from("admin_audit_logs").insert({
      admin_id: ctx.userId, action: `${data.grant ? "granted" : "removed"} role ${data.role}`,
      content_type: "user_roles", content_id: data.userId, content_label: data.role,
    });
    return { ok: true };
  });

export const setAdminPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ userId: z.string().uuid(), modules: z.array(z.enum(moduleIds)).max(20) }).parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireSuperAdmin(ctx);
    await assertNotSuperAdminTarget(ctx, data.userId);
    const { error: delError } = await ctx.supabase.from("admin_permissions").delete().eq("user_id", data.userId);
    if (delError) throw new Error(delError.message);
    if (data.modules.length) {
      const { error } = await ctx.supabase.from("admin_permissions").insert(
        data.modules.map((module) => ({ user_id: data.userId, module, granted_by: ctx.userId })),
      );
      if (error) throw new Error(error.message);
    }
    await audit(ctx, `set admin permissions: ${data.modules.join(", ") || "none"}`, data.userId, null);
    return { ok: true };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    await requireAdmin(ctx);
    const [members, active, entries, published, media, notifications] = await Promise.all([
      ctx.supabase.from("profiles").select("id", { count: "exact", head: true }),
      ctx.supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
      ctx.supabase.from("content_entries").select("id", { count: "exact", head: true }).is("deleted_at", null),
      ctx.supabase.from("content_entries").select("id", { count: "exact", head: true }).eq("status", "published").is("deleted_at", null),
      ctx.supabase.from("media_assets").select("id", { count: "exact", head: true }).is("deleted_at", null),
      ctx.supabase.from("notifications").select("id", { count: "exact", head: true }),
    ]);
    const { data: recent } = await ctx.supabase.from("admin_audit_logs").select("id,action,content_type,content_label,created_at").order("created_at", { ascending: false }).limit(5);
    return {
      members: members.count ?? 0, activeMembers: active.count ?? 0, entries: entries.count ?? 0,
      publishedEntries: published.count ?? 0, media: media.count ?? 0, notifications: notifications.count ?? 0,
      recent: (recent ?? []) as { id: string; action: string; content_type: string; content_label: string | null; created_at: string }[],
    };
  });
