import { requireModule } from "@/lib/admin-access";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { applyTranslations } from "@/lib/public-content.server";

export const umrahStatuses = [
  "draft",
  "submitted",
  "under_review",
  "documents_required",
  "approved",
  "processing",
  "completed",
  "rejected",
  "cancelled",
] as const;
export type UmrahStatus = (typeof umrahStatuses)[number];

export const umrahDocumentTypes = ["passport", "id_card_front", "id_card_back"] as const;
export type UmrahDocumentType = (typeof umrahDocumentTypes)[number];

export const umrahDocumentLabels: Record<string, string> = {
  passport: "Passport",
  id_card_front: "ID Card — Front",
  id_card_back: "ID Card — Back",
  // Legacy categories kept only so older uploads still display a readable name.
  identification: "ID Card — Front",
  photograph: "Previously uploaded document",
  other: "Previously uploaded document",
};

export const UMRAH_IDENTITY_ERROR =
  "Please upload either your Passport, or both the front and back of your ID Card.";

/** Identity requirement: passport alone, or both sides of an ID card. */
export function hasUmrahIdentityDocuments(types: Iterable<string>): boolean {
  const present = new Set(types);
  if (present.has("passport")) return true;
  return (present.has("id_card_front") || present.has("identification")) && present.has("id_card_back");
}

export const UMRAH_MAX_BYTES = 10 * 1024 * 1024;

export const umrahAcceptedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const umrahAcceptedExtensions = ["pdf", "jpg", "jpeg", "png", "webp", "gif"] as const;

export function umrahFileExtension(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() as string) : "";
}

/** Columns a member is allowed to read — internal_note is deliberately excluded. */
const memberColumns =
  "id,user_id,application_number,status,full_name,date_of_birth,phone,email,nationality,country_of_residence,state_region,city,passport_number,passport_issue_date,passport_expiry_date,passport_issuing_country,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship,preferred_travel_period,travel_notes,member_notes,admin_message,submitted_at,created_at,updated_at";

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");
const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .or(z.literal(""))
  .default("");

const applicationInput = z.object({
  fullName: z.string().trim().min(2).max(120),
  dateOfBirth: optionalDate,
  phone: optionalText(40),
  email: z.string().trim().max(160).email().or(z.literal("")).default(""),
  nationality: optionalText(80),
  countryOfResidence: optionalText(80),
  stateRegion: optionalText(120),
  city: optionalText(80),
  passportNumber: optionalText(40),
  passportIssueDate: optionalDate,
  passportExpiryDate: optionalDate,
  passportIssuingCountry: optionalText(80),
  emergencyContactName: optionalText(120),
  emergencyContactPhone: optionalText(40),
  emergencyContactRelationship: optionalText(80),
  preferredTravelPeriod: optionalText(120),
  travelNotes: optionalText(1000),
  memberNotes: optionalText(1000),
});

function toRow(data: z.infer<typeof applicationInput>) {
  const nullable = (value: string) => (value ? value : null);
  return {
    full_name: data.fullName,
    date_of_birth: nullable(data.dateOfBirth ?? ""),
    phone: nullable(data.phone),
    email: nullable(data.email),
    nationality: nullable(data.nationality),
    country_of_residence: nullable(data.countryOfResidence),
    state_region: nullable(data.stateRegion),
    city: nullable(data.city),
    passport_number: nullable(data.passportNumber),
    passport_issue_date: nullable(data.passportIssueDate ?? ""),
    passport_expiry_date: nullable(data.passportExpiryDate ?? ""),
    passport_issuing_country: nullable(data.passportIssuingCountry),
    emergency_contact_name: nullable(data.emergencyContactName),
    emergency_contact_phone: nullable(data.emergencyContactPhone),
    emergency_contact_relationship: nullable(data.emergencyContactRelationship),
    preferred_travel_period: nullable(data.preferredTravelPeriod),
    travel_notes: nullable(data.travelNotes),
    member_notes: nullable(data.memberNotes),
  };
}

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_platform_admin", { _user_id: context.userId });
  if (error || !data) throw new Error("Administrator access is required.");
  await requireModule(context as never, "umrah");
}

