import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export const foundationStatuses = ["planned", "active", "completed", "archived"] as const;
export type FoundationStatus = (typeof foundationStatuses)[number];

export const foundationStatusLabels: Record<FoundationStatus, string> = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

export const foundationCategories = [
  "community_support",
  "education",
  "health",
  "youth_empowerment",
  "relief",
  "technology_access",
] as const;

export const foundationCategoryLabels: Record<string, string> = {
  community_support: "Community support",
  education: "Education",
  health: "Health",
  youth_empowerment: "Youth empowerment",
  relief: "Relief",
  technology_access: "Technology access",
};

export const FOUNDATION_MEDIA_BUCKET = "foundation-media";
export const FOUNDATION_MAX_BYTES = 10 * 1024 * 1024;
export const foundationAcceptedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

const projectColumns =
  "id,slug,title,summary,description,category,location,image_path,media,start_date,end_date,status,is_published,published_at,sort_order,created_at,updated_at";

export type FoundationMediaItem = { path: string; caption: string };
export type SignedMedia = { path: string; caption: string; url: string | null };

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

function toMediaList(value: unknown): FoundationMediaItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({ path: String(item["path"] ?? ""), caption: String(item["caption"] ?? "") }))
    .filter((item) => item.path.length > 0);
}

/** Short-lived links for images stored in the private foundation media bucket. */
async function signPaths(paths: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return {};
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage.from(FOUNDATION_MEDIA_BUCKET).createSignedUrls(unique, 60 * 60);
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

export type FoundationProject = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  category: string;
  location: string | null;
  image_path: string | null;
  start_date: string | null;
  end_date: string | null;
  status: FoundationStatus;
  is_published: boolean;
  published_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  media_items: SignedMedia[];
};

type ProjectRow = Omit<FoundationProject, "image_url" | "media_items"> & { media: unknown };

async function decorate(rows: ProjectRow[]): Promise<FoundationProject[]> {
  const paths = rows.flatMap((row) => [row.image_path ?? "", ...toMediaList(row.media).map((item) => item.path)]);
  const signed = await signPaths(paths);
  return rows.map(({ media, ...row }) => ({
    ...row,
    image_url: row.image_path ? (signed[row.image_path] ?? null) : null,
    media_items: toMediaList(media).map((item) => ({ ...item, url: signed[item.path] ?? null })),
  }));
}

/* --------------------------------- public -------------------------------- */

export const getFoundationOverview = createServerFn({ method: "GET" }).handler(async () => {
  const client = publicClient();
  const [{ data: entries }, { data: projects }] = await Promise.all([
    client
      .from("content_entries")
      .select("id,content_type,slug,title,summary,body,sort_order")
      .in("content_type", [
        "foundation",
        "foundation_mission",
        "foundation_vision",
        "foundation_what_we_do",
        "foundation_initiative",
      ])
      .order("sort_order", { ascending: true }),
    client.from("foundation_projects").select(projectColumns).order("sort_order", { ascending: true }).limit(60),
  ]);

  const rows = (projects ?? []) as unknown as ProjectRow[];
  const decorated = await decorate(rows);

  const ids = decorated.map((project) => project.id);
  const { data: updates } = ids.length
    ? await client
        .from("foundation_project_updates")
        .select("id,project_id,title,body,published_at,created_at")
        .in("project_id", ids)
        .order("created_at", { ascending: false })
        .limit(12)
    : { data: [] };

  return { content: entries ?? [], projects: decorated, updates: updates ?? [] };
});

export const getFoundationProject = createServerFn({ method: "GET" })
  .validator((input) => z.object({ slug: z.string().trim().min(1).max(160) }).parse(input))
  .handler(async ({ data }) => {
    const client = publicClient();
    const { data: project } = await client.from("foundation_projects").select(projectColumns).eq("slug", data.slug).maybeSingle();
    if (!project) return { project: null, updates: [] };
    const [decorated] = await decorate([project as unknown as ProjectRow]);
    const { data: updates } = await client
      .from("foundation_project_updates")
      .select("id,title,body,published_at,created_at")
      .eq("project_id", (project as { id: string }).id)
      .order("created_at", { ascending: false });
    return { project: decorated ?? null, updates: updates ?? [] };
  });

/* --------------------------------- member -------------------------------- */

/** Members see exactly the published catalogue — no administrative fields. */
export const getMemberFoundation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: projects } = await context.supabase
      .from("foundation_projects")
      .select(projectColumns)
      .eq("is_published", true)
      .neq("status", "archived")
      .order("sort_order", { ascending: true })
      .limit(60);
    const rows = (projects ?? []) as unknown as ProjectRow[];
    const decorated = await decorate(rows);
    const ids = decorated.map((project) => project.id);
    const { data: updates } = ids.length
      ? await context.supabase
          .from("foundation_project_updates")
          .select("id,project_id,title,body,created_at")
          .in("project_id", ids)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: [] };
    return { projects: decorated, updates: updates ?? [] };
  });

/* --------------------------------- admin --------------------------------- */

async function requireFoundationAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_content_admin", { _user_id: context.userId });
  if (error || !data) throw new Error("Administrator access is required.");
}

const projectInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(1000).default(""),
  description: z.string().trim().max(20000).default(""),
  category: z.string().trim().min(1).max(80),
  location: z.string().trim().max(160).default(""),
  imagePath: z.string().trim().max(500).default(""),
  media: z
    .array(z.object({ path: z.string().trim().min(1).max(500), caption: z.string().trim().max(200).default("") }))
    .max(12)
    .default([]),
  startDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal(""))
    .default(""),
  endDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal(""))
    .default(""),
  status: z.enum(foundationStatuses),
  isPublished: z.boolean(),
  sortOrder: z.number().int().min(-100000).max(100000).default(0),
});

export const listFoundationProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        search: z.string().trim().max(120).default(""),
        status: z.enum(["all", ...foundationStatuses]).default("all"),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireFoundationAdmin(context as never);
    let query = context.supabase
      .from("foundation_projects")
      .select(projectColumns)
      .order("updated_at", { ascending: false })
      .limit(200);
    if (data.search) {
      const term = `%${data.search.replaceAll("%", "")}%`;
      query = query.or(`title.ilike.${term},slug.ilike.${term},location.ilike.${term}`);
    }
    if (data.status !== "all") query = query.eq("status", data.status);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const decorated = await decorate((rows ?? []) as unknown as ProjectRow[]);
    return { projects: decorated };
  });

export const saveFoundationProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => projectInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireFoundationAdmin(context as never);
    const record = {
      slug: data.slug,
      title: data.title,
      summary: data.summary || null,
      description: data.description || null,
      category: data.category,
      location: data.location || null,
      image_path: data.imagePath || null,
      media: data.media,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      status: data.status,
      is_published: data.isPublished && data.status !== "archived",
      published_at: data.isPublished && data.status !== "archived" ? new Date().toISOString() : null,
      sort_order: data.sortOrder,
      updated_by: context.userId,
    };
    const query = data.id
      ? context.supabase.from("foundation_projects").update(record).eq("id", data.id)
      : context.supabase.from("foundation_projects").insert({ ...record, created_by: context.userId });
    const { data: saved, error } = await query.select(projectColumns).single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const setFoundationProjectState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(foundationStatuses).optional(),
        isPublished: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireFoundationAdmin(context as never);
    const patch: {
      updated_by: string;
      status?: FoundationStatus;
      is_published?: boolean;
      published_at?: string | null;
    } = { updated_by: context.userId };
    if (data.status) {
      patch["status"] = data.status;
      if (data.status === "archived") {
        patch["is_published"] = false;
        patch["published_at"] = null;
      }
    }
    if (typeof data.isPublished === "boolean" && data.status !== "archived") {
      patch["is_published"] = data.isPublished;
      patch["published_at"] = data.isPublished ? new Date().toISOString() : null;
    }
    const { error } = await context.supabase.from("foundation_projects").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listFoundationUpdates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireFoundationAdmin(context as never);
    const { data: rows, error } = await context.supabase
      .from("foundation_project_updates")
      .select("id,project_id,title,body,image_path,is_published,published_at,created_at")
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { updates: rows ?? [] };
  });

export const saveFoundationUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        projectId: z.string().uuid(),
        title: z.string().trim().min(2).max(200),
        body: z.string().trim().max(5000).default(""),
        isPublished: z.boolean().default(false),
        notifyMembers: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireFoundationAdmin(context as never);
    const record = {
      project_id: data.projectId,
      title: data.title,
      body: data.body || null,
      is_published: data.isPublished,
      published_at: data.isPublished ? new Date().toISOString() : null,
    };
    const query = data.id
      ? context.supabase.from("foundation_project_updates").update(record).eq("id", data.id)
      : context.supabase.from("foundation_project_updates").insert({ ...record, created_by: context.userId });
    const { data: saved, error } = await query.select("id,title").single();
    if (error) throw new Error(error.message);

    await context.supabase.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: data.id ? "project update edited" : "project update created",
      content_type: "foundation_update",
      content_id: saved.id,
      content_label: saved.title,
    });

    let notified = 0;
    if (data.notifyMembers && data.isPublished) {
      const { data: members } = await context.supabase.from("profiles").select("id").eq("is_active", true);
      const targets = (members ?? []) as { id: string }[];
      if (targets.length) {
        const { data: message, error: messageError } = await context.supabase
          .from("notification_messages")
          .insert({
            title: `BK Foundations update: ${data.title}`,
            body: data.body || null,
            category: "foundation",
            link_path: "/foundation",
            status: "published",
            audience: "active",
            created_by: context.userId,
            published_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (messageError) throw new Error(messageError.message);

        await context.supabase
          .from("notification_recipients")
          .upsert(targets.map((member) => ({ message_id: message.id, user_id: member.id })), { onConflict: "message_id,user_id" });
        notified = targets.length;

        await context.supabase.from("admin_audit_logs").insert({
          admin_id: context.userId,
          action: `notification_sent to ${notified} member(s) about a foundation update`,
          content_type: "foundation_update",
          content_id: saved.id,
          content_label: saved.title,
        });
      }
    }
    return { ok: true, notified };
  });

export const deleteFoundationUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireFoundationAdmin(context as never);
    const { error } = await context.supabase.from("foundation_project_updates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: "project update deleted",
      content_type: "foundation_update",
      content_id: data.id,
    });
    return { ok: true };
  });
