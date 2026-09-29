import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Send, Trash2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteNotificationDraft,
  listNotificationMembers,
  listNotificationMessages,
  notificationCategories,
  publishNotification,
  saveNotificationDraft,
  type NotificationCategory,
} from "@/lib/notifications.functions";

const categoryLabels: Record<NotificationCategory, string> = {
  system: "System",
  umrah: "Umrah",
  foundation: "BK Foundations",
  account: "Account",
  announcement: "Announcement",
};

type DraftState = {
  id?: string;
  title: string;
  body: string;
  category: NotificationCategory;
  linkPath: string;
};

const emptyDraft: DraftState = { title: "", body: "", category: "announcement", linkPath: "" };

export function AdminNotificationManager() {
  const queryClient = useQueryClient();
  const loadMessages = useServerFn(listNotificationMessages);
  const loadMembers = useServerFn(listNotificationMembers);
  const saveDraft = useServerFn(saveNotificationDraft);
  const publish = useServerFn(publishNotification);
  const removeDraft = useServerFn(deleteNotificationDraft);

  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [audience, setAudience] = useState<"all" | "active" | "umrah_active" | "selected">("active");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string; published: boolean } | null>(null);

  const messages = useQuery({ queryKey: ["admin-notifications"], queryFn: () => loadMessages() });
  const members = useQuery({
    queryKey: ["admin-notification-members", search],
    queryFn: () => loadMembers({ data: { search } }),
    enabled: audience === "selected",
  });
  const editingPublished = Boolean(draft.id && messages.data?.messages.find((m) => m.id === draft.id)?.status === "published");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });

  const saveMutation = useMutation({
    mutationFn: () =>
      saveDraft({
        data: {
          ...(draft.id ? { id: draft.id } : {}),
          title: draft.title,
          body: draft.body,
          category: draft.category,
          linkPath: draft.linkPath,
        },
      }),
    onSuccess: (result) => { toast.success(editingPublished ? "Notification updated" : "Draft saved"); setDraft((state) => ({ ...state, id: result.id })); refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => publish({ data: { id, audience, memberIds: selected } }),
    onSuccess: (result) => { toast.success(`Notification sent to ${result.sent} member(s).`); setDraft(emptyDraft); setSelected([]); refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeDraft({ data: { id } }),
    onSuccess: () => { toast.success("Notification deleted"); setDraft(emptyDraft); setPendingDelete(null); refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    await saveMutation.mutateAsync();
  }

  async function saveAndSend() {
    try {
      const saved = await saveMutation.mutateAsync();
      await publishMutation.mutateAsync(saved.id);
    } catch {
      /* errors already surfaced by the mutations */
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <section className="min-w-0">
        <h2 className="font-display text-xl font-bold">Notifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">Drafts can be edited; published notifications are permanent records.</p>
        <div className="mt-4 grid gap-3">
          {messages.isPending ? (
            Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-xl" />)
          ) : messages.isError ? (
            <p className="text-sm text-muted-foreground">{messages.error.message}</p>
          ) : messages.data.messages.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">No notifications created yet.</p>
          ) : (
            messages.data.messages.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription>
                        {categoryLabels[item.category as NotificationCategory] ?? item.category} ·{" "}
                        {new Date(item.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge variant={item.status === "published" ? "default" : "secondary"}>{item.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                  <p className="text-xs text-muted-foreground">
                    {item.status === "published"
                      ? `${item.recipients} recipient(s) · ${item.read} read`
                      : "Not sent yet"}
                  </p>
                  {(
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setDraft({ id: item.id, title: item.title, body: item.body ?? "", category: item.category as NotificationCategory, linkPath: item.link_path ?? "" })}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setPendingDelete({ id: item.id, title: item.title, published: item.status === "published" })}><Trash2 /> Delete</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <form onSubmit={submit} className="grid h-fit gap-5 rounded-lg border border-border bg-card p-6">
        <div>
          <h3 className="font-display text-lg font-bold">{draft.id ? (editingPublished ? "Edit sent notification" : "Edit draft") : "New notification"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Members see this in their dashboard. Every action is recorded in the audit log.</p>
        </div>
        <Field label="Title"><Input value={draft.title} maxLength={160} required onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></Field>
        <Field label="Message"><Textarea className="min-h-28" maxLength={2000} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></Field>
        <Field label="Type">
          <Select value={draft.category} onValueChange={(value) => setDraft({ ...draft, category: value as NotificationCategory })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {notificationCategories.map((item) => <SelectItem key={item} value={item}>{categoryLabels[item]}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Link to a page (optional)">
          <Input value={draft.linkPath} placeholder="/foundation" maxLength={200} onChange={(event) => setDraft({ ...draft, linkPath: event.target.value })} />
        </Field>
        {editingPublished ? <p className="rounded-md bg-secondary p-3 text-xs text-muted-foreground">Already sent. Saving updates the text members see; it does not send it again.</p> : null}
        {editingPublished ? null : <Field label="Send to">
          <Select value={audience} onValueChange={(value) => setAudience(value as typeof audience)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active members</SelectItem>
              <SelectItem value="umrah_active">Active Umrah goal members</SelectItem>
              <SelectItem value="all">All members</SelectItem>
              <SelectItem value="selected">Selected members</SelectItem>
            </SelectContent>
          </Select>
        </Field>}

        {audience === "selected" && !editingPublished ? (
          <div className="grid gap-2">
            <Input value={search} placeholder="Search members" aria-label="Search members" onChange={(event) => setSearch(event.target.value)} />
            <div className="max-h-56 overflow-y-auto rounded-md border border-border p-2">
              {members.isPending ? (
                <Skeleton className="h-20 w-full" />
              ) : (members.data?.members.length ?? 0) === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No members found.</p>
              ) : (
                members.data?.members.map((member) => (
                  <label key={member.id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-secondary">
                    <Checkbox
                      checked={selected.includes(member.id)}
                      onCheckedChange={(checked) =>
                        setSelected((current) => (checked ? [...current, member.id] : current.filter((id) => id !== member.id)))
                      }
                    />
                    <span className="min-w-0 text-sm">
                      <span className="block truncate font-medium">{member.full_name || member.email}</span>
                      <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">{selected.length} member(s) selected</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="outline" disabled={saveMutation.isPending || draft.title.trim().length < 2}>
            {saveMutation.isPending ? "Saving…" : editingPublished ? "Save changes" : "Save draft"}
          </Button>
          {editingPublished ? null : <Button type="button" disabled={publishMutation.isPending || draft.title.trim().length < 2} onClick={saveAndSend}>
            <Send /> {publishMutation.isPending ? "Sending…" : "Publish & send"}
          </Button>}
          {draft.id ? <Button type="button" variant="ghost" onClick={() => setDraft(emptyDraft)}><Bell /> New</Button> : null}
        </div>
      </form>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this notification?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.title}" will be permanently deleted
              {pendingDelete?.published ? " and removed from every member's inbox" : ""}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending} onClick={(event) => { event.preventDefault(); if (pendingDelete) deleteMutation.mutate(pendingDelete.id); }}>
              {deleteMutation.isPending ? "Deleting…" : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
