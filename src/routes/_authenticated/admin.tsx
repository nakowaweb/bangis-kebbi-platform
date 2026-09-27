import { GalleryPicker } from "@/components/admin/gallery-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Archive, BadgeCheck, Bell, Eye, FileText, HandHeart, History, Image, Languages, LayoutDashboard, LogOut, Plane, Plus, RotateCcw, Save, Settings, Share2, ShieldCheck, Trash2, Users } from "lucide-react";
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
import { AdminSocialManager } from "@/components/admin/social-manager";
import { AdminCredentialManager } from "@/components/admin/credential-manager";
import { AdminTranslationManager } from "@/components/admin/translation-manager";
import { AdminFoundationManager } from "@/components/foundation/admin-foundation";
import { AdminNotificationManager } from "@/components/notifications/admin-notifications";
import { AdminUmrahManager } from "@/components/umrah/admin-umrah";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import { SearchConfigTest } from "@/components/admin/search-config-test";
import { archiveContentEntry, deleteContentEntry, getAdminWorkspace, registerMediaAsset, restoreContentEntry, saveContentEntry, saveSiteSettings } from "@/lib/content.functions";
import { CurrentSiteImporter } from "@/components/admin/current-site-importer";
import { MediaLibrary } from "@/components/admin/media-library";
import { getAdminOverview, getMyAdminAccess } from "@/lib/members.functions";
import { languages, type LanguageCode } from "@/lib/i18n/dictionary";
import { MembersManager } from "@/components/admin/members-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin")({
  head: ({ match }) => pageHead({ search: match.search, title: "Content Management — BangisKebbi.com", description: "Secure BangisKebbi.com content-management workspace.", path: "/admin", noindex: true }),
  beforeLoad: async ({ context }) => {
    const userId = (context as { user?: { id?: string } }).user?.id;
    if (!userId) throw redirect({ to: "/login" });
    const { data: allowed, error } = await supabase.rpc("is_platform_admin", { _user_id: userId });
    if (error || !allowed) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

const contentTypes = ["homepage", "about", "service", "project", "blog_post", "blog_category", "business", "umrah", "umrah_step", "umrah_requirement", "umrah_faq", "umrah_notice", "umrah_information", "umrah_contact", "foundation", "foundation_mission", "foundation_vision", "foundation_what_we_do", "foundation_initiative", "foundation_update", "community", "contact", "footer"] as const;
type ContentStatus = "draft" | "published" | "unpublished" | "archived";

type EditorState = {
  id?: string;
  contentType: (typeof contentTypes)[number];
  slug: string;
  title: string;
  summary: string;
  body: string;
  imagePath: string;
  imageAlt: string;
  category: string;
  author: string;
  tags: string;
  language: LanguageCode;
  gallery: string;
  projectUrl: string;
  completedOn: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImagePath: string;
  status: ContentStatus;
  isEnabled: boolean;
  isFeatured: boolean;
  sortOrder: number;
  scheduledFor: string;
  videoUrl: string;
  videoPath: string;
  videoCaption: string;
  publishedAt: string;
};

const emptyEditor: EditorState = { contentType: "service", slug: "", title: "", summary: "", body: "", imagePath: "", imageAlt: "", category: "", author: "", tags: "", language: "en", gallery: "", projectUrl: "", completedOn: "", seoTitle: "", seoDescription: "", canonicalUrl: "", ogTitle: "", ogDescription: "", ogImagePath: "", status: "draft", isEnabled: true, isFeatured: false, sortOrder: 0, scheduledFor: "", videoUrl: "", videoPath: "", videoCaption: "", publishedAt: "" };

const previewPath = (editor: EditorState) =>
  editor.contentType === "service" ? `/services/${editor.slug}` :
  editor.contentType === "project" ? `/projects/${editor.slug}` :
  editor.contentType === "blog_post" ? `/blog/${editor.slug}` :
  editor.slug === "professional-cv" ? "/cv" :
  editor.slug === "privacy-policy" ? "/privacy" :
  editor.slug === "terms-of-use" ? "/terms" :
  editor.slug === "refund-policy" ? "/refund-policy" :
  editor.contentType.startsWith("umrah") ? "/umrah" :
  editor.contentType.startsWith("foundation") ? "/foundation" :
  editor.contentType === "community" ? "/community" :
  editor.contentType === "contact" ? "/contact" :
  editor.contentType === "about" ? "/about" : null;

const splitList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

function AdminPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const getWorkspace = useServerFn(getAdminWorkspace);
  const saveEntry = useServerFn(saveContentEntry);
  const archiveEntry = useServerFn(archiveContentEntry);
  const restoreEntry = useServerFn(restoreContentEntry);
  const deleteEntry = useServerFn(deleteContentEntry);
  const saveSettings = useServerFn(saveSiteSettings);
  const registerMedia = useServerFn(registerMediaAsset);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<string>("all");

  const getAccess = useServerFn(getMyAdminAccess);
  const access = useQuery({ queryKey: ["admin-access"], queryFn: () => getAccess() });
  const can = (module: string) => Boolean(access.data?.isSuperAdmin || access.data?.modules.includes(module));
  const workspace = useQuery({ queryKey: ["admin-workspace"], queryFn: () => getWorkspace(), enabled: access.isSuccess && can("content") });
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
      ...(editor.imageAlt ? { imageAlt: editor.imageAlt } : {}),
      ...(editor.category ? { category: editor.category } : {}),
      ...(editor.author ? { author: editor.author } : {}),
      tags: splitList(editor.tags),
      language: editor.language,
      gallery: splitList(editor.gallery),
      projectUrl: editor.projectUrl,
      completedOn: editor.completedOn,
      ...(editor.seoTitle ? { seoTitle: editor.seoTitle } : {}),
      ...(editor.seoDescription ? { seoDescription: editor.seoDescription } : {}),
      canonicalUrl: editor.canonicalUrl,
      ...(editor.ogTitle ? { ogTitle: editor.ogTitle } : {}),
      ...(editor.ogDescription ? { ogDescription: editor.ogDescription } : {}),
      ...(editor.ogImagePath ? { ogImagePath: editor.ogImagePath } : {}),
      status: editor.status,
      isEnabled: editor.isEnabled,
      isFeatured: editor.isFeatured,
      sortOrder: editor.sortOrder,
      ...(editor.scheduledFor ? { scheduledFor: new Date(editor.scheduledFor).toISOString() } : {}),
      ...(editor.publishedAt ? { publishedAt: new Date(editor.publishedAt).toISOString() } : {}),
      payload: { ...(editor.videoUrl ? { videoUrl: editor.videoUrl } : {}), ...(editor.videoPath ? { videoPath: editor.videoPath } : {}), ...(editor.videoCaption ? { videoCaption: editor.videoCaption } : {}) },
    } }),
    onSuccess: () => { toast.success(editor.id ? "Content updated" : "Content created"); setEditor(emptyEditor); refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveEntry({ data: { id } }),
    onSuccess: () => { toast.success("Content archived"); setEditor(emptyEditor); refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const restoreMutation = useMutation({ mutationFn: (id: string) => restoreEntry({ data: { id } }), onSuccess: () => { toast.success("Content restored as a draft"); setEditor(emptyEditor); refresh(); }, onError: (error) => toast.error(error.message) });
  const deleteMutation = useMutation({ mutationFn: (id: string) => deleteEntry({ data: { id } }), onSuccess: () => { toast.success("Content permanently deleted"); setEditor(emptyEditor); refresh(); }, onError: (error) => toast.error(error.message) });

  const entries = useMemo(() => (workspace.data?.entries ?? []).filter((entry) => (area === "all" || entry.content_type === area) && `${entry.title} ${entry.content_type} ${entry.slug}`.toLowerCase().includes(query.toLowerCase())), [workspace.data?.entries, query, area]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/login", replace: true });
  }

  if (access.isPending || (can("content") && workspace.isPending)) return <AdminLoading />;
  if (access.isError) return <AdminDenied message={access.error.message} onSignOut={signOut} />;
  if (workspace.isError) return <AdminDenied message={workspace.error.message} onSignOut={signOut} />;

  return (
    <main className="min-h-[75vh] bg-admin-surface py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /><span className="text-xs font-bold uppercase">Protected workspace</span></div><h1 className="mt-2 font-display text-3xl font-bold">Website Content</h1><p className="mt-2 text-sm text-muted-foreground">Manage public content without exposing system credentials or private configuration.</p></div>
          <Button variant="outline" onClick={signOut}><LogOut /> Sign out</Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6 h-auto w-full justify-start overflow-x-auto bg-card p-1">
            <TabsTrigger value="overview"><LayoutDashboard /> Dashboard</TabsTrigger>
            {can("content") ? <TabsTrigger value="content"><FileText /> Content</TabsTrigger> : null}
            {can("translations") ? <TabsTrigger value="languages"><Languages /> Languages</TabsTrigger> : null}
            {can("social") ? <TabsTrigger value="social"><Share2 /> Social links</TabsTrigger> : null}
            {can("credentials") ? <TabsTrigger value="credentials"><BadgeCheck /> Credentials</TabsTrigger> : null}
            {can("members") ? <TabsTrigger value="members"><Users /> Members</TabsTrigger> : null}
            {can("notifications") ? <TabsTrigger value="notifications"><Bell /> Notifications</TabsTrigger> : null}
            {can("content") ? <TabsTrigger value="settings"><Settings /> Settings</TabsTrigger> : null}
            {can("umrah") ? <TabsTrigger value="umrah"><Plane /> Umrah</TabsTrigger> : null}
            {can("foundations") ? <TabsTrigger value="foundations"><HandHeart /> BK Foundations</TabsTrigger> : null}
            {can("content") ? <TabsTrigger value="media"><Image /> Media</TabsTrigger> : null}
            {can("content") ? <TabsTrigger value="audit"><History /> Audit log</TabsTrigger> : null}
          </TabsList>

          <TabsContent value="overview"><AdminOverview /></TabsContent>
          <TabsContent value="notifications"><AdminNotificationManager /></TabsContent>

          <TabsContent value="content">
            {workspace.data ? <CurrentSiteImporter entries={workspace.data.entries} media={workspace.data.media} onDone={refresh} /> : null}
            <div className="grid gap-6 lg:h-[calc(100dvh-7rem)] lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
              <section className="min-w-0 lg:flex lg:h-full lg:flex-col lg:overflow-hidden">
                <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row">
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
                <div className="overflow-hidden rounded-lg border border-border bg-card lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                  {entries.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">No content matches this view.</div> : entries.map((entry) => (
                    <button key={entry.id} type="button" onClick={() => setEditor({ id: entry.id, contentType: entry.content_type as EditorState["contentType"], slug: entry.slug, title: entry.title, summary: entry.summary ?? "", body: entry.body ?? "", imagePath: entry.image_path ?? "", imageAlt: entry.image_alt ?? "", category: entry.category ?? "", author: entry.author ?? "", tags: (entry.tags ?? []).join(", "), language: (entry.language as EditorState["language"]) ?? "en", gallery: (Array.isArray(entry.gallery) ? entry.gallery.filter((item): item is string => typeof item === "string") : []).join(", "), projectUrl: entry.project_url ?? "", completedOn: entry.completed_on ?? "", seoTitle: entry.seo_title ?? "", seoDescription: entry.seo_description ?? "", canonicalUrl: entry.canonical_url ?? "", ogTitle: entry.og_title ?? "", ogDescription: entry.og_description ?? "", ogImagePath: entry.og_image_path ?? "", status: entry.status, isEnabled: entry.is_enabled, isFeatured: entry.is_featured, sortOrder: entry.sort_order, scheduledFor: entry.scheduled_for ? entry.scheduled_for.slice(0, 16) : "", ...(() => { const p = (entry.payload && typeof entry.payload === "object" && !Array.isArray(entry.payload) ? entry.payload : {}) as Record<string, unknown>; return { videoUrl: typeof p["videoUrl"] === "string" ? p["videoUrl"] as string : "", videoPath: typeof p["videoPath"] === "string" ? p["videoPath"] as string : "", videoCaption: typeof p["videoCaption"] === "string" ? p["videoCaption"] as string : "" }; })(), publishedAt: entry.published_at ? entry.published_at.slice(0, 16) : "" })} className="grid w-full gap-2 border-b border-border p-4 text-left transition last:border-b-0 hover:bg-secondary/60 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <span className="min-w-0"><strong className="block truncate text-sm">{entry.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{entry.content_type.replaceAll("_", " ")} · Updated {new Date(entry.updated_at).toLocaleDateString()}</span></span>
                      <Badge variant={entry.status === "published" ? "default" : "secondary"}>{entry.status}</Badge>
                    </button>
                  ))}
                </div>
              </section>
              <ContentEditor editor={editor} setEditor={setEditor} saving={saveMutation.isPending} onSave={() => saveMutation.mutate()} onArchive={editor.id && editor.status !== "archived" ? () => archiveMutation.mutate(editor.id as string) : undefined} onRestore={editor.id && editor.status === "archived" ? () => restoreMutation.mutate(editor.id as string) : undefined} onDelete={editor.id && editor.status === "archived" ? () => deleteMutation.mutate(editor.id as string) : undefined} />
            </div>
          </TabsContent>
          <TabsContent value="settings">{workspace.data?.settings ? <SettingsEditor settings={workspace.data.settings} onSave={async (data) => { try { await saveSettings({ data }); toast.success("Website settings updated"); refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "Settings could not be saved"); } }} /> : <EmptyState text="Website settings are unavailable." />}</TabsContent>
          <TabsContent value="languages"><AdminTranslationManager /></TabsContent>
          <TabsContent value="social"><AdminSocialManager /></TabsContent>
          <TabsContent value="credentials"><AdminCredentialManager entries={(workspace.data?.entries ?? []).filter((entry) => entry.content_type === "business" && entry.category === "company_credential")} onChanged={refresh} /></TabsContent>
          <TabsContent value="umrah"><AdminUmrahManager /></TabsContent>
          <TabsContent value="foundations"><AdminFoundationManager /></TabsContent>
          <TabsContent value="media"><MediaLibrary media={workspace.data?.media ?? []} registerMedia={registerMedia} onChanged={refresh} /></TabsContent>
          <TabsContent value="members">{can("members") ? <MembersManager isSuperAdmin={Boolean(access.data?.isSuperAdmin)} /> : null}</TabsContent>
          <TabsContent value="audit"><AuditLog rows={workspace.data?.audit ?? []} /></TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function ContentEditor({ editor, setEditor, saving, onSave, onArchive, onRestore, onDelete }: { editor: EditorState; setEditor: (value: EditorState) => void; saving: boolean; onSave: () => void; onArchive?: (() => void) | undefined; onRestore?: (() => void) | undefined; onDelete?: (() => void) | undefined }) {
  const [showPreview, setShowPreview] = useState(false);
  const update = <K extends keyof EditorState>(key: K, value: EditorState[K]) => setEditor({ ...editor, [key]: value });
  return <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:overscroll-contain"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-lg font-bold">{editor.id ? "Edit content" : "New content"}</h2><Badge variant="outline">{editor.status}</Badge></div><div className="grid gap-4">
    <Field label="Content area"><Select value={editor.contentType} onValueChange={(value) => update("contentType", value as EditorState["contentType"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{contentTypes.map((type) => <SelectItem key={type} value={type}>{type.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field>
    <Field label="Title"><Input value={editor.title} maxLength={200} onChange={(event) => update("title", event.target.value)} /></Field>
    <Field label="URL name"><Input value={editor.slug} maxLength={160} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" onChange={(event) => update("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /></Field>
    <Field label="Short description"><Textarea value={editor.summary} maxLength={1000} onChange={(event) => update("summary", event.target.value)} /></Field>
    <Field label="Full content"><Textarea className="min-h-32" value={editor.body} maxLength={20000} onChange={(event) => update("body", event.target.value)} /></Field>
    <p className="text-xs text-muted-foreground">Special pages: CV = area “about”, address “professional-cv”. Privacy / Terms / Refund = area “footer”, address “privacy-policy”, “terms-of-use” or “refund-policy”. Published text replaces the built-in wording.</p>
    <div className="grid grid-cols-2 gap-3"><Field label="Status"><Select value={editor.status} onValueChange={(value) => update("status", value as ContentStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["draft", "published", "unpublished", "archived"].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field><Field label="Order"><Input type="number" value={editor.sortOrder} onChange={(event) => update("sortOrder", Number(event.target.value))} /></Field></div>
    <Field label="Schedule (optional)"><Input type="datetime-local" value={editor.scheduledFor} onChange={(event) => update("scheduledFor", event.target.value)} /></Field>
    <div className="grid grid-cols-2 gap-3">
      <Field label="Category"><Input value={editor.category} maxLength={120} onChange={(event) => update("category", event.target.value)} /></Field>
      <Field label="Language"><Select value={editor.language} onValueChange={(value) => update("language", value as EditorState["language"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{languages.map((item) => <SelectItem key={item.code} value={item.code}>{item.flag} {item.nativeLabel}</SelectItem>)}</SelectContent></Select></Field>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Field label="Author"><Input value={editor.author} maxLength={120} onChange={(event) => update("author", event.target.value)} /></Field>
      <Field label="Completion date"><Input type="date" value={editor.completedOn} onChange={(event) => update("completedOn", event.target.value)} /></Field>
    </div>
    <Field label="Tags / tools (comma separated)"><Input value={editor.tags} onChange={(event) => update("tags", event.target.value)} /></Field>
    <MediaUploadField label="Main image" kind="image" value={editor.imagePath} onChange={(path) => update("imagePath", path)} />
    {editor.contentType === "homepage" ? <p className="text-xs text-muted-foreground">Homepage hero slides use addresses hero-feature-1 through hero-feature-4 and category hero_carousel. Quick-navigation cards use addresses quick-nav-home, quick-nav-services, quick-nav-umrah, quick-nav-projects, quick-nav-blog, quick-nav-foundation, quick-nav-community and quick-nav-cv with category quick_navigation. Use Order to reorder; publish/unpublish or the visibility switch to show/hide; replace or remove the Main image below.</p> : null}
    <Field label="Image description (alt text)"><Input value={editor.imageAlt} maxLength={300} onChange={(event) => update("imageAlt", event.target.value)} /></Field>
    <GalleryPicker value={editor.gallery} onChange={(value) => update("gallery", value)} />
    <div className="rounded-lg border border-dashed border-border p-4"><p className="mb-3 text-xs font-bold uppercase text-muted-foreground">Video</p><div className="grid gap-3">
      <Field label="Video link (YouTube, Vimeo or https video file)"><Input value={editor.videoUrl} maxLength={500} placeholder="https://" onChange={(event) => update("videoUrl", event.target.value)} /></Field>
      <MediaUploadField label="Uploaded video (up to 50 MB)" kind="video" value={editor.videoPath} onChange={(path) => update("videoPath", path)} />
      <Field label="Caption / information below the video"><Textarea value={editor.videoCaption} maxLength={2000} onChange={(event) => update("videoCaption", event.target.value)} /></Field>
      <p className="text-xs text-muted-foreground">Remove both to take the video off the page. Upload a new file to replace it.</p>
    </div></div>
    <Field label="Publication date (optional)"><Input type="datetime-local" value={editor.publishedAt} onChange={(event) => update("publishedAt", event.target.value)} /></Field>
    <Field label="Project link (optional)"><Input value={editor.projectUrl} maxLength={500} placeholder="https://" onChange={(event) => update("projectUrl", event.target.value)} /></Field>
    <div className="rounded-lg border border-dashed border-border p-4">
      <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">Search &amp; social</p>
      <div className="grid gap-3">
        <Field label="Search title (optional)"><Input value={editor.seoTitle} maxLength={180} onChange={(event) => update("seoTitle", event.target.value)} /></Field>
        <Field label="Meta description (optional)"><Textarea value={editor.seoDescription} maxLength={400} onChange={(event) => update("seoDescription", event.target.value)} /></Field>
        <Field label="Canonical link (optional)"><Input value={editor.canonicalUrl} maxLength={500} placeholder="https://" onChange={(event) => update("canonicalUrl", event.target.value)} /></Field>
        <Field label="Social title (optional)"><Input value={editor.ogTitle} maxLength={180} onChange={(event) => update("ogTitle", event.target.value)} /></Field>
        <Field label="Social description (optional)"><Textarea value={editor.ogDescription} maxLength={400} onChange={(event) => update("ogDescription", event.target.value)} /></Field>
        <MediaUploadField label="Social share image (optional)" kind="image" value={editor.ogImagePath} onChange={(path) => update("ogImagePath", path)} />
        <p className="text-xs text-muted-foreground">Left empty, the page title, short description and main image are used automatically.</p>
      </div>
    </div>
    <label className="flex items-center justify-between text-sm"><span>Visible when published</span><Switch checked={editor.isEnabled} onCheckedChange={(checked) => update("isEnabled", checked)} /></label>
    <label className="flex items-center justify-between text-sm"><span>Featured content</span><Switch checked={editor.isFeatured} onCheckedChange={(checked) => update("isFeatured", checked)} /></label>
    <Button variant="outline" onClick={() => setShowPreview(!showPreview)}><Eye /> {showPreview ? "Hide draft preview" : "Preview draft"}</Button>
    {showPreview && <article className="rounded-lg border border-border bg-secondary p-4"><Badge variant="outline">{editor.status}</Badge><h3 className="mt-3 font-display text-xl font-bold">{editor.title || "Untitled content"}</h3>{editor.summary && <p className="mt-2 text-sm font-medium">{editor.summary}</p>}{editor.body && <div className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{editor.body}</div>}</article>}
    {editor.slug && previewPath(editor) && editor.status === "published" && <a href={previewPath(editor) as string} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">Open published page</a>}
    <Button disabled={saving || !editor.title || !editor.slug} onClick={onSave}><Save /> {saving ? "Saving…" : "Save content"}</Button>
    {onArchive && <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive"><Archive /> Archive item</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure you want to archive this?</AlertDialogTitle><AlertDialogDescription>The item will leave the public website. Its history remains available for restoration.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onArchive}>Archive</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
    {onRestore && <Button variant="outline" onClick={onRestore}><RotateCcw /> Restore as draft</Button>}
    {onDelete && <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive"><Trash2 /> Permanently delete</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Permanently delete this archived item?</AlertDialogTitle><AlertDialogDescription>This Super Admin action cannot be undone. Use restore if the content may be needed later.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete}>Delete permanently</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
  </div></aside>;
}

type SettingsRow = NonNullable<Awaited<ReturnType<typeof getAdminWorkspace>>["settings"]>;
function SettingsEditor({ settings, onSave }: { settings: SettingsRow; onSave: (data: { id: string; websiteName: string; companyName: string; location: string; globalStatus: string; contactEmail: string; phone: string; whatsapp: string; footerContent: string; defaultLanguage: LanguageCode; seoTitle: string; seoDescription: string; googleSearchCx: string; profileImagePath: string; enabledLanguages: LanguageCode[] }) => Promise<void> }) {
  const config = settings.social_links && typeof settings.social_links === "object" && !Array.isArray(settings.social_links) ? settings.social_links as Record<string, unknown> : {};
  const initialEnabled = Array.isArray(config["enabledLanguages"]) ? config["enabledLanguages"].filter((code): code is LanguageCode => languages.some((item) => item.code === code)) : languages.map((item) => item.code);
  const [form, setForm] = useState({ id: settings.id, websiteName: settings.website_name, companyName: settings.company_name, location: settings.location, globalStatus: settings.global_status, contactEmail: settings.contact_email ?? "", phone: settings.phone ?? "", whatsapp: settings.whatsapp ?? "", footerContent: settings.footer_content, defaultLanguage: settings.default_language as LanguageCode, seoTitle: settings.seo_title, seoDescription: settings.seo_description, googleSearchCx: typeof config["googleSearchCx"] === "string" ? config["googleSearchCx"] : "", profileImagePath: settings.profile_image_path ?? "", enabledLanguages: initialEnabled });
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); await onSave({ ...form, enabledLanguages: ["en", "ar", "ha", ...form.enabledLanguages.filter((code) => !languages.find((item) => item.code === code)?.primary)] }); setBusy(false); }
  return <form onSubmit={submit} className="mx-auto grid max-w-3xl gap-5 rounded-lg border border-border bg-card p-6"><div><h2 className="font-display text-xl font-bold">Website settings</h2><p className="mt-1 text-sm text-muted-foreground">Content settings only. Credentials and service configuration are never exposed here.</p></div><div className="grid gap-4 sm:grid-cols-2">
    <Field label="Website name"><Input value={form.websiteName} maxLength={120} onChange={(e) => setForm({ ...form, websiteName: e.target.value })} /></Field><Field label="Company name"><Input value={form.companyName} maxLength={160} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></Field>
    <Field label="Location"><Input value={form.location} maxLength={160} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field><Field label="Global status"><Input value={form.globalStatus} maxLength={160} onChange={(e) => setForm({ ...form, globalStatus: e.target.value })} /></Field>
    <Field label="Contact email"><Input type="email" value={form.contactEmail} maxLength={254} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></Field><Field label="Phone"><Input value={form.phone} maxLength={40} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
    <Field label="WhatsApp"><Input value={form.whatsapp} maxLength={40} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field><Field label="Default language"><Select value={form.defaultLanguage} onValueChange={(value) => setForm({ ...form, defaultLanguage: value as LanguageCode })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{languages.map((item) => <SelectItem key={item.code} value={item.code}>{item.flag} {item.nativeLabel}</SelectItem>)}</SelectContent></Select></Field>
  </div><fieldset className="grid gap-3 rounded-lg border border-border p-4"><legend className="px-2 text-sm font-semibold">Available website languages</legend><p className="text-xs text-muted-foreground">English, Arabic and Hausa stay visible in the header. Enable or disable additional languages below.</p><div className="grid gap-3 sm:grid-cols-2">{languages.map((item) => { const required = item.primary; const checked = required || form.enabledLanguages.includes(item.code); return <label key={item.code} className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm"><span>{item.flag} {item.nativeLabel}</span><Switch checked={checked} disabled={required} onCheckedChange={(next) => setForm({ ...form, enabledLanguages: next ? [...new Set([...form.enabledLanguages, item.code])] : form.enabledLanguages.filter((code) => code !== item.code) })} /></label>; })}</div></fieldset><MediaUploadField label="Blog author profile photo" kind="image" value={form.profileImagePath} onChange={(profileImagePath) => setForm({ ...form, profileImagePath })} hint="Shown beside the author name on blog cards. Upload, replace or remove it here, then save settings." /><Field label="Footer statement"><Textarea value={form.footerContent} maxLength={500} onChange={(e) => setForm({ ...form, footerContent: e.target.value })} /></Field><Field label="SEO title"><Input value={form.seoTitle} maxLength={180} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} /></Field><Field label="SEO description"><Textarea value={form.seoDescription} maxLength={500} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} /></Field><div className="rounded-lg border border-border p-4"><p className="text-xs font-bold uppercase text-primary">Search provider</p><div className="mt-1 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">Google Programmable Search Engine (default web search)</p><Badge variant={form.googleSearchCx.trim() ? "default" : "secondary"}>{form.googleSearchCx.trim() ? "Configured" : "Not configured"}</Badge></div><div className="mt-3"><Field label="Search Engine ID / CX"><Input value={form.googleSearchCx} maxLength={200} placeholder="e.g. 0123456789abcdef0" onChange={(e) => setForm({ ...form, googleSearchCx: e.target.value })} /></Field></div><SearchConfigTest cx={form.googleSearchCx} /><p className="mt-2 text-xs text-muted-foreground">Create a search engine at programmablesearchengine.google.com, copy its Search engine ID here, test it, then save. Site Search works independently.</p></div><Button type="submit" disabled={busy}><Save /> {busy ? "Saving…" : "Save settings"}</Button></form>;
}

function AuditLog({ rows }: { rows: Awaited<ReturnType<typeof getAdminWorkspace>>["audit"] }) { return <div className="overflow-hidden rounded-lg border border-border bg-card">{rows.length === 0 ? <EmptyState text="No administrator actions recorded yet." /> : rows.map((row) => <div key={row.id} className="grid gap-2 border-b border-border p-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto]"><div><strong className="text-sm capitalize">{row.action}</strong><p className="mt-1 text-xs text-muted-foreground">{row.content_type.replaceAll("_", " ")}{row.content_label ? ` · ${row.content_label}` : ""}</p></div><time className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</time></div>)}</div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="grid min-w-0 gap-1.5"><Label asChild><span>{label}</span></Label>{children}</label>; }
function EmptyState({ text }: { text: string }) { return <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">{text}</div>; }
function AdminLoading() { return <main className="mx-auto grid min-h-[70vh] max-w-7xl gap-5 px-4 py-10"><Skeleton className="h-20 w-full" /><div className="grid gap-5 lg:grid-cols-[1fr_390px]"><Skeleton className="h-96" /><Skeleton className="h-96" /></div></main>; }
function AdminDenied({ message, onSignOut }: { message: string; onSignOut: () => void }) { return <main className="grid min-h-[70vh] place-items-center px-4"><div className="max-w-md rounded-lg border border-border bg-card p-7 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-4 font-display text-2xl font-bold">Administrator access required</h1><p className="mt-3 text-sm text-muted-foreground">{message}</p><Button className="mt-6" variant="outline" onClick={onSignOut}>Sign out</Button></div></main>; }
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
