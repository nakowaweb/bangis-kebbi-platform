import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Archive, Eye, EyeOff, Image as ImageIcon, Plus, Save, Send, Trash2, Upload } from "lucide-react";
import { cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  FOUNDATION_MAX_BYTES,
  FOUNDATION_MEDIA_BUCKET,
  deleteFoundationUpdate,
  foundationAcceptedMimeTypes,
  foundationCategories,
  foundationCategoryLabels,
  foundationStatusLabels,
  foundationStatuses,
  listFoundationProjects,
  listFoundationUpdates,
  saveFoundationProject,
  saveFoundationUpdate,
  setFoundationProjectState,
  type FoundationProject,
  type FoundationStatus,
} from "@/lib/foundation.functions";

type EditorState = {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  location: string;
  imagePath: string;
  media: { path: string; caption: string }[];
  startDate: string;
  endDate: string;
  status: FoundationStatus;
  isPublished: boolean;
  sortOrder: number;
};

const emptyEditor: EditorState = {
  slug: "",
  title: "",
  summary: "",
  description: "",
  category: "community_support",
  location: "",
  imagePath: "",
  media: [],
  startDate: "",
  endDate: "",
  status: "planned",
  isPublished: false,
  sortOrder: 0,
};

export function AdminFoundationManager() {
  const queryClient = useQueryClient();
  const fetchProjects = useServerFn(listFoundationProjects);
  const saveProject = useServerFn(saveFoundationProject);
  const setState = useServerFn(setFoundationProjectState);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | FoundationStatus>("all");
  const [editor, setEditor] = useState<EditorState>(emptyEditor);

  const projects = useQuery({
    queryKey: ["admin-foundation", search, status],
    queryFn: () => fetchProjects({ data: { search, status } }),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-foundation"] });

  const saveMutation = useMutation({
    mutationFn: () =>
      saveProject({
        data: {
          ...(editor.id ? { id: editor.id } : {}),
          slug: editor.slug,
          title: editor.title,
          summary: editor.summary,
          description: editor.description,
          category: editor.category,
          location: editor.location,
          imagePath: editor.imagePath,
          media: editor.media,
          startDate: editor.startDate,
          endDate: editor.endDate,
          status: editor.status,
          isPublished: editor.isPublished,
          sortOrder: editor.sortOrder,
        },
      }),
    onSuccess: () => {
      toast.success(editor.id ? "Project updated" : "Project created");
      setEditor(emptyEditor);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function changeState(id: string, patch: { status?: FoundationStatus; isPublished?: boolean }, message: string) {
    try {
      await setState({ data: { id, ...patch } });
      toast.success(message);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The change could not be saved");
    }
  }

  const rows = (projects.data?.projects ?? []) as FoundationProject[];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <section className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search foundation projects" aria-label="Search foundation projects" />
          <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
            <SelectTrigger className="sm:w-48" aria-label="Filter by project stage"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {foundationStatuses.map((item) => <SelectItem key={item} value={item}>{foundationStatusLabels[item]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setEditor(emptyEditor)}><Plus /> New project</Button>
        </div>

        {projects.isPending ? <Skeleton className="h-64 w-full" /> : projects.isError ? (
          <Empty text={projects.error.message} />
        ) : rows.length === 0 ? (
          <Empty text="No foundation projects match this view." />
        ) : (
          <div className="grid gap-3">
            {rows.map((project) => (
              <article key={project.id} className="grid gap-3 rounded-lg border border-border bg-card p-4 lg:grid-cols-[88px_minmax(0,1fr)_auto] lg:items-center">
                <div className="h-16 w-full overflow-hidden rounded-md bg-secondary lg:w-[88px]">
                  {project.image_url ? <img src={project.image_url} alt="" className="h-16 w-full object-cover" /> : <div className="grid h-16 place-items-center text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>}
                </div>
                <div className="min-w-0">
                  <strong className="block truncate text-sm">{project.title}</strong>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {foundationCategoryLabels[project.category] ?? project.category}
                    {project.location ? ` · ${project.location}` : ""} · Updated {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="outline">{foundationStatusLabels[project.status]}</Badge>
                    <Badge variant={project.is_published ? "default" : "secondary"}>{project.is_published ? "Published" : "Not published"}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditor({
                    id: project.id,
                    slug: project.slug,
                    title: project.title,
                    summary: project.summary ?? "",
                    description: project.description ?? "",
                    category: project.category,
                    location: project.location ?? "",
                    imagePath: project.image_path ?? "",
                    media: project.media_items.map((item) => ({ path: item.path, caption: item.caption })),
                    startDate: project.start_date ?? "",
                    endDate: project.end_date ?? "",
                    status: project.status,
                    isPublished: project.is_published,
                    sortOrder: project.sort_order,
                  })}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => changeState(project.id, { isPublished: !project.is_published }, project.is_published ? "Project unpublished" : "Project published")} disabled={project.status === "archived"}>
                    {project.is_published ? <><EyeOff /> Unpublish</> : <><Eye /> Publish</>}
                  </Button>
                  {project.status !== "archived" ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Archive /> Archive</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Archive this project?</AlertDialogTitle>
                          <AlertDialogDescription>It will be removed from the public website and unpublished. The record is kept and this action is recorded in the audit log.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => changeState(project.id, { status: "archived" }, "Project archived")}>Archive</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => changeState(project.id, { status: "planned" }, "Project restored")}>Restore</Button>
                  )}
                  <UpdatesDialog projectId={project.id} projectTitle={project.title} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ProjectEditor editor={editor} setEditor={setEditor} saving={saveMutation.isPending} onSave={() => saveMutation.mutate()} />
    </div>
  );
}

function ProjectEditor({ editor, setEditor, saving, onSave }: { editor: EditorState; setEditor: (value: EditorState) => void; saving: boolean; onSave: () => void }) {
  const [uploading, setUploading] = useState(false);
  const update = <K extends keyof EditorState>(key: K, value: EditorState[K]) => setEditor({ ...editor, [key]: value });

  async function uploadImage(file: File | undefined, target: "cover" | "gallery") {
    if (!file) return;
    if (!(foundationAcceptedMimeTypes as readonly string[]).includes(file.type)) {
      toast.error("Choose a JPG, PNG, WEBP or AVIF image.");
      return;
    }
    if (file.size > FOUNDATION_MAX_BYTES) {
      toast.error("Images must be 10 MB or smaller.");
      return;
    }
    setUploading(true);
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
    const path = `${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from(FOUNDATION_MEDIA_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (target === "cover") setEditor({ ...editor, imagePath: path });
    else setEditor({ ...editor, media: [...editor.media, { path, caption: "" }].slice(0, 12) });
    toast.success("Image uploaded. Save the project to keep it.");
  }

  return (
    <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-sm xl:sticky xl:top-24">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{editor.id ? "Edit project" : "New project"}</h2>
        <Badge variant="outline">{foundationStatusLabels[editor.status]}</Badge>
      </div>
      <div className="grid gap-4">
        <Field label="Title"><Input value={editor.title} maxLength={200} onChange={(event) => update("title", event.target.value)} /></Field>
        <Field label="URL name"><Input value={editor.slug} maxLength={160} onChange={(event) => update("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /></Field>
        <Field label="Short summary"><Textarea value={editor.summary} maxLength={1000} onChange={(event) => update("summary", event.target.value)} /></Field>
        <Field label="Full description"><Textarea className="min-h-32" value={editor.description} maxLength={20000} onChange={(event) => update("description", event.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={editor.category} onValueChange={(value) => update("category", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{foundationCategories.map((item) => <SelectItem key={item} value={item}>{foundationCategoryLabels[item]}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Location"><Input value={editor.location} maxLength={160} onChange={(event) => update("location", event.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date"><Input type="date" value={editor.startDate} onChange={(event) => update("startDate", event.target.value)} /></Field>
          <Field label="End date"><Input type="date" value={editor.endDate} onChange={(event) => update("endDate", event.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Stage">
            <Select value={editor.status} onValueChange={(value) => update("status", value as FoundationStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{foundationStatuses.map((item) => <SelectItem key={item} value={item}>{foundationStatusLabels[item]}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Order"><Input type="number" value={editor.sortOrder} onChange={(event) => update("sortOrder", Number(event.target.value))} /></Field>
        </div>

        <Field label="Main project image">
          <Input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => uploadImage(event.target.files?.[0], "cover")} />
        </Field>
        {editor.imagePath ? (
          <p className="flex items-center justify-between gap-2 rounded-md border border-border bg-secondary p-2 text-xs">
            <span className="truncate">{editor.imagePath}</span>
            <Button size="sm" variant="ghost" onClick={() => update("imagePath", "")} aria-label="Remove main image"><Trash2 /></Button>
          </p>
        ) : null}

        <Field label="Additional media">
          <Input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => uploadImage(event.target.files?.[0], "gallery")} />
        </Field>
        {editor.media.map((item, index) => (
          <div key={item.path} className="grid gap-2 rounded-md border border-border bg-secondary p-2">
            <span className="truncate text-xs">{item.path}</span>
            <div className="flex gap-2">
              <Input value={item.caption} maxLength={200} placeholder="Caption (optional)" onChange={(event) => {
                const media = [...editor.media];
                media[index] = { path: item.path, caption: event.target.value };
                update("media", media);
              }} />
              <Button size="sm" variant="ghost" onClick={() => update("media", editor.media.filter((entry) => entry.path !== item.path))} aria-label="Remove media"><Trash2 /></Button>
            </div>
          </div>
        ))}

        <label className="flex items-center justify-between text-sm">
          <span>Published on the public website</span>
          <Switch checked={editor.isPublished} onCheckedChange={(checked) => update("isPublished", checked)} disabled={editor.status === "archived"} />
        </label>

        <Button disabled={saving || uploading || !editor.title || !editor.slug} onClick={onSave}>
          {uploading ? <><Upload /> Uploading…</> : <><Save /> {saving ? "Saving…" : "Save project"}</>}
        </Button>
        <p className="text-xs text-muted-foreground">BK Foundations content must stay focused on verified community needs, practical support, dignity and accountable updates.</p>
      </div>
    </aside>
  );
}

function UpdatesDialog({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const queryClient = useQueryClient();
  const fetchUpdates = useServerFn(listFoundationUpdates);
  const saveUpdate = useServerFn(saveFoundationUpdate);
  const removeUpdate = useServerFn(deleteFoundationUpdate);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [publish, setPublish] = useState(true);
  const [notify, setNotify] = useState(false);
  const [busy, setBusy] = useState(false);

  const updates = useQuery({
    queryKey: ["admin-foundation-updates", projectId],
    queryFn: () => fetchUpdates({ data: { projectId } }),
    enabled: open,
  });

  async function submit() {
    setBusy(true);
    try {
      const result = await saveUpdate({ data: { projectId, title, body, isPublished: publish, notifyMembers: notify } });
      toast.success(result.notified ? `Update saved and sent to ${result.notified} member(s).` : "Update saved");
      setTitle("");
      setBody("");
      setNotify(false);
      queryClient.invalidateQueries({ queryKey: ["admin-foundation-updates", projectId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The update could not be saved");
    }
    setBusy(false);
  }

  if (!open) return <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Updates</Button>;

  return (
    <div className="mt-3 w-full rounded-lg border border-border bg-secondary/60 p-4 lg:col-span-3">
      <div className="mb-3 flex items-center justify-between">
        <strong className="text-sm">Updates · {projectTitle}</strong>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
      </div>
      <div className="grid gap-3">
        <Input value={title} maxLength={200} placeholder="Update title" onChange={(event) => setTitle(event.target.value)} />
        <Textarea value={body} maxLength={5000} placeholder="What happened?" onChange={(event) => setBody(event.target.value)} />
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <label className="flex items-center gap-2"><Switch checked={publish} onCheckedChange={setPublish} /> Publish</label>
          <label className="flex items-center gap-2"><Switch checked={notify} onCheckedChange={setNotify} /> Notify active members</label>
          <Button size="sm" disabled={busy || title.trim().length < 2} onClick={submit}><Send /> {busy ? "Saving…" : "Save update"}</Button>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {updates.isPending ? <Skeleton className="h-16 w-full" /> : (updates.data?.updates ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No updates recorded for this project yet.</p>
        ) : (
          (updates.data?.updates ?? []).map((item: { id: string; title: string; body: string | null; is_published: boolean; created_at: string }) => (
            <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border border-border bg-card p-3">
              <div className="min-w-0">
                <strong className="block truncate text-sm">{item.title}</strong>
                <p className="text-xs text-muted-foreground">{item.is_published ? "Published" : "Draft"} · {new Date(item.created_at).toLocaleDateString()}</p>
              </div>
              <Button size="sm" variant="ghost" aria-label="Delete update" onClick={async () => {
                try {
                  await removeUpdate({ data: { id: item.id } });
                  toast.success("Update deleted");
                  queryClient.invalidateQueries({ queryKey: ["admin-foundation-updates", projectId] });
                } catch (error) { toast.error(error instanceof Error ? error.message : "Delete failed"); }
              }}><Trash2 /></Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {isValidElement(children) ? cloneElement(children as ReactElement<{ id?: string }>, { id }) : children}
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">{text}</div>;
}
