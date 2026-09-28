import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Building2, Download, Eye, FileText, Image as ImageIcon, Pencil, Plus, Power, Save, Search, ShieldCheck, Trash2 } from "lucide-react";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import { CountryRegionFields } from "@/components/umrah/country-region-select";
import { useEffect, useState, type FormEvent } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/umrah/member-umrah";
import {
  deleteUmrahPartner,
  getUmrahApplication,
  downloadUmrahDocument,
  getUmrahDocumentLink,
  listUmrahApplications,
  listUmrahPartners,
  reviewUmrahDocument,
  saveUmrahPartner,
  setUmrahPartnerFlags,
  updateUmrahApplication,
  umrahStatuses,
  umrahDocumentLabels,
} from "@/lib/umrah.functions";

export function AdminUmrahManager() {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <Tabs defaultValue="applications">
      <TabsList className="mb-5 bg-card">
        <TabsTrigger value="applications">Applications</TabsTrigger>
        <TabsTrigger value="partners">
          <Building2 /> Partners
        </TabsTrigger>
      </TabsList>
      <TabsContent value="applications">
        {openId ? (
          <ApplicationDetail id={openId} onBack={() => setOpenId(null)} />
        ) : (
          <ApplicationList onOpen={setOpenId} />
        )}
      </TabsContent>
      <TabsContent value="partners">
        <PartnersManager />
      </TabsContent>
    </Tabs>
  );
}