// Member notifications for submissions, status changes and administrator messages
// are created automatically by the database, so every path is covered exactly once.

/* ------------------------------ member side ------------------------------ */

export const getMyUmrahApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: application } = await context.supabase
      .from("umrah_applications")
      .select(memberColumns)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!application) return { application: null, documents: [], history: [] };

    const [{ data: documents }, { data: history }] = await Promise.all([
      context.supabase
        .from("umrah_documents")
        .select("id,document_type,original_name,mime_type,byte_size,review_status,review_note,created_at")
        .eq("application_id", (application as { id: string }).id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("umrah_application_history")
        .select("id,action,from_status,to_status,note,created_at,actor_role")
        .eq("application_id", (application as { id: string }).id)
        .eq("member_visible", true)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return { application, documents: documents ?? [], history: history ?? [] };
  });

export const saveMyUmrahApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => applicationInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("umrah_applications")
      .select("id,status")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!existing) {
      const { data: created, error } = await context.supabase
        .from("umrah_applications")
        .insert({ user_id: context.userId, status: "draft", ...toRow(data) })
        .select(memberColumns)
        .single();
      if (error) throw new Error(error.message);
      if (!created || created.user_id !== context.userId) {
        throw new Error("The saved application could not be verified for this account.");
      }
      await context.supabase.from("umrah_application_history").insert({
        application_id: created.id,
        actor_id: context.userId,
        actor_role: "member",
        action: "Application draft created",
        to_status: "draft",
      });
      return { application: created, created: true };
    }

    const editable: UmrahStatus[] = ["draft", "documents_required"];
    if (!editable.includes(existing.status as UmrahStatus)) {
      throw new Error("This application can no longer be edited. Please contact the platform for changes.");
    }

    const { data: updated, error } = await context.supabase
      .from("umrah_applications")
      .update(toRow(data))
      .eq("id", existing.id)
      .eq("user_id", context.userId)
      .select(memberColumns)
      .single();
    if (error) throw new Error(error.message);
    if (!updated || updated.user_id !== context.userId) {
      throw new Error("The saved application could not be verified for this account.");
    }
    return { application: updated, created: false };
  });

export const submitMyUmrahApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existing } = await context.supabase
      .from("umrah_applications")
      .select("id,status,full_name,application_number")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!existing) throw new Error("Start your application before submitting it.");

    const submittable: UmrahStatus[] = ["draft", "documents_required"];
    if (!submittable.includes(existing.status as UmrahStatus)) {
      throw new Error("This application has already been submitted.");
    }
    if (!existing.full_name || existing.full_name.trim().length < 2) {
      throw new Error("Please complete your details before submitting.");
    }

    const { data: uploaded } = await context.supabase
      .from("umrah_documents")
      .select("document_type")
      .eq("application_id", existing.id);
    const present = new Set((uploaded ?? []).map((row: { document_type: string }) => row.document_type));
    if (!hasUmrahIdentityDocuments(present)) {
      throw new Error(UMRAH_IDENTITY_ERROR);
    }

    const { error } = await context.supabase
      .from("umrah_applications")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);

    await context.supabase.from("umrah_application_history").insert({
      application_id: existing.id,
      actor_id: context.userId,
      actor_role: "member",
      action: "Application submitted",
      from_status: existing.status,
      to_status: "submitted",
    });

    // The submission notification is created automatically by the database.

    return { ok: true };
  });

