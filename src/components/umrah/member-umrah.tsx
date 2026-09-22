import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  Image as ImageIcon,
  Info,
  Loader2,
  RefreshCw,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteUmrahDocument,
  getMyUmrahApplication,
  getUmrahDocumentLink,
  registerUmrahDocument,
  requiredUmrahDocumentTypes,
  saveMyUmrahApplication,
  submitMyUmrahApplication,
  UMRAH_MAX_BYTES,
  umrahAcceptedExtensions,
  umrahAcceptedMimeTypes,
  umrahDocumentLabels,
  umrahDocumentTypes,
  umrahFileExtension,
  type UmrahDocumentType,
} from "@/lib/umrah.functions";

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  documents_required: "Documents required",
  approved: "Approved",
  processing: "Processing",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const editableStatuses = ["draft", "documents_required"];

export function MemberUmrahPanel({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const load = useServerFn(getMyUmrahApplication);
  const save = useServerFn(saveMyUmrahApplication);
  const submit = useServerFn(submitMyUmrahApplication);
  const registerDoc = useServerFn(registerUmrahDocument);
  const removeDoc = useServerFn(deleteUmrahDocument);
  const documentLink = useServerFn(getUmrahDocumentLink);

  const query = useQuery({ queryKey: ["umrah-application"], queryFn: () => load() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["umrah-application"] });


  const wasNewRef = useRef(false);

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, string>) => save({ data: values as never }),
    onSuccess: async () => {
      const created = wasNewRef.current;
      toast.success(created ? "Application saved. You can now upload your documents." : "Your application has been saved.");
      await refresh();
      if (created) {
        window.setTimeout(() => {
          document.getElementById("umrah-documents")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submitMutation = useMutation({
    mutationFn: () => submit({}),
    onSuccess: () => {
      toast.success("Application submitted. You will be notified about any change.");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (query.isPending) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (query.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Umrah Support</CardTitle>
          <CardDescription>{query.error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => query.refetch()}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  const application = query.data.application as Record<string, string | null> | null;
  const documents = query.data.documents as UmrahDoc[];
  const history = query.data.history as {
    id: string;
    action: string;
    to_status: string | null;
    note: string | null;
    created_at: string;
  }[];

  const status = (application?.["status"] as string | undefined) ?? "draft";
  const canEdit = !application || editableStatuses.includes(status);


  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Umrah Support</CardTitle>
              <CardDescription>
                An organised application and coordination process for members. This is a support service, not an investment.
              </CardDescription>
            </div>
            {application ? <StatusBadge status={status} /> : null}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <MiniFact label="How it works" value="Complete your details, upload documents, and follow your status." />
          <MiniFact label="Requirements" value="A valid passport and the documents requested by the platform." />
          <MiniFact label="Payments" value="No payment is collected through this application." />
        </CardContent>
      </Card>

      {application ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">My application</CardTitle>
            <CardDescription>
              {application["application_number"]} ·{" "}
              {application["submitted_at"]
                ? `Submitted ${new Date(application["submitted_at"] as string).toLocaleDateString()}`
                : "Not submitted yet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <MiniFact label="Current status" value={statusLabels[status] ?? status} />
            <MiniFact label="Documents" value={`${documents.length} uploaded`} />
            {application["admin_message"] ? (
              <div className="rounded-lg border border-brand-cyan/50 bg-secondary/50 p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message from the platform</p>
                <p className="mt-1 text-sm">{application["admin_message"]}</p>
              </div>
            ) : null}
            {status === "documents_required" ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
                <Info className="size-4" /> Additional documents are required. Upload them below and submit again.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <ApplicationForm
        application={application}
        canEdit={canEdit}
        saving={saveMutation.isPending}
        onSave={(values) => saveMutation.mutate(values)}
      />

      <DocumentsCard
        userId={userId}
        applicationId={(application?.["id"] as string | undefined) ?? null}
        canEdit={canEdit}
        documents={documents}
        onChanged={refresh}
      />

      {application && editableStatuses.includes(status) ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Submit your application</CardTitle>
            <CardDescription>Check your details and documents before submitting. An administrator will review it.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={submitMutation.isPending}>
                  <Send /> Submit application
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit this application?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will not be able to edit it while it is being reviewed. No payment is taken at this stage.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => submitMutation.mutate()}>Submit</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Updates</CardTitle>
          <CardDescription>Every step recorded on your application.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No updates yet.</p>
          ) : (
            <ol className="grid gap-3">
              {history.map((row) => (
                <li key={row.id} className="flex gap-3 rounded-lg border border-border p-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-cyan" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium capitalize">{row.action}</p>
                    {row.note ? <p className="text-sm text-muted-foreground">{row.note}</p> : null}
                    <time className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ApplicationForm({
  application,
  canEdit,
  saving,
  onSave,
}: {
  application: Record<string, string | null> | null;
  canEdit: boolean;
  saving: boolean;
  onSave: (values: Record<string, string>) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "");
    onSave({
      fullName: value("fullName"),
      dateOfBirth: value("dateOfBirth"),
      phone: value("phone"),
      email: value("email"),
      nationality: value("nationality"),
      countryOfResidence: value("countryOfResidence"),
      city: value("city"),
      passportNumber: value("passportNumber"),
      passportIssueDate: value("passportIssueDate"),
      passportExpiryDate: value("passportExpiryDate"),
      passportIssuingCountry: value("passportIssuingCountry"),
      emergencyContactName: value("emergencyContactName"),
      emergencyContactPhone: value("emergencyContactPhone"),
      emergencyContactRelationship: value("emergencyContactRelationship"),
      preferredTravelPeriod: value("preferredTravelPeriod"),
      travelNotes: value("travelNotes"),
      memberNotes: value("memberNotes"),
    });
  }

  const field = (key: string) => (application?.[key] as string | null) ?? "";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          <ClipboardList className="mr-2 inline size-4" />
          {application ? "Application details" : "Start your application"}
        </CardTitle>
        <CardDescription>
          {canEdit
            ? "Only the information needed for the application is collected. Your details stay private."
            : "Your application is being reviewed and can no longer be edited."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input name="fullName" defaultValue={field("full_name")} maxLength={120} required disabled={!canEdit} />
          </Field>
          <Field label="Date of birth">
            <Input name="dateOfBirth" type="date" defaultValue={field("date_of_birth")} disabled={!canEdit} />
          </Field>
          <Field label="Phone">
            <Input name="phone" type="tel" defaultValue={field("phone")} maxLength={40} disabled={!canEdit} />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={field("email")} maxLength={160} disabled={!canEdit} />
          </Field>
          <Field label="Nationality">
            <Input name="nationality" defaultValue={field("nationality")} maxLength={80} disabled={!canEdit} />
          </Field>
          <Field label="Country of residence">
            <Input name="countryOfResidence" defaultValue={field("country_of_residence")} maxLength={80} disabled={!canEdit} />
          </Field>
          <Field label="City">
            <Input name="city" defaultValue={field("city")} maxLength={80} disabled={!canEdit} />
          </Field>
          <Field label="Passport number">
            <Input name="passportNumber" defaultValue={field("passport_number")} maxLength={40} disabled={!canEdit} />
          </Field>
          <Field label="Passport issue date">
            <Input name="passportIssueDate" type="date" defaultValue={field("passport_issue_date")} disabled={!canEdit} />
          </Field>
          <Field label="Passport expiry date">
            <Input name="passportExpiryDate" type="date" defaultValue={field("passport_expiry_date")} disabled={!canEdit} />
          </Field>
          <Field label="Passport issuing country">
            <Input name="passportIssuingCountry" defaultValue={field("passport_issuing_country")} maxLength={80} disabled={!canEdit} />
          </Field>
          <Field label="Preferred travel period">
            <Input name="preferredTravelPeriod" defaultValue={field("preferred_travel_period")} maxLength={120} disabled={!canEdit} />
          </Field>
          <Field label="Emergency contact name">
            <Input name="emergencyContactName" defaultValue={field("emergency_contact_name")} maxLength={120} disabled={!canEdit} />
          </Field>
          <Field label="Emergency contact phone">
            <Input name="emergencyContactPhone" type="tel" defaultValue={field("emergency_contact_phone")} maxLength={40} disabled={!canEdit} />
          </Field>
          <Field label="Relationship">
            <Input name="emergencyContactRelationship" defaultValue={field("emergency_contact_relationship")} maxLength={80} disabled={!canEdit} />
          </Field>
          <Field label="Travel notes">
            <Input name="travelNotes" defaultValue={field("travel_notes")} maxLength={1000} disabled={!canEdit} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Additional notes">
              <Textarea name="memberNotes" defaultValue={field("member_notes")} maxLength={1000} rows={3} disabled={!canEdit} />
            </Field>
          </div>
          {canEdit ? (
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : application ? "Save changes" : "Save draft"}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium leading-none">{label}</span>
      {children}
    </label>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "approved" || status === "completed"
      ? "default"
      : status === "rejected" || status === "cancelled"
        ? "destructive"
        : "secondary";
  return (
    <Badge variant={tone as "default" | "secondary" | "destructive"}>{statusLabels[status] ?? status}</Badge>
  );
}

/* ----------------------------- documents card ---------------------------- */

export type UmrahDoc = {
  id: string;
  document_type: string;
  original_name: string;
  mime_type: string;
  byte_size: number;
  review_status: string;
  review_note: string | null;
  created_at: string;
};

const acceptAttribute = [
  ...umrahAcceptedMimeTypes,
  ...umrahAcceptedExtensions.map((extension) => `.${extension}`),
].join(",");

const acceptedLabel = "PDF, JPG, JPEG, PNG, WEBP, GIF";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentsCard({
  userId,
  applicationId,
  canEdit,
  documents,
  onChanged,
}: {
  userId: string;
  applicationId: string | null;
  canEdit: boolean;
  documents: UmrahDoc[];
  onChanged: () => void;
}) {
  const registerDoc = useServerFn(registerUmrahDocument);
  const removeDoc = useServerFn(deleteUmrahDocument);
  const documentLink = useServerFn(getUmrahDocumentLink);
  const [progress, setProgress] = useState<Record<string, number>>({});

  async function openDocument(id: string) {
    try {
      const { url } = await documentLink({ data: { id } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The document could not be opened.");
    }
  }

  async function handleFile(type: UmrahDocumentType, file: File, replaceId?: string) {
    if (!applicationId) {
      toast.error("Save your application details first.");
      return;
    }
    const extension = umrahFileExtension(file.name);
    if (
      !(umrahAcceptedExtensions as readonly string[]).includes(extension) ||
      !(umrahAcceptedMimeTypes as readonly string[]).includes(file.type)
    ) {
      toast.error(`This file type is not accepted. Accepted files: ${acceptedLabel}.`);
      return;
    }
    if (file.size > UMRAH_MAX_BYTES) {
      toast.error("File is too large. Please choose a smaller file (maximum 10MB).");
      return;
    }

    setProgress((current) => ({ ...current, [type]: 0 }));
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Your session has expired. Please sign in again.");

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
      const path = `${userId}/umrah/${applicationId}/${crypto.randomUUID()}-${safeName}`;
      const endpoint = `${import.meta.env["VITE_SUPABASE_URL"]}/storage/v1/object/member-documents/${path}`;

      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", endpoint, true);
        request.setRequestHeader("Authorization", `Bearer ${token}`);
        request.setRequestHeader("apikey", import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string);
        request.setRequestHeader("x-upsert", "false");
        request.setRequestHeader("content-type", file.type);
        request.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          setProgress((current) => ({ ...current, [type]: Math.round((event.loaded / event.total) * 100) }));
        };
        request.onload = () =>
          request.status >= 200 && request.status < 300
            ? resolve()
            : reject(new Error("The file could not be uploaded. Please try again."));
        request.onerror = () => reject(new Error("Network error while uploading. Please try again."));
        request.send(file);
      });

      setProgress((current) => ({ ...current, [type]: 100 }));
      await registerDoc({
        data: {
          applicationId,
          documentType: type,
          storagePath: path,
          originalName: file.name.slice(0, 200),
          mimeType: file.type,
          byteSize: file.size,
        },
      });
      if (replaceId) {
        await removeDoc({ data: { id: replaceId } });
      }
      toast.success(
        replaceId ? `${umrahDocumentLabels[type]} replaced successfully.` : `${umrahDocumentLabels[type]} uploaded successfully.`,
      );
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The document could not be uploaded.");
    } finally {
      setProgress((current) => {
        const next = { ...current };
        delete next[type];
        return next;
      });
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Documents</CardTitle>
        <CardDescription>
          Stored privately. Only you and authorised administrators can open them. Accepted files: {acceptedLabel} · maximum
          10MB each.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!applicationId ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Save your application details first to enable uploads.
          </p>
        ) : null}

        {umrahDocumentTypes.map((type) => {
          const forType = documents.filter((doc) => doc.document_type === type);
          const uploadProgress = progress[type];
          const required = requiredUmrahDocumentTypes.includes(type);
          return (
            <section key={type} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {umrahDocumentLabels[type]}
                    {required ? <span className="ml-2 text-xs font-medium text-destructive">Required</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {forType.length === 0 ? "Not uploaded yet" : `${forType.length} file${forType.length > 1 ? "s" : ""}`}
                  </p>
                </div>
                {applicationId && canEdit ? (
                  <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-within:ring-2 focus-within:ring-ring">
                    {uploadProgress === undefined ? <Upload className="size-4" /> : <Loader2 className="size-4 animate-spin" />}
                    {uploadProgress === undefined ? "Upload Document" : `Uploading… ${uploadProgress}%`}
                    <input
                      type="file"
                      className="sr-only"
                      accept={acceptAttribute}
                      disabled={uploadProgress !== undefined}
                      aria-label={`Upload ${umrahDocumentLabels[type]}`}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void handleFile(type, file);
                      }}
                    />
                  </label>
                ) : null}
              </div>

              {uploadProgress !== undefined ? (
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-brand-cyan transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              ) : null}

              {forType.length > 0 ? (
                <ul className="mt-3 grid gap-2">
                  {forType.map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      doc={doc}
                      canEdit={canEdit}
                      onOpen={() => openDocument(doc.id)}
                      getLink={() => documentLink({ data: { id: doc.id } })}
                      replacing={uploadProgress !== undefined}
                      onReplace={(file) => void handleFile(type, file, doc.id)}
                      onRemove={async () => {
                        try {
                          await removeDoc({ data: { id: doc.id } });
                          toast.success("Document removed.");
                          onChanged();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Removal failed.");
                        }
                      }}
                    />
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function DocumentRow({
  doc,
  canEdit,
  onOpen,
  onRemove,
  onReplace,
  replacing,
  getLink,
}: {
  doc: UmrahDoc;
  canEdit: boolean;
  onOpen: () => void;
  onRemove?: () => void;
  onReplace?: (file: File) => void;
  replacing?: boolean;
  getLink: () => Promise<{ url: string }>;
}) {
  const isImage = doc.mime_type?.startsWith("image/");
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage) return;
    let active = true;
    getLink()
      .then(({ url }) => {
        if (active) setPreview(url);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id, isImage]);

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary/50">
        {isImage && preview ? (
          <img src={preview} alt={doc.original_name} className="size-full object-cover" />
        ) : isImage ? (
          <ImageIcon className="size-5 text-muted-foreground" />
        ) : (
          <FileText className="size-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{doc.original_name}</p>
        <p className="text-xs text-muted-foreground">
          {doc.mime_type === "application/pdf" ? "PDF" : doc.mime_type.replace("image/", "").toUpperCase()} ·{" "}
          {formatBytes(doc.byte_size)} · {new Date(doc.created_at).toLocaleDateString()}
          {doc.review_note ? ` · ${doc.review_note}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={doc.review_status === "accepted" ? "default" : "secondary"} className="capitalize">
          {doc.review_status === "pending" ? "Uploaded" : doc.review_status}
        </Badge>
        <Button size="sm" variant="outline" onClick={onOpen}>
          <Eye /> View
        </Button>
        {onReplace && canEdit && doc.review_status === "pending" ? (
          <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm font-medium transition hover:bg-secondary focus-within:ring-2 focus-within:ring-ring">
            <RefreshCw className="size-4" /> Replace
            <input
              type="file"
              className="sr-only"
              accept={acceptAttribute}
              disabled={replacing}
              aria-label={`Replace ${doc.original_name}`}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onReplace(file);
              }}
            />
          </label>
        ) : null}
        {onRemove && canEdit && doc.review_status === "pending" ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" aria-label={`Remove ${doc.original_name}`}>
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this document?</AlertDialogTitle>
                <AlertDialogDescription>
                  {doc.original_name} will be deleted permanently from your secure storage.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </li>
  );
}
