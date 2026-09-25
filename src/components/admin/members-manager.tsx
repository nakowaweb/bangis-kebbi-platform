import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { adminModules } from "@/lib/admin-access";
import {
  deleteMemberPermanently, listMembers, resetMemberPassword, setAdminPermissions,
  setMemberActive, setMemberRole, updateMemberProfile,
} from "@/lib/members.functions";

type Member = {
  id: string; full_name: string; email: string; phone: string | null; country: string | null; city: string | null;
  preferred_language: string; is_active: boolean; created_at: string; roles: string[]; modules: string[];
};

const roleOptions = ["content_manager", "support", "finance", "admin"] as const;
const errMsg = (e: unknown, f: string) => (e instanceof Error ? e.message : f);

export function MembersManager({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const fetchMembers = useServerFn(listMembers);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Member | null>(null);

  const members = useQuery({ queryKey: ["admin-members", search, status, page], queryFn: () => fetchMembers({ data: { search, status, page } }) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-members"] });

  if (members.isError) return <p className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">{members.error.message}</p>;
  const rows = (members.data?.members ?? []) as Member[];
  const total = members.data?.total ?? 0;
  const pageSize = members.data?.pageSize ?? 20;

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input value={search} onChange={(e) => { setPage(0); setSearch(e.target.value); }} placeholder="Search name, email, country or city" aria-label="Search members" />
        <Select value={status} onValueChange={(v) => { setPage(0); setStatus(v as typeof status); }}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All members</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Deactivated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {members.isPending ? <Skeleton className="h-64 w-full" /> : rows.length === 0 ? <p className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">No members match this view.</p> : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {rows.map((m) => (
            <div key={m.id} className="grid gap-3 border-b border-border p-4 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <strong className="block truncate text-sm">{m.full_name || "Unnamed member"}</strong>
                <p className="mt-1 truncate text-xs text-muted-foreground">{m.email}{m.country ? ` · ${m.city ? `${m.city}, ` : ""}${m.country}` : ""} · Joined {new Date(m.created_at).toLocaleDateString()}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant={m.is_active ? "default" : "secondary"}>{m.is_active ? "Active" : "Deactivated"}</Badge>
                  {m.roles.map((r) => <Badge key={r} variant="outline">{r.replaceAll("_", " ")}</Badge>)}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelected(m)}><UserCog /> {isSuperAdmin ? "Manage" : "View"}</Button>
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

      <Dialog open={Boolean(selected)} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selected ? <MemberDetail key={selected.id} member={selected} isSuperAdmin={isSuperAdmin} onChanged={() => { refresh(); }} onClose={() => setSelected(null)} /> : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function MemberDetail({ member, isSuperAdmin, onChanged, onClose }: { member: Member; isSuperAdmin: boolean; onChanged: () => void; onClose: () => void }) {
  const saveProfile = useServerFn(updateMemberProfile);
  const toggleActive = useServerFn(setMemberActive);
  const toggleRole = useServerFn(setMemberRole);
  const savePerms = useServerFn(setAdminPermissions);
  const resetPw = useServerFn(resetMemberPassword);
  const deleteMember = useServerFn(deleteMemberPermanently);

  const protectedAccount = member.roles.includes("super_admin");
  const editable = isSuperAdmin && !protectedAccount;
  const [form, setForm] = useState({ fullName: member.full_name, email: member.email, phone: member.phone ?? "", country: member.country ?? "", city: member.city ?? "", preferredLanguage: (member.preferred_language as "en" | "ha" | "ar") ?? "en" });
  const [roles, setRoles] = useState(member.roles);
  const [modules, setModules] = useState<string[]>(member.modules);
  const [active, setActive] = useState(member.is_active);
  const [password, setPassword] = useState("");
  const [forceChange, setForceChange] = useState(true);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try { await fn(); toast.success(ok); onChanged(); return true; }
    catch (e) { toast.error(errMsg(e, "Action failed")); return false; }
    finally { setBusy(false); }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{member.full_name || "Unnamed member"}</DialogTitle>
        <DialogDescription>Joined {new Date(member.created_at).toLocaleDateString()}. Passwords are never shown. All changes are recorded in the audit log.</DialogDescription>
      </DialogHeader>

      {protectedAccount ? <p className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm"><ShieldCheck className="h-4 w-4 text-primary" /> This is the protected Super Admin account. It cannot be demoted, deactivated or deleted.</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {([["fullName", "Full name"], ["email", "Email"], ["phone", "Phone"], ["country", "Country"], ["city", "City"]] as const).map(([k, l]) => (
          <div key={k} className="grid gap-1.5"><Label htmlFor={`m-${k}`}>{l}</Label><Input id={`m-${k}`} value={form[k]} disabled={!isSuperAdmin} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
        ))}
        <div className="grid gap-1.5"><Label>Preferred language</Label>
          <Select value={form.preferredLanguage} disabled={!isSuperAdmin} onValueChange={(v) => setForm({ ...form, preferredLanguage: v as "en" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="ar">العربية</SelectItem><SelectItem value="ha">Hausa</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      {isSuperAdmin ? <Button disabled={busy} onClick={() => run(() => saveProfile({ data: { userId: member.id, ...form } }), "Profile saved")}>Save profile</Button> : null}

      {editable ? (
        <>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div><strong className="text-sm">Account active</strong><p className="text-xs text-muted-foreground">Deactivated members cannot use member features.</p></div>
            <Switch checked={active} disabled={busy} onCheckedChange={async (v) => { if (await run(() => toggleActive({ data: { userId: member.id, isActive: v } }), v ? "Member activated" : "Member deactivated")) setActive(v); }} />
          </div>

          <div className="rounded-md border border-border p-3">
            <strong className="text-sm">Roles</strong>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {roleOptions.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={roles.includes(r)} disabled={busy} onCheckedChange={async (c) => {
                    const grant = Boolean(c);
                    if (await run(() => toggleRole({ data: { userId: member.id, role: r, grant } }), "Role updated")) {
                      setRoles(grant ? [...roles, r] : roles.filter((x) => x !== r));
                      if (!grant && r === "admin") setModules([]);
                    }
                  }} />
                  {r.replaceAll("_", " ")}
                </label>
              ))}
            </div>
            {roles.includes("admin") ? (
              <div className="mt-4 border-t border-border pt-3">
                <strong className="text-sm">Admin permissions</strong>
                <p className="text-xs text-muted-foreground">This admin can only open and change the sections ticked here. Roles and the Super Admin stay off limits.</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {adminModules.map((mod) => (
                    <label key={mod.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={modules.includes(mod.id)} onCheckedChange={(c) => setModules(c ? [...modules, mod.id] : modules.filter((x) => x !== mod.id))} />
                      {mod.label}
                    </label>
                  ))}
                </div>
                <Button size="sm" className="mt-3" disabled={busy} onClick={() => run(() => savePerms({ data: { userId: member.id, modules } }), "Permissions saved")}>Save permissions</Button>
              </div>
            ) : null}
          </div>

          <div className="rounded-md border border-border p-3">
            <strong className="flex items-center gap-2 text-sm"><KeyRound className="h-4 w-4" /> Set new password</strong>
            <p className="text-xs text-muted-foreground">The current password is never shown. Share the new one with the member privately.</p>
            <div className="mt-2 grid gap-2">
              <Input type="password" autoComplete="new-password" minLength={8} value={password} placeholder="New password (at least 8 characters)" aria-label="New password" onChange={(e) => setPassword(e.target.value)} />
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={forceChange} onCheckedChange={(c) => setForceChange(Boolean(c))} /> Require a password change at next login</label>
              <Button size="sm" variant="outline" disabled={busy || password.length < 8} onClick={async () => { if (await run(() => resetPw({ data: { userId: member.id, newPassword: password, forceChange } }), "Password updated")) setPassword(""); }}>Set new password</Button>
            </div>
          </div>

          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <strong className="flex items-center gap-2 text-sm text-destructive"><Trash2 className="h-4 w-4" /> Delete member permanently</strong>
            <p className="text-xs text-muted-foreground">This cannot be undone. The account, profile and linked member data are removed for good. Type the member's email to confirm.</p>
            <Input className="mt-2" value={confirmEmail} placeholder={member.email} aria-label="Type the member email to confirm" onChange={(e) => setConfirmEmail(e.target.value)} />
            <Button size="sm" variant="destructive" className="mt-2" disabled={busy || confirmEmail.trim().toLowerCase() !== member.email.toLowerCase()} onClick={async () => { if (await run(() => deleteMember({ data: { userId: member.id, confirmEmail } }), "Member permanently deleted")) onClose(); }}>Delete permanently</Button>
          </div>
        </>
      ) : null}
    </>
  );
}