export const registerUmrahDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        applicationId: z.string().uuid(),
        documentType: z.enum(umrahDocumentTypes),
        storagePath: z.string().trim().min(3).max(400),
        originalName: z.string().trim().min(1).max(200),
        mimeType: z.string().trim().min(3).max(120),
        byteSize: z.number().int().min(1).max(UMRAH_MAX_BYTES),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!data.storagePath.startsWith(`${context.userId}/`)) throw new Error("Invalid document location.");
    if (!(umrahAcceptedMimeTypes as readonly string[]).includes(data.mimeType)) {
      throw new Error("Only PDF, JPG, JPEG, PNG, WEBP and GIF files are accepted.");
    }
    if (!(umrahAcceptedExtensions as readonly string[]).includes(umrahFileExtension(data.originalName))) {
      throw new Error("Only PDF, JPG, JPEG, PNG, WEBP and GIF files are accepted.");
    }

    const { data: application } = await context.supabase
      .from("umrah_applications")
      .select("id,user_id,status")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (!application || application.user_id !== context.userId) throw new Error("Application not found.");
    const editable: UmrahStatus[] = ["draft", "documents_required"];
    if (!editable.includes(application.status as UmrahStatus)) {
      throw new Error("Your application is being reviewed, so documents can no longer be changed.");
    }

    const { error } = await context.supabase.from("umrah_documents").insert({
      application_id: data.applicationId,
      user_id: context.userId,
      document_type: data.documentType,
      storage_path: data.storagePath,
      original_name: data.originalName,
      mime_type: data.mimeType,
      byte_size: data.byteSize,
    });
    if (error) throw new Error(error.message);
    await context.supabase.from("umrah_application_history").insert({
      application_id: data.applicationId,
      actor_id: context.userId,
      actor_role: "member",
      action: `Document uploaded (${umrahDocumentLabels[data.documentType]})`,
    });
    return { ok: true };
  });

export const deleteUmrahDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("umrah_documents")
      .select("id,storage_path,user_id,review_status,application_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!row || row.user_id !== context.userId) throw new Error("Document not found.");
    if (row.review_status !== "pending") throw new Error("Reviewed documents cannot be removed.");

    const { data: application } = await context.supabase
      .from("umrah_applications")
      .select("status")
      .eq("id", row.application_id)
      .maybeSingle();
    const editable: UmrahStatus[] = ["draft", "documents_required"];
    if (!application || !editable.includes(application.status as UmrahStatus)) {
      throw new Error("Your application is being reviewed, so documents can no longer be removed.");
    }

    const { error } = await context.supabase.from("umrah_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.storage.from("member-documents").remove([row.storage_path]);
    return { ok: true };
  });

/** Short-lived signed link, for the owner or an administrator only. */
export const getUmrahDocumentLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("umrah_documents")
      .select("id,storage_path,user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Document not found.");

    if (row.user_id !== context.userId) await requireAdmin(context as never);

    const { data: signed, error } = await context.supabase.storage
      .from("member-documents")
      .createSignedUrl(row.storage_path, 60);
    if (error || !signed) throw new Error(error?.message ?? "The document link could not be created.");
    return { url: signed.signedUrl as string };
  });

/** Admin-only short-lived download link. Verifies the document belongs to the given application. */
export const downloadUmrahDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z.object({ id: z.string().uuid(), applicationId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);

    const { data: row } = await context.supabase
      .from("umrah_documents")
      .select("id,storage_path,original_name,application_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Document not found.");
    if (row.application_id !== data.applicationId) {
      throw new Error("This document does not belong to the selected application.");
    }

    const fileName =
      String(row.original_name ?? "").replace(/[\\/:*?"<>|\r\n]+/g, "_").trim() ||
      `umrah-document-${row.id}.pdf`;

    const { data: signed, error } = await context.supabase.storage
      .from("member-documents")
      .createSignedUrl(row.storage_path, 60, { download: fileName });
    if (error || !signed) throw new Error(error?.message ?? "The download link could not be created.");
    return { url: signed.signedUrl as string };
  });

/* ------------------------------- admin side ------------------------------ */

export const listUmrahApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        search: z.string().trim().max(120).default(""),
        status: z.enum(["all", ...umrahStatuses]).default("all"),
        page: z.number().int().min(0).max(1000).default(0),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const pageSize = 15;
    let query = context.supabase
      .from("umrah_applications")
      .select("id,application_number,full_name,email,phone,status,submitted_at,created_at,updated_at", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(data.page * pageSize, data.page * pageSize + pageSize - 1);

    if (data.search) {
      const term = `%${data.search.replaceAll("%", "")}%`;
      query = query.or(`application_number.ilike.${term},full_name.ilike.${term},email.ilike.${term}`);
    }
    if (data.status !== "all") query = query.eq("status", data.status);

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    return { applications: rows ?? [], total: count ?? 0, page: data.page, pageSize };
  });

