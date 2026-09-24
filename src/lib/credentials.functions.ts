import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { createPublicSupabase, mediaUrl, signSiteMedia } from "@/lib/public-content.server";

export type PublicCredential = {
  id: string;
  title: string;
  companyName: string;
  organization: string;
  number: string;
  documentType: string;
  issueDate: string;
  expiryDate: string;
  description: string;
  verificationUrl: string;
  documentUrl: string | null;
  documentMime: string;
};

const credentialInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  companyName: z.string().trim().min(1).max(200),
  organization: z.string().trim().min(1).max(200),
  number: z.string().trim().max(120),
  documentType: z.string().trim().min(1).max(120),
  issueDate: z.string().trim().max(20),
  expiryDate: z.string().trim().max(20),
  description: z.string().trim().max(2000),
  verificationUrl: z.union([z.literal(""), z.string().trim().url().max(500)]),
  documentPath: z.string().trim().max(500),
  documentMime: z.enum(["", "application/pdf", "image/jpeg", "image/png", "image/webp"]),
  status: z.enum(["draft", "published", "unpublished", "archived"]),
  isEnabled: z.boolean(),
  sortOrder: z.number().int().min(-100000).max(100000),
  scheduledFor: z.union([z.literal(""), z.null(), z.string().datetime()]).optional().transform((value) => value || undefined),
});

async function requireContentAdmin(context: { supabase: { rpc: (fn: "is_content_admin", args: { _user_id: string }) => PromiseLike<{ data: unknown; error: unknown }> }; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_content_admin", { _user_id: context.userId });
  if (error || !data) throw new Error("Content administrator access is required.");
}

const payloadValue = (payload: Json | null, key: string) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "";
  const value = payload[key];
  return typeof value === "string" ? value : "";
};

export const listPublicCredentials = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await createPublicSupabase()
      .from("content_entries")
      .select("id,title,summary,payload,sort_order")
      .eq("content_type", "business")
      .eq("category", "company_credential")
      .order("sort_order", { ascending: true });
    const rows = data ?? [];
    const paths = rows.map((row) => payloadValue(row.payload, "documentPath"));
    const signed = await signSiteMedia(paths);
    return rows.map((row): PublicCredential => ({
      id: row.id,
      title: row.title,
      companyName: payloadValue(row.payload, "companyName") || "BANGISKEBBI GLOBAL LTD",
      organization: payloadValue(row.payload, "organization"),
      number: payloadValue(row.payload, "number"),
      documentType: payloadValue(row.payload, "documentType"),
      issueDate: payloadValue(row.payload, "issueDate"),
      expiryDate: payloadValue(row.payload, "expiryDate"),
      description: row.summary ?? "",
      verificationUrl: payloadValue(row.payload, "verificationUrl"),
      documentUrl: mediaUrl(payloadValue(row.payload, "documentPath"), signed),
      documentMime: payloadValue(row.payload, "documentMime"),
    }));
  } catch {
    return [];
  }
});

export const saveCredential = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => credentialInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireContentAdmin(context);
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 140) || `credential-${Date.now()}`;
    const record = {
      content_type: "business",
      slug,
      title: data.title,
      summary: data.description || null,
      category: "company_credential",
      payload: {
        organization: data.organization,
        companyName: data.companyName,
        number: data.number,
        documentType: data.documentType,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        verificationUrl: data.verificationUrl,
        documentPath: data.documentPath,
        documentMime: data.documentMime,
      } as Json,
      status: data.status,
      is_enabled: data.isEnabled,
      sort_order: data.sortOrder,
      scheduled_for: data.scheduledFor || null,
      published_at: data.status === "published" ? new Date().toISOString() : null,
      deleted_at: data.status === "archived" ? new Date().toISOString() : null,
      updated_by: context.userId,
    };
    const query = data.id
      ? context.supabase.from("content_entries").update(record).eq("id", data.id)
      : context.supabase.from("content_entries").insert(record);
    const { data: saved, error } = await query.select("*").single();
    if (error) throw new Error(error.message);
    return saved;
  });