import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, ClipboardList, Eye, FileUp, Info, Loader2, Send, Trash2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteUmrahDocument,
  getMyUmrahApplication,
  getUmrahDocumentLink,
  registerUmrahDocument,
  saveMyUmrahApplication,
  submitMyUmrahApplication,
  umrahDocumentTypes,
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
const MAX_BYTES = 10 * 1024 * 1024;

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


  const saveMutation = useMutation({
    mutationFn: (values: Record<string, string>) => save({ data: values as never }),
    onSuccess: () => {
      toast.success("Your application has been saved.");
      refresh();
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