function ApplicationList({ onOpen }: { onOpen: (id: string) => void }) {
  const list = useServerFn(listUmrahApplications);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(0);

  const query = useQuery({
    queryKey: ["umrah-applications", search, status, page],
    queryFn: () => list({ data: { search, status: status as never, page } }),
  });

  if (query.isPending) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (query.isError) return <EmptyState text={query.error.message} />;

  const { applications, total, pageSize } = query.data;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,200px)]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder="Search by number, name or email"
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(0);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {umrahStatuses.map((value) => (
              <SelectItem key={value} value={value} className="capitalize">
                {value.replaceAll("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {applications.length === 0 ? (
          <EmptyState text="No Umrah applications yet." />
        ) : (
          applications.map((row: any) => (
            <button
              key={row.id}
              type="button"
              onClick={() => onOpen(row.id)}
              className="grid w-full gap-2 border-b border-border p-4 text-left transition last:border-b-0 hover:bg-secondary/60 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <span className="min-w-0">
                <strong className="block truncate text-sm">
                  {row.application_number} · {row.full_name || "Unnamed applicant"}
                </strong>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {row.email ?? "No email"} · Updated {new Date(row.updated_at).toLocaleDateString()}
                </span>
              </span>
              <StatusBadge status={row.status} />
            </button>
          ))
        )}
      </div>

      {pages > 1 ? (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {pages} · {total} application(s)
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => setPage((value) => value + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ApplicationDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const load = useServerFn(getUmrahApplication);
  const update = useServerFn(updateUmrahApplication);
  const reviewDoc = useServerFn(reviewUmrahDocument);
  const documentLink = useServerFn(getUmrahDocumentLink);
  const downloadDocument = useServerFn(downloadUmrahDocument);

  const query = useQuery({ queryKey: ["umrah-application-detail", id], queryFn: () => load({ data: { id } }) });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["umrah-application-detail", id] });
    queryClient.invalidateQueries({ queryKey: ["umrah-applications"] });
  };

  const [status, setStatus] = useState<string>("");
  const [memberMessage, setMemberMessage] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    const current = query.data?.application as Record<string, any> | undefined;
    if (!current) return;
    setStatus(current["status"]);
    setMemberMessage(current["admin_message"] ?? "");
    setInternalNote(current["internal_note"] ?? "");
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      update({ data: { id, status: status as never, memberMessage, internalNote, notifyMember: notify } }),
    onSuccess: () => {
      toast.success("Application updated");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (query.isPending) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (query.isError) return <EmptyState text={query.error.message} />;

  const application = query.data.application as Record<string, any>;
  const documents = query.data.documents as any[];
  const history = query.data.history as any[];
  const profile = query.data.profile as Record<string, any> | null;


  async function openDocument(documentId: string) {
    try {
      const { url } = await documentLink({ data: { id: documentId } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The document could not be opened.");
    }
  }

  async function saveDocument(documentId: string) {
    try {
      const { url } = await downloadDocument({ data: { id: documentId, applicationId: id } });
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.rel = "noopener,noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The document could not be downloaded.");
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft /> All applications
        </Button>
        <StatusBadge status={application["status"]} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{application["application_number"]}</CardTitle>
          <CardDescription>
            {application["submitted_at"]
              ? `Submitted ${new Date(application["submitted_at"]).toLocaleString()}`
              : "Not submitted yet"}
            {profile ? ` · Member since ${new Date(profile["created_at"]).toLocaleDateString()}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Full name" value={application["full_name"]} />
          <Detail label="Date of birth" value={application["date_of_birth"]} />
          <Detail label="Phone" value={application["phone"]} />
          <Detail label="Email" value={application["email"]} />
          <Detail label="Nationality" value={application["nationality"]} />
          <Detail label="Residence" value={application["country_of_residence"]} />
          <Detail label="State / region" value={application["state_region"]} />
          <Detail label="City" value={application["city"]} />
          <Detail label="Passport number" value={application["passport_number"]} />
          <Detail label="Passport expiry" value={application["passport_expiry_date"]} />
          <Detail label="Issuing country" value={application["passport_issuing_country"]} />
          <Detail label="Emergency contact" value={application["emergency_contact_name"]} />
          <Detail label="Emergency phone" value={application["emergency_contact_phone"]} />
          <Detail label="Relationship" value={application["emergency_contact_relationship"]} />
          <Detail label="Preferred travel" value={application["preferred_travel_period"]} />
          <Detail label="Travel notes" value={application["travel_notes"]} />
          <Detail label="Member notes" value={application["member_notes"]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Documents</CardTitle>
          <CardDescription>Private files. Links expire after one minute.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <AdminDocThumb doc={doc} getLink={() => documentLink({ data: { id: doc.id } })} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.original_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {umrahDocumentLabels[doc.document_type as keyof typeof umrahDocumentLabels] ?? doc.document_type} ·{" "}
                      {doc.mime_type === "application/pdf"
                        ? "PDF"
                        : String(doc.mime_type ?? "").replace("image/", "").toUpperCase()}{" "}
                      · {(doc.byte_size / 1024).toFixed(0)} KB · {new Date(doc.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={doc.review_status === "accepted" ? "default" : "secondary"} className="capitalize">
                    {doc.review_status}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => openDocument(doc.id)}>
                    <Eye /> View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => saveDocument(doc.id)}>
                    <Download /> Download Document
                  </Button>
                  <Select
                    value={doc.review_status}
                    onValueChange={async (value) => {
                      try {
                        await reviewDoc({ data: { id: doc.id, reviewStatus: value as never, reviewNote: "" } });
                        toast.success("Document reviewed");
                        refresh();
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Review failed");
                      }
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Review & status</CardTitle>
          <CardDescription>The member sees the message. The internal note stays with administrators only.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2 sm:max-w-xs">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {umrahStatuses.map((value) => (
                  <SelectItem key={value} value={value} className="capitalize">
                    {value.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Message to the member</Label>
            <Textarea value={memberMessage} onChange={(event) => setMemberMessage(event.target.value)} maxLength={1000} rows={3} />
          </div>
          <div className="grid gap-2">
            <Label>Internal administrator note (private)</Label>
            <Textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} maxLength={2000} rows={3} />
          </div>
          <div className="flex items-center gap-3">
            <Switch id="notify-member" checked={notify} onCheckedChange={setNotify} />
            <Label htmlFor="notify-member">Notify the member</Label>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={saveMutation.isPending} className="sm:w-fit">
                <Save /> Save changes
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apply these changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  The application status will be set to {status.replaceAll("_", " ")}
                  {notify ? " and the member will be notified." : "."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => saveMutation.mutate()}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history recorded yet.</p>
          ) : (
            <ol className="grid gap-2">
              {history.map((row) => (
                <li key={row.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm capitalize">{row.action}</strong>
                    <span className="flex items-center gap-2">
                      {row.member_visible ? null : <Badge variant="secondary">Internal</Badge>}
                      <time className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</time>
                    </span>
                  </div>
                  {row.note ? <p className="mt-1 text-sm text-muted-foreground">{row.note}</p> : null}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PartnersManager() {
  const queryClient = useQueryClient();
  const list = useServerFn(listUmrahPartners);
  const save = useServerFn(saveUmrahPartner);
  const remove = useServerFn(deleteUmrahPartner);
  const setFlags = useServerFn(setUmrahPartnerFlags);
  const query = useQuery({ queryKey: ["umrah-partners"], queryFn: () => list() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["umrah-partners"] });
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [logoPath, setLogoPath] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit(partner: Record<string, any> | null) {
    setEditing(partner);
    setLogoPath(partner?.["logo_path"] ?? "");
    setFormKey((k) => k + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "");
    setSaving(true);
    try {
      await save({
        data: {
          ...(editing?.["id"] ? { id: editing["id"] } : {}),
          name: value("name"),
          country: value("country"),
          stateRegion: value("stateRegion"),
          city: value("city"),
          logoPath,
          sortOrder: Number(value("sortOrder") || 0),
          contactEmail: value("contactEmail"),
          contactPhone: value("contactPhone"),
          whatsapp: value("whatsapp"),
          showPhone: form.get("showPhone") === "on",
          showWhatsapp: form.get("showWhatsapp") === "on",
          showEmail: form.get("showEmail") === "on",
          websiteUrl: value("websiteUrl"),
          services: value("services"),
          verificationStatus: value("verificationStatus") as never,
          isVisible: form.get("isVisible") === "on",
          notes: value("notes"),
        },
      });
      toast.success("Partner saved");
      startEdit(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The partner could not be saved.");
    }
    setSaving(false);
  }

  async function flag(id: string, patch: { verificationStatus?: "verified" | "unverified"; isVisible?: boolean }) {
    try {
      await setFlags({ data: { id, ...patch } });
      toast.success("Partner updated");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  if (query.isPending) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (query.isError) return <EmptyState text={query.error.message} />;

  const partners = query.data.partners as any[];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
      <div className="grid content-start gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{partners.length} partner{partners.length === 1 ? "" : "s"}</p>
          <Button type="button" onClick={() => startEdit(null)}>
            <Plus /> Add New Partner
          </Button>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {partners.length === 0 ? (
            <EmptyState text="No partners added yet. Nothing is shown publicly until a partner is added and verified." />
          ) : (
            partners.map((partner) => {
              const verified = partner.verification_status === "verified";
              const location = [partner.city, partner.state_region, partner.country].filter(Boolean).join(", ");
              return (
                <div key={partner.id} className={`grid gap-3 border-b border-border p-4 last:border-b-0 ${editing?.["id"] === partner.id ? "bg-secondary/60" : ""}`}>
                  <div className="min-w-0">
                    <strong className="block truncate text-sm">{partner.name}</strong>
                    <span className="text-xs text-muted-foreground">{location || "No location"} · order {partner.sort_order ?? 0}</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant={verified ? "default" : "secondary"}>{partner.verification_status}</Badge>
                      <Badge variant={partner.is_visible ? "default" : "outline"}>{partner.is_visible ? "Active on website" : "Inactive"}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(partner)}>
                      <Pencil /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => flag(partner.id, { verificationStatus: verified ? "unverified" : "verified" })}>
                      <ShieldCheck /> {verified ? "Unverify" : "Verify"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={!verified && !partner.is_visible} title={!verified ? "Verify the partner first" : undefined} onClick={() => flag(partner.id, { isVisible: !partner.is_visible })}>
                      <Power /> {partner.is_visible ? "Deactivate" : "Activate"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" aria-label={`Delete ${partner.name}`}>
                          <Trash2 /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {partner.name}?</AlertDialogTitle>
                          <AlertDialogDescription>This partner will be permanently deleted. Only a Super Admin can do this.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              try {
                                await remove({ data: { id: partner.id } });
                                toast.success("Partner deleted");
                                if (editing?.["id"] === partner.id) startEdit(null);
                                refresh();
                              } catch (error) {
                                toast.error(error instanceof Error ? error.message : "Delete failed");
                              }
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{editing ? `Edit partner: ${editing["name"]}` : "Add new partner"}</CardTitle>
          <CardDescription>A partner appears publicly only when it is verified and set to visible.</CardDescription>
        </CardHeader>
        <CardContent>
          <form key={`${editing?.["id"] ?? "new"}-${formKey}`} onSubmit={submit} className="grid gap-3">
            <div className="grid gap-2"><Label>Partner name</Label>
              <Input name="name" placeholder="Partner name" defaultValue={editing?.["name"] ?? ""} required maxLength={160} /></div>
            <MediaUploadField label="Logo / office image" value={logoPath} onChange={setLogoPath} kind="image" hint="Stored privately and shown through secure links. Click Save partner to apply." />
            <CountryRegionFields
              countryName="country"
              regionName="stateRegion"
              cityName="city"
              countryLabel="Country"
              defaultCountry={editing?.["country"] ?? ""}
              defaultRegion={editing?.["state_region"] ?? ""}
              defaultCity={editing?.["city"] ?? ""}
            />
            <div className="grid gap-2"><Label>Contact email</Label>
              <Input name="contactEmail" type="email" placeholder="name@example.com" defaultValue={editing?.["contact_email"] ?? ""} maxLength={160} /></div>
            <div className="grid gap-2"><Label>Contact phone</Label>
              <Input name="contactPhone" placeholder="+234…" defaultValue={editing?.["contact_phone"] ?? ""} maxLength={40} /></div>
            <div className="grid gap-2"><Label>WhatsApp</Label>
              <Input name="whatsapp" placeholder="+234…" defaultValue={(editing as Record<string, unknown> | null)?.["whatsapp"] as string ?? ""} maxLength={40} /></div>
            <fieldset className="grid gap-2 rounded-md border border-border p-3 text-sm">
              <legend className="px-1 font-medium">Show on public website</legend>
              {([["showEmail", "show_email", "Email"], ["showPhone", "show_phone", "Phone"], ["showWhatsapp", "show_whatsapp", "WhatsApp"]] as const).map(([name, col, label]) => (
                <label key={name} className="flex items-center gap-3"><input type="checkbox" name={name} defaultChecked={Boolean((editing as Record<string, unknown> | null)?.[col])} className="size-4" />{label}</label>
              ))}
            </fieldset>
            <div className="grid gap-2"><Label>Website</Label>
              <Input name="websiteUrl" type="url" placeholder="https://example.com" defaultValue={editing?.["website_url"] ?? ""} /></div>
            <div className="grid gap-2"><Label>Services offered</Label>
              <Textarea name="services" placeholder="Services offered" defaultValue={editing?.["services"] ?? ""} rows={2} maxLength={1000} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Verification status</Label>
                <Select name="verificationStatus" defaultValue={editing?.["verification_status"] ?? "unverified"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="pending">Pending verification</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Display order</Label>
                <Input name="sortOrder" type="number" min={0} max={100000} defaultValue={editing?.["sort_order"] ?? 0} /></div>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="isVisible" defaultChecked={editing?.["is_visible"] ?? false} className="size-4" />
              Visible on website (verified partners only)
            </label>
            <div className="grid gap-2"><Label>Internal notes</Label>
              <Textarea name="notes" placeholder="Not shown publicly" defaultValue={editing?.["notes"] ?? ""} rows={2} maxLength={1000} /></div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                <Save /> {saving ? "Saving…" : "Save partner"}
              </Button>
              {editing ? (
                <Button type="button" variant="outline" onClick={() => startEdit(null)}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm">{value || "—"}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">{text}</div>;
}

function AdminDocThumb({ doc, getLink }: { doc: any; getLink: () => Promise<{ url: string }> }) {
  const isImage = String(doc.mime_type ?? "").startsWith("image/");
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
    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary/50">
      {isImage && preview ? (
        <img src={preview} alt={doc.original_name} className="size-full object-cover" />
      ) : isImage ? (
        <ImageIcon className="size-5 text-muted-foreground" />
      ) : (
        <FileText className="size-5 text-muted-foreground" />
      )}
    </div>
  );
}
