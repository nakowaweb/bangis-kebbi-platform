import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const db = supabase as any;

function useRows<T>(table: string, order = "sort_order", asc = true) {
  const [rows, setRows] = useState<T[]>([]);
  const load = async () => { const { data, error } = await db.from(table).select("*").order(order, { ascending: asc }); if (error) toast.error(error.message); setRows(data ?? []); };
  useEffect(() => { void load(); }, []);
  return { rows, reload: load };
}

export function AdminPackages() {
  const { rows, reload } = useRows<any>("umrah_packages");
  return <div className="grid gap-4"><p className="text-sm text-muted-foreground">Planning categories only — not investment plans. Leave price empty until confirmed.</p>
    {rows.map((p) => <PackageForm key={p.id} p={p} onSaved={reload} />)}</div>;
}
function PackageForm({ p, onSaved }: { p: any; onSaved: () => void }) {
  const [f, setF] = useState({ name: p.name, description: p.description ?? "", price: p.price ?? "", currency: p.currency, is_available: p.is_available });
  const save = async () => {
    const price = f.price === "" ? null : Number(f.price);
    if (price != null && !(price > 0)) return toast.error("Enter a valid price or leave it empty.");
    const { error } = await db.from("umrah_packages").update({ ...f, price, description: f.description || null }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(`${f.name} saved`); onSaved();
  };
  return <Card><CardHeader><CardTitle className="text-base uppercase">{p.tier}</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
    <div className="grid gap-1"><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
    <div className="grid grid-cols-[1fr_6rem] gap-2"><div className="grid gap-1"><Label>Price</Label><Input inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div><div className="grid gap-1"><Label>Currency</Label><Input value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value.toUpperCase() })} /></div></div>
    <div className="grid gap-1 sm:col-span-2"><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
    <label className="flex items-center gap-2 text-sm"><Switch checked={f.is_available} onCheckedChange={(v) => setF({ ...f, is_available: v })} />Available to members</label>
    <Button className="w-fit justify-self-end" onClick={save}>Save</Button>
  </CardContent></Card>;
}

export function AdminPaymentMethods() {
  const { rows, reload } = useRows<any>("umrah_payment_methods");
  const [enabled, setEnabled] = useState(false);
  useEffect(() => { db.from("umrah_settings").select("deposits_enabled").eq("id", 1).maybeSingle().then(({ data }: any) => setEnabled(Boolean(data?.deposits_enabled))); }, []);
  const toggle = async (v: boolean) => {
    if (v && !window.confirm("Only enable live deposits once legal authorisation and approved payment/custody arrangements are confirmed. Continue?")) return;
    const { error } = await db.from("umrah_settings").update({ deposits_enabled: v }).eq("id", 1);
    if (error) return toast.error(error.message);
    setEnabled(v); toast.success(v ? "Live deposits enabled" : "Live deposits disabled");
  };
  return <div className="grid gap-4">
    <Card className="border-destructive/40"><CardContent className="flex items-center justify-between gap-4 pt-6"><div><p className="font-semibold">Live deposits</p><p className="text-sm text-muted-foreground">While off, members cannot submit any payment records.</p></div><Switch checked={enabled} onCheckedChange={toggle} /></CardContent></Card>
    {rows.map((m) => <MethodForm key={m.id} m={m} onSaved={reload} />)}
  </div>;
}
function MethodForm({ m, onSaved }: { m: any; onSaved: () => void }) {
  const [f, setF] = useState({ label: m.label, instructions: m.instructions ?? "", receiving_details: m.receiving_details ?? "", is_enabled: m.is_enabled });
  const save = async () => { const { error } = await db.from("umrah_payment_methods").update(f).eq("id", m.id); if (error) return toast.error(error.message); toast.success("Saved"); onSaved(); };
  return <Card><CardHeader><CardTitle className="text-base">{m.sort_order}. {m.label}</CardTitle></CardHeader><CardContent className="grid gap-3">
    <div className="grid gap-1"><Label>Display label</Label><Input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></div>
    <div className="grid gap-1"><Label>Payment instructions</Label><Textarea value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} /></div>
    <div className="grid gap-1"><Label>Receiving details (wallet / account)</Label><Textarea value={f.receiving_details} onChange={(e) => setF({ ...f, receiving_details: e.target.value })} /></div>
    <div className="flex items-center justify-between"><label className="flex items-center gap-2 text-sm"><Switch checked={f.is_enabled} onCheckedChange={(v) => setF({ ...f, is_enabled: v })} />Method available</label><Button onClick={save}>Save</Button></div>
  </CardContent></Card>;
}

