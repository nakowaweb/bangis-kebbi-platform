import { requireModule } from "@/lib/admin-access";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const notificationCategories = ["system", "umrah", "foundation", "account", "announcement"] as const;
export type NotificationCategory = (typeof notificationCategories)[number];

const messageColumns = "id,title,body,category,link_path,status,audience,published_at,created_at";

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_platform_admin", { _user_id: context.userId });
  if (error || !data) throw new Error("Administrator access is required.");
  await requireModule(context as never, "notifications");
}

async function audit(context: { supabase: any; userId: string }, action: string, id: string | null, label: string) {
  await context.supabase.from("admin_audit_logs").insert({
    admin_id: context.userId,
    action,
    content_type: "notification",
    content_id: id,
    content_label: label,
  });
}

/* --------------------------------- member -------------------------------- */

export const getMyInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ limit: z.number().int().min(5).max(100).default(30) }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const [{ data: rows, error }, { count: unread }, { data: activities }] = await Promise.all([
      supabase
        .from("notification_recipients")
        .select(`id,read_at,created_at,message:notification_messages!inner(${messageColumns})`)
        .eq("user_id", userId)
        .eq("message.status", "published")
        .order("created_at", { ascending: false })
        .limit(data.limit),
      supabase
        .from("notification_recipients")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null),
      supabase
        .from("member_activities")
        .select("id,kind,title,description,section,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(data.limit),
    ]);
    if (error) throw new Error(error.message);

    type Row = {
      id: string;
      read_at: string | null;
      created_at: string;
      message: {
        id: string;
        title: string;
        body: string | null;
        category: NotificationCategory;
        link_path: string | null;
      };
    };

    return {
      notifications: ((rows ?? []) as unknown as Row[]).map((row) => ({
        id: row.id,
        title: row.message.title,
        body: row.message.body,
        category: row.message.category,
        linkPath: row.message.link_path,
        readAt: row.read_at,
        createdAt: row.created_at,
      })),
      unreadCount: unread ?? 0,
      activities: (activities ?? []) as {
        id: string;
        kind: string;
        title: string;
        description: string | null;
        section: string | null;
        created_at: string;
      }[],
    };
  });

export const markNotificationAsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notification_recipients")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .is("read_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notification_recipients")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .is("read_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------------- admin --------------------------------- */

export const listNotificationMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as never);
    const { data: messages, error } = await context.supabase
      .from("notification_messages")
      .select(messageColumns)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    type MessageRow = {
      id: string;
      title: string;
      body: string | null;
      category: NotificationCategory;
      link_path: string | null;
      status: "draft" | "published";
      audience: string;
      published_at: string | null;
      created_at: string;
    };
    const rows = (messages ?? []) as MessageRow[];
    const ids = rows.map((row) => row.id);
    const { data: recipients } = ids.length
      ? await context.supabase.from("notification_recipients").select("message_id,read_at").in("message_id", ids)
      : { data: [] as { message_id: string; read_at: string | null }[] };

    const stats = (recipients ?? []) as { message_id: string; read_at: string | null }[];
    return {
      messages: rows.map((row) => {
        const mine = stats.filter((item) => item.message_id === row.id);
        return { ...row, recipients: mine.length, read: mine.filter((item) => item.read_at).length };
      }),
    };
  });

export const listNotificationMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ search: z.string().trim().max(120).default("") }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    let query = context.supabase
      .from("profiles")
      .select("id,full_name,email,is_active")
      .order("full_name", { ascending: true })
      .limit(50);
    if (data.search) {
      const term = `%${data.search.replaceAll("%", "")}%`;
      query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
    }
    const { data: members, error } = await query;
    if (error) throw new Error(error.message);
    return { members: (members ?? []) as { id: string; full_name: string; email: string; is_active: boolean }[] };
  });

const saveInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().max(2000).default(""),
  category: z.enum(notificationCategories).default("announcement"),
  linkPath: z.string().trim().max(200).default(""),
});

export const saveNotificationDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => saveInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    if (data.linkPath && !data.linkPath.startsWith("/")) {
      throw new Error("The link must be a page on this website and start with /");
    }
    const record = {
      title: data.title,
      body: data.body || null,
      category: data.category,
      link_path: data.linkPath || null,
    };

    if (data.id) {
      const { data: existing } = await context.supabase
        .from("notification_messages")
        .select("status")
        .eq("id", data.id)
        .maybeSingle();
      if (!existing) throw new Error("This notification no longer exists.");
      const { error } = await context.supabase.from("notification_messages").update(record).eq("id", data.id);
      if (error) throw new Error(error.message);
      await audit(context as never, "notification_updated", data.id, data.title);
      return { id: data.id };
    }

    const { data: created, error } = await context.supabase
      .from("notification_messages")
      .insert({ ...record, status: "draft", audience: "selected", created_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await audit(context as never, "notification_created", created.id, data.title);
    return { id: created.id as string };
  });

export const publishNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        id: z.string().uuid(),
        audience: z.enum(["all", "active", "selected"]).default("active"),
        memberIds: z.array(z.string().uuid()).max(500).default([]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const { data: message, error: loadError } = await context.supabase
      .from("notification_messages")
      .select("id,title,status")
      .eq("id", data.id)
      .maybeSingle();
    if (loadError) throw new Error(loadError.message);
    if (!message) throw new Error("This notification no longer exists.");
    if (message.status === "published") throw new Error("This notification was already published.");

    let targets: string[] = data.memberIds;
    if (data.audience !== "selected") {
      let query = context.supabase.from("profiles").select("id");
      if (data.audience === "active") query = query.eq("is_active", true);
      const { data: rows, error } = await query;
      if (error) throw new Error(error.message);
      targets = ((rows ?? []) as { id: string }[]).map((row) => row.id);
    }
    if (targets.length === 0) throw new Error("Choose at least one member to receive this notification.");

    const { error: insertError } = await context.supabase
      .from("notification_recipients")
      .upsert(targets.map((id) => ({ message_id: data.id, user_id: id })), { onConflict: "message_id,user_id" });
    if (insertError) throw new Error(insertError.message);

    const { error: publishError } = await context.supabase
      .from("notification_messages")
      .update({ status: "published", audience: data.audience, published_at: new Date().toISOString() })
      .eq("id", data.id);
    if (publishError) throw new Error(publishError.message);

    await audit(context as never, "notification_published", data.id, message.title);
    await audit(context as never, `notification_sent to ${targets.length} member(s)`, data.id, message.title);
    return { sent: targets.length };
  });

export const deleteNotificationDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const { data: message } = await context.supabase
      .from("notification_messages")
      .select("title,status")
      .eq("id", data.id)
      .maybeSingle();
    if (!message) throw new Error("This notification no longer exists.");
    if (message.status === "published") {
      const { error: recipientError } = await context.supabase.from("notification_recipients").delete().eq("message_id", data.id);
      if (recipientError) throw new Error(recipientError.message);
    }
    const { error } = await context.supabase.from("notification_messages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(context as never, "notification_deleted", null, `deleted ${message.status} notification: ${message.title}`);
    return { ok: true };
  });
