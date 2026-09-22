import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { platformLabels, socialIcons } from "@/components/social-icons";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { deleteSocialLink, listSocialLinks, saveSocialLink, socialPlatforms, type SocialPlatform } from "@/lib/social.functions";

type FormState = { id?: string; platform: SocialPlatform; url: string; displayLabel: string; isEnabled: boolean; sortOrder: number };
const emptyForm: FormState = { platform: "linkedin", url: "", displayLabel: "", isEnabled: true, sortOrder: 0 };

const placeholders: Record<SocialPlatform, string> = {
  linkedin: "https://www.linkedin.com/company/…",
  whatsapp: "https://wa.me/234…",
  facebook: "https://www.facebook.com/…",
  tiktok: "https://www.tiktok.com/@…",
  youtube: "https://www.youtube.com/@…",
  instagram: "https://www.instagram.com/…",
  x: "https://x.com/…",
  telegram: "https://t.me/…",
};

export function AdminSocialManager() {
  const queryClient = useQueryClient();
  const load = useServerFn(listSocialLinks);
  const save = useServerFn(saveSocialLink);
  const remove = useServerFn(deleteSocialLink);
  const [form, setForm] = useState<FormState>(emptyForm);

  const links = useQuery({ queryKey: ["admin-social-links"], queryFn: () => load() });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-social-links"] });
    void queryClient.invalidateQueries({ queryKey: ["public-social-links"] });
  };

  const saveMutation = useMutation({
    mutationFn: (value: FormState) =>
      save({ data: { ...(value.id ? { id: value.id } : {}), platform: value.platform, url: value.url, displayLabel: value.displayLabel || platformLabels[value.platform] || value.platform, isEnabled: value.isEnabled, sortOrder: value.sortOrder } }),
    onSuccess: () => { toast.success("Social link saved"); setForm(emptyForm); refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Social link removed"); setForm(emptyForm); refresh(); },
    onError: (error) => toast.error(error.message),
  });

  if (links.isPending) return <Skeleton className="h-72 w-full" />;
  if (links.isError) return <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">{links.error.message}</p>;

  const rows = links.data ?? [];
  const used = new Set(rows.map((row) => row.platform));

  function moveRow(index: number, direction: -1 | 1) {
    const current = rows[index];
    const swap = rows[index + direction];
    if (!current || !swap) return;
    saveMutation.mutate({ id: current.id, platform: current.platform as SocialPlatform, url: current.url, displayLabel: current.display_label, isEnabled: current.is_enabled, sortOrder: swap.sort_order });
    save({ data: { id: swap.id, platform: swap.platform as SocialPlatform, url: swap.url, displayLabel: swap.display_label, isEnabled: swap.is_enabled, sortOrder: current.sort_order } })
      .then(refresh)
      .catch((error: Error) => toast.error(error.message));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Only enabled links appear on the public website.</p>
          <Button size="sm" onClick={() => setForm(emptyForm)}><Plus /> New link</Button>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {rows.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No social links added yet.</p>
          ) : rows.map((row, index) => {
            const Icon = socialIcons[row.platform];
            return (
              <div key={row.id} className="grid gap-3 border-b border-border p-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-3 text-left"
                  onClick={() => setForm({ id: row.id, platform: row.platform as SocialPlatform, url: row.url, displayLabel: row.display_label, isEnabled: row.is_enabled, sortOrder: row.sort_order })}
                >
                  {Icon ? <span className="text-primary"><Icon className="h-5 w-5" /></span> : null}
                  <span className="min-w-0">
                    <strong className="block truncate text-sm">{row.display_label || platformLabels[row.platform] || row.platform}</strong>
                    <span className="block truncate text-xs text-muted-foreground">{row.url}</span>
                  </span>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={row.is_enabled ? "default" : "secondary"}>{row.is_enabled ? "Enabled" : "Disabled"}</Badge>
                  <a href={row.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border" aria-label={`Open ${row.platform} link`}><ExternalLink className="h-4 w-4" /></a>
                  <Button size="icon" variant="outline" className="h-8 w-8" disabled={index === 0} onClick={() => moveRow(index, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="outline" className="h-8 w-8" disabled={index === rows.length - 1} onClick={() => moveRow(index, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
                  <Switch checked={row.is_enabled} aria-label={`Show ${row.platform} publicly`} onCheckedChange={(checked) => saveMutation.mutate({ id: row.id, platform: row.platform as SocialPlatform, url: row.url, displayLabel: row.display_label, isEnabled: checked, sortOrder: row.sort_order })} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="icon" variant="destructive" className="h-8 w-8" aria-label="Remove link"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Remove this social link?</AlertDialogTitle><AlertDialogDescription>It will disappear from the public website immediately.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(row.id)}>Remove</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
        <h3 className="mb-4 font-display text-lg font-bold">{form.id ? "Edit social link" : "Add social link"}</h3>
        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <Label asChild><span>Platform</span></Label>
            <Select value={form.platform} onValueChange={(value) => setForm({ ...form, platform: value as SocialPlatform })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {socialPlatforms.map((platform) => (
                  <SelectItem key={platform} value={platform} disabled={!form.id && used.has(platform)}>{platformLabels[platform] ?? platform}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-1.5">
            <Label asChild><span>Web address</span></Label>
            <Input value={form.url} maxLength={500} placeholder={placeholders[form.platform]} onChange={(event) => setForm({ ...form, url: event.target.value })} />
          </label>
          <label className="grid gap-1.5">
            <Label asChild><span>Label shown to visitors</span></Label>
            <Input value={form.displayLabel} maxLength={60} placeholder={platformLabels[form.platform] ?? form.platform} onChange={(event) => setForm({ ...form, displayLabel: event.target.value })} />
          </label>
          <label className="grid gap-1.5">
            <Label asChild><span>Order</span></Label>
            <Input type="number" min={0} max={999} value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} />
          </label>
          <label className="flex items-center justify-between text-sm"><span>Show on the public website</span><Switch checked={form.isEnabled} onCheckedChange={(checked) => setForm({ ...form, isEnabled: checked })} /></label>
          <Button disabled={!form.url || saveMutation.isPending} onClick={() => saveMutation.mutate(form)}><Save /> {saveMutation.isPending ? "Saving…" : "Save link"}</Button>
          {form.id ? <Button variant="outline" onClick={() => setForm(emptyForm)}>Cancel edit</Button> : null}
        </div>
      </aside>
    </div>
  );
}