export const getUmrahApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const { data: application, error } = await context.supabase
      .from("umrah_applications")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const [{ data: documents }, { data: history }, { data: profile }] = await Promise.all([
      context.supabase
        .from("umrah_documents")
        .select("id,document_type,original_name,mime_type,byte_size,review_status,review_note,created_at")
        .eq("application_id", data.id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("umrah_application_history")
        .select("id,action,from_status,to_status,note,member_visible,actor_role,created_at")
        .eq("application_id", data.id)
        .order("created_at", { ascending: false })
        .limit(100),
      context.supabase
        .from("profiles")
        .select("id,full_name,email,phone,country,city,is_active,created_at")
        .eq("id", application.user_id)
        .maybeSingle(),
    ]);

    return { application, documents: documents ?? [], history: history ?? [], profile: profile ?? null };
  });

export const updateUmrahApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(umrahStatuses),
        memberMessage: z.string().trim().max(1000).default(""),
        internalNote: z.string().trim().max(2000).default(""),
        notifyMember: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const { data: existing, error: loadError } = await context.supabase
      .from("umrah_applications")
      .select("id,user_id,status,application_number")
      .eq("id", data.id)
      .single();
    if (loadError) throw new Error(loadError.message);

    const { error } = await context.supabase
      .from("umrah_applications")
      .update({
        status: data.status,
        admin_message: data.memberMessage || null,
        internal_note: data.internalNote || null,
        reviewed_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    const statusChanged = existing.status !== data.status;
    await context.supabase.from("umrah_application_history").insert({
      application_id: data.id,
      actor_id: context.userId,
      actor_role: "admin",
      action: statusChanged ? `Status changed to ${data.status.replaceAll("_", " ")}` : "Application reviewed",
      from_status: existing.status,
      to_status: data.status,
      member_visible: true,
      note: data.memberMessage || null,
    });

    if (data.internalNote) {
      await context.supabase.from("umrah_application_history").insert({
        application_id: data.id,
        actor_id: context.userId,
        actor_role: "admin",
        action: "Internal note recorded",
        member_visible: false,
        note: data.internalNote,
      });
    }

    // Status changes and member messages notify the applicant automatically.

    await context.supabase.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: statusChanged ? `umrah application set to ${data.status}` : "umrah application reviewed",
      content_type: "umrah_application",
      content_id: data.id,
      content_label: existing.application_number,
    });

    return { ok: true };
  });

export const reviewUmrahDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        id: z.string().uuid(),
        reviewStatus: z.enum(["pending", "accepted", "rejected"]),
        reviewNote: z.string().trim().max(500).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const { data: row, error } = await context.supabase
      .from("umrah_documents")
      .update({ review_status: data.reviewStatus, review_note: data.reviewNote || null })
      .eq("id", data.id)
      .select("application_id,document_type")
      .single();
    if (error) throw new Error(error.message);

    await context.supabase.from("umrah_application_history").insert({
      application_id: row.application_id,
      actor_id: context.userId,
      actor_role: "admin",
      action: `Document ${data.reviewStatus} (${row.document_type})`,
      member_visible: true,
      note: data.reviewNote || null,
    });
    return { ok: true };
  });

/* -------------------------------- partners ------------------------------- */

const partnerInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  country: z.string().trim().max(80).default(""),
  stateRegion: z.string().trim().max(120).default(""),
  city: z.string().trim().max(120).default(""),
  logoPath: z.string().trim().max(500).refine((v) => !v.includes("..") && !/^https?:/i.test(v), "Invalid logo").default(""),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
  contactEmail: z.string().trim().max(160).email().or(z.literal("")).default(""),
  contactPhone: z.string().trim().max(40).default(""),
  websiteUrl: z.string().trim().url().or(z.literal("")).default(""),
  services: z.string().trim().max(1000).default(""),
  verificationStatus: z.enum(["unverified", "pending", "verified"]).default("unverified"),
  isVisible: z.boolean().default(false),
  notes: z.string().trim().max(1000).default(""),
});

export const listUmrahPartners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as never);
    const { data, error } = await context.supabase
      .from("umrah_partners")
      .select("*")
      .order("sort_order" as never, { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { partners: data ?? [] };
  });

/** Quick status changes: verify / unverify, show / hide. */
export const setUmrahPartnerFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z.object({ id: z.string().uuid(), verificationStatus: z.enum(["unverified", "pending", "verified"]).optional(), isVisible: z.boolean().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const patch: Record<string, unknown> = {};
    if (data.verificationStatus) patch["verification_status"] = data.verificationStatus;
    if (data.isVisible !== undefined) patch["is_visible"] = data.isVisible;
    if (data.verificationStatus && data.verificationStatus !== "verified") patch["is_visible"] = false;
    const { error } = await context.supabase.from("umrah_partners").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: "changed umrah partner status",
      content_type: "umrah_partner",
      content_id: data.id,
      content_label: JSON.stringify(patch),
    });
    return { ok: true };
  });

export const saveUmrahPartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => partnerInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const row = {
      name: data.name,
      country: data.country || null,
      state_region: data.stateRegion || null,
      city: data.city || null,
      logo_path: data.logoPath || null,
      sort_order: data.sortOrder,
      contact_email: data.contactEmail || null,
      contact_phone: data.contactPhone || null,
      website_url: data.websiteUrl || null,
      services: data.services || null,
      verification_status: data.verificationStatus,
      is_visible: data.isVisible && data.verificationStatus === "verified",
      notes: data.notes || null,
    } as never;

    const { error } = data.id
      ? await context.supabase.from("umrah_partners").update(row).eq("id", data.id)
      : await context.supabase.from("umrah_partners").insert({ ...(row as object), created_by: context.userId } as never);
    if (error) throw new Error(error.message);

    await context.supabase.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: data.id ? "updated umrah partner" : "added umrah partner",
      content_type: "umrah_partner",
      ...(data.id ? { content_id: data.id } : {}),
      content_label: data.name,
    });
    return { ok: true };
  });

export const deleteUmrahPartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isSuper) throw new Error("Super Admin access is required.");
    const { error } = await context.supabase.from("umrah_partners").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: "removed umrah partner",
      content_type: "umrah_partner",
      content_id: data.id,
      content_label: data.id,
    });
    return { ok: true };
  });

/* --------------------------- public information -------------------------- */

const publicUmrahTypes = ["umrah", "umrah_step", "umrah_requirement", "umrah_faq", "umrah_notice", "umrah_information", "umrah_contact"];

export const getPublicUmrahInfo = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ language: z.enum(["en", "ha", "ar"]).default("en") }).default({ language: "en" }).parse(input ?? {}))
  .handler(async ({ data }) => {
  const client = createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );

  const [{ data: entries }, { data: partners }] = await Promise.all([
    client
      .from("content_entries")
      .select("id,content_type,slug,title,summary,body,sort_order")
      .in("content_type", publicUmrahTypes)
      .eq("status", "published")
      .eq("is_enabled", true)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .limit(60),
    client
      .from("umrah_partners")
      .select("id,name,country,website_url,services")
      .eq("verification_status", "verified")
      .eq("is_visible", true)
      .order("name", { ascending: true })
      .limit(20),
  ]);

  return { entries: await applyTranslations(client as never, entries ?? [], data.language), partners: partners ?? [] };
});
