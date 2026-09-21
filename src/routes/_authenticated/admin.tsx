import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Archive, Bell, FileText, History, Image, LayoutDashboard, LogOut, Plus, Save, Settings, ShieldCheck, Upload, Users } from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { archiveContentEntry, getAdminWorkspace, registerMediaAsset, saveContentEntry, saveSiteSettings } from "@/lib/content.functions";
import { getAdminOverview, listMembers, sendNotification, setMemberActive, setMemberRole } from "@/lib/members.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => pageHead({ title: "Content Management — BangisKebbi.com", description: "Secure BangisKebbi.com content-management workspace.", path: "/admin" }),
  component: AdminPage,
});

const contentTypes = ["homepage", "about", "service", "project", "blog_post", "blog_category", "business", "umrah", "umrah_step", "umrah_faq", "umrah_notice", "foundation", "foundation_initiative", "foundation_update", "community", "contact"] as const;
type ContentStatus = "draft" | "published" | "unpublished" | "archived";

type EditorState = {
  id?: string;
  contentType: (typeof contentTypes)[number];
  slug: string;
  title: string;
  summary: string;
  body: string;
  imagePath: string;
  status: ContentStatus;
  isEnabled: boolean;
  isFeatured: boolean;
  sortOrder: number;
  scheduledFor: string;
};

const emptyEditor: EditorState = { contentType: "service", slug: "", title: "", summary: "", body: "", imagePath: "", status: "draft", isEnabled: true, isFeatured: false, sortOrder: 0, scheduledFor: "" };

function AdminPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const getWorkspace = useServerFn(getAdminWorkspace);
  const saveEntry = useServerFn(saveContentEntry);
  const archiveEntry = useServerFn(archiveContentEntry);
  const saveSettings = useServerFn(saveSiteSettings);
  const registerMedia = useServerFn(registerMediaAsset);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<string>("all");

  const workspace = useQuery({ queryKey: ["admin-workspace"], queryFn: () => getWorkspace() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-workspace"] });
  const saveMutation = useMutation({
    mutationFn: () => saveEntry({ data: {
      ...(editor.id ? { id: editor.id } : {}),
      contentType: editor.contentType,
      slug: editor.slug,
      title: editor.title,
      ...(editor.summary ? { summary: editor.summary } : {}),
      ...(editor.body ? { body: editor.body } : {}),
      ...(editor.imagePath ? { imagePath: editor.imagePath } : {}),
      status: editor.status,
      isEnabled: editor.isEnabled,
      isFeatured: editor.isFeatured,
      sortOrder: editor.sortOrder,
      ...(editor.scheduledFor ? { scheduledFor: new Date(editor.scheduledFor).toISOString() } : {}),
      payload: {},
    } }),
    onSuccess: () => { toast.success(editor.id ? "Content updated" : "Content created"); setEditor(emptyEditor); refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveEntry({ data: { id } }),
    onSuccess: () => { toast.success("Content archived"); setEditor(emptyEditor); refresh(); },
    onError: (error) => toast.error(error.message),
  });

  const entries = useMemo(() => (workspace.data?.entries ?? []).filter((entry) => (area === "all" || entry.content_type === area) && `${entry.title} ${entry.content_type} ${entry.slug}`.toLowerCase().includes(query.toLowerCase())), [workspace.data?.entries, query, area]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/login", replace: true });
  }

  if (workspace.isPending) return <AdminLoading />;
  if (workspace.isError) return <AdminDenied message={workspace.error.message} onSignOut={signOut} />;

  return (
    <main className="min-h-[75vh] bg-secondary/45 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /><span className="text-xs font-bold uppercase">Protected workspace</span></div><h1 className="mt-2 font-display text-3xl font-bold">Website Content</h1><p className="mt-2 text-sm text-muted-foreground">Manage public content without exposing system credentials or private configuration.</p></div>
          <Button variant="outline" onClick={signOut}><LogOut /> Sign out</Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6 h-auto w-full justify-start overflow-x-auto bg-card p-1">
            <TabsTrigger value="overview"><LayoutDashboard /> Dashboard</TabsTrigger>
            <TabsTrigger value="content"><FileText /> Content</TabsTrigger>
            <TabsTrigger value="members"><Users /> Members</TabsTrigger>
            <TabsTrigger value="notifications"><Bell /> Notifications</TabsTrigger>
            <TabsTrigger value="settings"><Settings /> Settings</TabsTrigger>
            <TabsTrigger value="media"><Image /> Media</TabsTrigger>
            <TabsTrigger value="audit"><History /> Audit log</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><AdminOverview /></TabsContent>
          <TabsContent value="notifications"><NotificationsComposer /></TabsContent>

          <TabsContent value="content">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
              <section className="min-w-0">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search content" aria-label="Search content" />
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger className="sm:w-52" aria-label="Filter by content area"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All content areas</SelectItem>
                      {contentTypes.map((type) => <SelectItem key={type} value={type}>{type.replaceAll("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setEditor(emptyEditor)}><Plus /> New item</Button>
                </div>
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  {entries.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">No content matches this view.</div> : entries.map((entry) => (
                    <button key={entry.id} type="button" onClick={() => setEditor({ id: entry.id, contentType: entry.content_type as EditorState["contentType"], slug: entry.slug, title: entry.title, summary: entry.summary ?? "", body: entry.body ?? "", imagePath: entry.image_path ?? "", status: entry.status, isEnabled: entry.is_enabled, isFeatured: entry.is_featured, sortOrder: entry.sort_order, scheduledFor: entry.scheduled_for ? entry.scheduled_for.slice(0, 16) : "" })} className="grid w-full gap-2 border-b border-border p-4 text-left transition last:border-b-0 hover:bg-secondary/60 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <span className="min-w-0"><strong className="block truncate text-sm">{entry.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{entry.content_type.replaceAll("_", " ")} · Updated {new Date(entry.updated_at).toLocaleDateString()}</span></span>
                      <Badge variant={entry.status === "published" ? "default" : "secondary"}>{entry.status}</Badge>
                    </button>
                  ))}
                </div>
              </section>
              <ContentEditor editor={editor} setEditor={setEditor} saving={saveMutation.isPending} onSave={() => saveMutation.mutate()} onArchive={editor.id ? () => archiveMutation.mutate(editor.id as string) : undefined} />
            </div>
          </TabsContent>
          <TabsContent value="settings">{workspace.data?.settings ? <SettingsEditor settings={workspace.data.settings} saving={false} onSave={async (data) => { try { await saveSettings({ data }); toast.success("Website settings updated"); refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "Settings could not be saved"); } }} /> : <EmptyState text="Website settings are unavailable." />}</TabsContent>
          <TabsContent value="media"><MediaManager media={workspace.data?.media ?? []} registerMedia={registerMedia} onChanged={refresh} /></TabsContent>
          <TabsContent value="members"><MembersManager /></TabsContent>
          <TabsContent value="audit"><AuditLog rows={workspace.data?.audit ?? []} /></TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function ContentEditor({ editor, setEditor, saving, onSave, onArchive }: { editor: EditorState; setEditor: (value: EditorState) => void; saving: boolean; onSave: () => void; onArchive?: (() => void) | undefined }) {
  const update = <K extends keyof EditorState>(key: K, value: EditorState[K]) => setEditor({ ...editor, [key]: value });
  return <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-lg font-bold">{editor.id ? "Edit content" : "New content"}</h2><Badge variant="outline">{editor.status}</Badge></div><div className="grid gap-4">
    <Field label="Content area"><Select value={editor.contentType} onValueChange={(value) => update("contentType", value as EditorState["contentType"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{contentTypes.map((type) => <SelectItem key={type} value={type}>{type.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field>
    <Field label="Title"><Input value={editor.title} maxLength={200} onChange={(event) => update("title", event.target.value)} /></Field>
    <Field label="URL name"><Input value={editor.slug} maxLength={160} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" onChange={(event) => update("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /></Field>
    <Field label="Short description"><Textarea value={editor.summary} maxLength={1000} onChange={(event) => update("summary", event.target.value)} /></Field>
    <Field label="Full content"><Textarea className="min-h-32" value={editor.body} maxLength={20000} onChange={(event) => update("body", event.target.value)} /></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Status"><Select value={editor.status} onValueChange={(value) => update("status", value as ContentStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["draft", "published", "unpublished", "archived"].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field><Field label="Order"><Input type="number" value={editor.sortOrder} onChange={(event) => update("sortOrder", Number(event.target.value))} /></Field></div>
    <Field label="Schedule (optional)"><Input type="datetime-local" value={editor.scheduledFor} onChange={(event) => update("scheduledFor", event.target.value)} /></Field>
    <label className="flex items-center justify-between text-sm"><span>Visible when published</span><Switch checked={editor.isEnabled} onCheckedChange={(checked) => update("isEnabled", checked)} /></label>
    <label className="flex items-center justify-between text-sm"><span>Featured content</span><Switch checked={editor.isFeatured} onCheckedChange={(checked) => update("isFeatured", checked)} /></label>
    <Button disabled={saving || !editor.title || !editor.slug} onClick={onSave}><Save /> {saving ? "Saving…" : "Save content"}</Button>
    {onArchive && <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive"><Archive /> Archive item</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure you want to archive this?</AlertDialogTitle><AlertDialogDescription>The item will leave the public website. Its history remains available for restoration.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onArchive}>Archive</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
  </div></aside>;
}

type SettingsRow = NonNullable<Awaited<ReturnType<typeof getAdminWorkspace>>["settings"]>;
function SettingsEditor({ settings, onSave }: { settings: SettingsRow; saving: boolean; onSave: (data: { id: string; websiteName: string; companyName: string; location: string; globalStatus: string; contactEmail: string; phone: string; whatsapp: string; footerContent: string; defaultLanguage: "en" | "ha" | "ar"; seoTitle: string; seoDescription: string }) => Promise<void> }) {
  const [form, setForm] = useState({ id: settings.id, websiteName: settings.website_name, companyName: settings.company_name, location: settings.location, globalStatus: settings.global_status, contactEmail: settings.contact_email ?? "", phone: settings.phone ?? "", whatsapp: settings.whatsapp ?? "", footerContent: settings.footer_content, defaultLanguage: settings.default_language as "en" | "ha" | "ar", seoTitle: settings.seo_title, seoDescription: settings.seo_description });
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); await onSave(form); setBusy(false); }
  return <form onSubmit={submit} className="mx-auto grid max-w-3xl gap-5 rounded-lg border border-border bg-card p-6"><div><h2 className="font-display text-xl font-bold">Website settings</h2><p className="mt-1 text-sm text-muted-foreground">Content settings only. Credentials and service configuration are never exposed here.</p></div><div className="grid gap-4 sm:grid-cols-2">
    <Field label="Website name"><Input value={form.websiteName} maxLength={120} onChange={(e) => setForm({ ...form, websiteName: e.target.value })} /></Field><Field label="Company name"><Input value={form.companyName} maxLength={160} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></Field>
    <Field label="Location"><Input value={form.location} maxLength={160} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field><Field label="Global status"><Input value={form.globalStatus} maxLength={160} onChange={(e) => setForm({ ...form, globalStatus: e.target.value })} /></Field>
    <Field label="Contact email"><Input type="email" value={form.contactEmail} maxLength={254} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></Field><Field label="Phone"><Input value={form.phone} maxLength={40} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
    <Field label="WhatsApp"><Input value={form.whatsapp} maxLength={40} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field><Field label="Default language"><Select value={form.defaultLanguage} onValueChange={(value) => setForm({ ...form, defaultLanguage: value as "en" | "ha" | "ar" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="ha">Hausa</SelectItem><SelectItem value="ar">Arabic</SelectItem></SelectContent></Select></Field>
  </div><Field label="Footer statement"><Textarea value={form.footerContent} maxLength={500} onChange={(e) => setForm({ ...form, footerContent: e.target.value })} /></Field><Field label="SEO title"><Input value={form.seoTitle} maxLength={180} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} /></Field><Field label="SEO description"><Textarea value={form.seoDescription} maxLength={500} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} /></Field><Button type="submit" disabled={busy}><Save /> {busy ? "Saving…" : "Save settings"}</Button></form>;
}

type RegisterMedia = ReturnType<typeof useServerFn<typeof registerMediaAsset>>;
function MediaManager({ media, registerMedia, onChanged }: { media: Awaited<ReturnType<typeof getAdminWorkspace>>["media"]; registerMedia: RegisterMedia; onChanged: () => void }) {
  const [uploading, setUploading] = useState(false);
  async function upload(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const input = event.currentTarget.elements.namedItem("media") as HTMLInputElement | null; const file = input?.files?.[0]; if (!file) return; if (file.size > 10485760 || !["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"].includes(file.type)) { toast.error("Choose a supported image up to 10 MB."); return; } setUploading(true); const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, "-"); const path = `${crypto.randomUUID()}-${safeName}`; const { error } = await supabase.storage.from("site-media").upload(path, file, { contentType: file.type, upsert: false }); if (error) { toast.error(error.message); setUploading(false); return; } try { await registerMedia({ data: { name: file.name, storagePath: path, mimeType: file.type as "image/jpeg", altText: "", byteSize: file.size } }); toast.success("Image uploaded to the private media library"); onChanged(); } catch (errorValue) { await supabase.storage.from("site-media").remove([path]); toast.error(errorValue instanceof Error ? errorValue.message : "Upload could not be recorded"); } setUploading(false); }
  return <section><form onSubmit={upload} className="mb-5 flex flex-col gap-3 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-end"><Field label="Upload image"><Input name="media" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml" required /></Field><Button type="submit" disabled={uploading}><Upload /> {uploading ? "Uploading…" : "Upload"}</Button></form><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{media.length === 0 ? <EmptyState text="No dashboard media has been uploaded." /> : media.map((item) => <article key={item.id} className="rounded-lg border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><strong className="block truncate text-sm">{item.name}</strong><span className="text-xs text-muted-foreground">{Math.round(item.byte_size / 1024)} KB · Used {item.usage_count} times</span></div>{item.is_protected && <Badge><ShieldCheck /> Protected</Badge>}</div><p className="mt-3 truncate text-xs text-muted-foreground">{item.storage_path}</p></article>)}</div></section>;
}

function AuditLog({ rows }: { rows: Awaited<ReturnType<typeof getAdminWorkspace>>["audit"] }) { return <div className="overflow-hidden rounded-lg border border-border bg-card">{rows.length === 0 ? <EmptyState text="No administrator actions recorded yet." /> : rows.map((row) => <div key={row.id} className="grid gap-2 border-b border-border p-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto]"><div><strong className="text-sm capitalize">{row.action}</strong><p className="mt-1 text-xs text-muted-foreground">{row.content_type.replaceAll("_", " ")}{row.content_label ? ` · ${row.content_label}` : ""}</p></div><time className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</time></div>)}</div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="grid min-w-0 gap-1.5"><Label>{label}</Label>{children}</div>; }
function EmptyState({ text }: { text: string }) { return <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">{text}</div>; }
function AdminLoading() { return <main className="mx-auto grid min-h-[70vh] max-w-7xl gap-5 px-4 py-10"><Skeleton className="h-20 w-full" /><div className="grid gap-5 lg:grid-cols-[1fr_390px]"><Skeleton className="h-96" /><Skeleton className="h-96" /></div></main>; }
function AdminDenied({ message, onSignOut }: { message: string; onSignOut: () => void }) { return <main className="grid min-h-[70vh] place-items-center px-4"><div className="max-w-md rounded-lg border border-border bg-card p-7 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-4 font-display text-2xl font-bold">Administrator access required</h1><p className="mt-3 text-sm text-muted-foreground">{message}</p><Button className="mt-6" variant="outline" onClick={onSignOut}>Sign out</Button></div></main>; }
function MembersManager() {
  const fetchMembers = useServerFn(listMembers);
  const toggleActive = useServerFn(setMemberActive);
  const toggleRole = useServerFn(setMemberRole);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(0);

  const members = useQuery({
    queryKey: ["admin-members", search, status, page],
    queryFn: () => fetchMembers({ data: { search, status, page } }),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-members"] });

  if (members.isError) return <EmptyState text={members.error.message} />;

  const rows = members.data?.members ?? [];
  const total = members.data?.total ?? 0;
  const pageSize = members.data?.pageSize ?? 20;

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input value={search} onChange={(event) => { setPage(0); setSearch(event.target.value); }} placeholder="Search name, email, country or city" aria-label="Search members" />
        <Select value={status} onValueChange={(value) => { setPage(0); setStatus(value as "all" | "active" | "inactive"); }}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All members</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Deactivated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {members.isPending ? <Skeleton className="h-64 w-full" /> : rows.length === 0 ? <EmptyState text="No members match this view." /> : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {rows.map((member: { id: string; full_name: string; email: string; phone: string | null; country: string | null; city: string | null; is_active: boolean; created_at: string; roles: string[] }) => (
            <div key={member.id} className="grid gap-3 border-b border-border p-4 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <strong className="block truncate text-sm">{member.full_name || "Unnamed member"}</strong>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {member.email}{member.country ? ` · ${member.city ? `${member.city}, ` : ""}${member.country}` : ""} · Joined {new Date(member.created_at).toLocaleDateString()}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant={member.is_active ? "default" : "secondary"}>{member.is_active ? "Active" : "Deactivated"}</Badge>
                  {member.roles.map((role) => <Badge key={role} variant="outline">{role.replaceAll("_", " ")}</Badge>)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant={member.is_active ? "destructive" : "outline"}>{member.is_active ? "Deactivate" : "Activate"}</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{member.is_active ? "Deactivate this account?" : "Activate this account?"}</AlertDialogTitle>
                      <AlertDialogDescription>This change is recorded in the audit log.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={async () => {
                        try { await toggleActive({ data: { userId: member.id, isActive: !member.is_active } }); toast.success("Member status updated"); refresh(); }
                        catch (error) { toast.error(error instanceof Error ? error.message : "Update failed"); }
                      }}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Select value="" onValueChange={async (value) => {
                  const [role, action] = value.split(":");
                  try {
                    await toggleRole({ data: { userId: member.id, role: role as "admin", grant: action === "grant" } });
                    toast.success("Role updated");
                    refresh();
                  } catch (error) { toast.error(error instanceof Error ? error.message : "Only a Super Admin can change roles"); }
                }}>
                  <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Manage role" /></SelectTrigger>
                  <SelectContent>
                    {["member", "content_manager", "support", "finance", "admin", "super_admin"].map((role) => (
                      <SelectItem key={`${role}:grant`} value={`${role}:grant`}>Grant {role.replaceAll("_", " ")}</SelectItem>
                    ))}
                    {["content_manager", "support", "finance", "admin", "super_admin"].map((role) => (
                      <SelectItem key={`${role}:revoke`} value={`${role}:revoke`}>Remove {role.replaceAll("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} member{total === 1 ? "" : "s"}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <Button size="sm" variant="outline" disabled={(page + 1) * pageSize >= total} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>
    </section>
  );
}

function AdminOverview() {
  const loadOverview = useServerFn(getAdminOverview);
  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: () => loadOverview() });
  if (overview.isPending) return <Skeleton className="h-64 w-full" />;
  if (overview.isError) return <EmptyState text={overview.error.message} />;
  const data = overview.data;
  const cards = [
    { title: "Members", value: `${data.members}`, note: `${data.activeMembers} active` },
    { title: "Content items", value: `${data.entries}`, note: `${data.publishedEntries} published` },
    { title: "Media files", value: `${data.media}`, note: "Private media library" },
    { title: "Notifications", value: `${data.notifications}`, note: "Delivered to members" },
  ];
  return (
    <section className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2"><CardDescription>{card.title}</CardDescription><CardTitle className="font-display text-3xl">{card.value}</CardTitle></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{card.note}</p></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Recent administrator activity</CardTitle><CardDescription>The five most recent recorded actions.</CardDescription></CardHeader>
        <CardContent className="grid gap-3">
          {data.recent.length === 0 ? <p className="text-sm text-muted-foreground">No administrator actions recorded yet.</p> : data.recent.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-b-0 last:pb-0">
              <span className="text-sm"><strong className="capitalize">{row.action}</strong> · {row.content_type.replaceAll("_", " ")}{row.content_label ? ` · ${row.content_label}` : ""}</span>
              <time className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</time>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function NotificationsComposer() {
  const send = useServerFn(sendNotification);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<"general" | "platform" | "community" | "umrah" | "foundation">("general");
  const [audience, setAudience] = useState<"all" | "active">("active");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await send({ data: { title, body, category, audience } });
      toast.success(result.sent === 0 ? "No members match this audience yet." : `Announcement sent to ${result.sent} member(s).`);
      setTitle(""); setBody("");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Announcement could not be sent"); }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-2xl gap-5 rounded-lg border border-border bg-card p-6">
      <div><h2 className="font-display text-xl font-bold">Send an announcement</h2><p className="mt-1 text-sm text-muted-foreground">Members see announcements in their dashboard. Each send is recorded in the audit log.</p></div>
      <Field label="Title"><Input value={title} maxLength={160} required onChange={(event) => setTitle(event.target.value)} /></Field>
      <Field label="Message"><Textarea className="min-h-28" value={body} maxLength={2000} onChange={(event) => setBody(event.target.value)} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category"><Select value={category} onValueChange={(value) => setCategory(value as typeof category)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["general", "platform", "community", "umrah", "foundation"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Audience"><Select value={audience} onValueChange={(value) => setAudience(value as typeof audience)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active members</SelectItem><SelectItem value="all">All members</SelectItem></SelectContent></Select></Field>
      </div>
      <Button type="submit" disabled={busy || title.trim().length < 2}><Bell /> {busy ? "Sending…" : "Send announcement"}</Button>
    </form>
  );
}