export function AdminTransactions() {
  const { rows, reload } = useRows<any>("umrah_transactions", "created_at", false);
  const [refund, setRefund] = useState({ user_id: "", amount: "", method: "ngn", note: "" });
  const review = async (id: string, approve: boolean) => {
    const note = window.prompt(approve ? "Approval note (receipt/reference checked)" : "Reason for rejection") ?? null;
    const { error } = await db.rpc("review_umrah_transaction", { _id: id, _approve: approve, _note: note });
    if (error) return toast.error(error.message);
    toast.success(approve ? "Approved and credited once" : "Rejected"); void reload();
  };
  const doRefund = async () => {
    const { error } = await db.rpc("record_umrah_refund", { _user_id: refund.user_id.trim(), _amount: Number(refund.amount), _method: refund.method, _note: refund.note || null });
    if (error) return toast.error(error.message);
    toast.success("Refund recorded"); setRefund({ user_id: "", amount: "", method: "ngn", note: "" }); void reload();
  };
  return <div className="grid gap-4">
    <Card><CardHeader><CardTitle className="text-base">Transactions</CardTitle><CardDescription>Approve only payments you have genuinely received and verified. Each can be reviewed once.</CardDescription></CardHeader><CardContent>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No transactions recorded.</p> : <ul className="divide-y divide-border text-sm">{rows.map((t) => (
        <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
          <span><span className="font-medium capitalize">{t.kind}</span> · {t.method_code.toUpperCase()} · {t.currency} {Number(t.amount).toLocaleString()}{t.reference ? ` · Ref ${t.reference}` : ""}<span className="block text-xs text-muted-foreground">Member {t.user_id} · {new Date(t.created_at).toLocaleString()}</span></span>
          {t.status === "pending" ? <span className="flex gap-2"><Button size="sm" onClick={() => review(t.id, true)}>Approve</Button><Button size="sm" variant="outline" onClick={() => review(t.id, false)}>Reject</Button></span> : <Badge variant="secondary" className="capitalize">{t.status}</Badge>}
        </li>))}</ul>}
    </CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Record a refund</CardTitle><CardDescription>Deducted from the member's recorded balance and logged in the audit trail.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1"><Label>Member ID</Label><Input value={refund.user_id} onChange={(e) => setRefund({ ...refund, user_id: e.target.value })} /></div>
      <div className="grid gap-1"><Label>Amount</Label><Input inputMode="decimal" value={refund.amount} onChange={(e) => setRefund({ ...refund, amount: e.target.value })} /></div>
      <div className="grid gap-1"><Label>Method (usdt / ngn)</Label><Input value={refund.method} onChange={(e) => setRefund({ ...refund, method: e.target.value.toLowerCase() })} /></div>
      <div className="grid gap-1"><Label>Note</Label><Input value={refund.note} onChange={(e) => setRefund({ ...refund, note: e.target.value })} /></div>
      <Button className="w-fit" onClick={doRefund} disabled={!refund.user_id || !(Number(refund.amount) > 0)}>Record refund</Button>
    </CardContent></Card>
  </div>;
}

export function AdminGoals() {
  const { rows } = useRows<any>("umrah_goals", "created_at", false);
  return <Card><CardHeader><CardTitle className="text-base">Member goals</CardTitle></CardHeader><CardContent>
    {rows.length === 0 ? <p className="text-sm text-muted-foreground">No member goals yet.</p> : <ul className="divide-y divide-border text-sm">{rows.map((g) => <li key={g.id} className="flex flex-wrap justify-between gap-2 py-2"><span>Member {g.user_id}<span className="block text-xs capitalize text-muted-foreground">{String(g.status).replace("_", " ")}</span></span><span>{g.currency} {Number(g.balance).toLocaleString()} / {g.target_amount ? Number(g.target_amount).toLocaleString() : "—"}</span></li>)}</ul>}
  </CardContent></Card>;
}
