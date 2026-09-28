import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// New Umrah planning tables; accessed through RLS as the signed-in member.
const db = supabase as any;

export type Pkg = { id: string; tier: string; name: string; description: string | null; price: number | null; currency: string; is_available: boolean; sort_order: number };
export type Goal = { id: string; user_id: string; package_id: string | null; target_amount: number | null; currency: string; balance: number; status: string; created_at: string };
export type Tx = { id: string; user_id: string; method_code: string; kind: string; amount: number; currency: string; reference: string | null; note: string | null; status: string; review_note: string | null; created_at: string; reviewed_at: string | null };
type Method = { code: string; label: string; instructions: string | null; receiving_details: string | null; is_enabled: boolean; sort_order: number };

const money = (n: number | null | undefined, c = "NGN") => (n == null ? "—" : `${c} ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
const statusLabel = (s: string) => ({ not_started: "Not Started", active: "Active", completed: "Completed" } as Record<string, string>)[s] ?? s;

export function useUmrahMemberData(userId: string) {
  const [state, setState] = useState<{ loading: boolean; goal: Goal | null; packages: Pkg[]; txs: Tx[]; methods: Method[]; depositsEnabled: boolean }>({ loading: true, goal: null, packages: [], txs: [], methods: [], depositsEnabled: false });
  const load = async () => {
    const [g, p, t, m, s] = await Promise.all([
      db.from("umrah_goals").select("*").eq("user_id", userId).maybeSingle(),
      db.from("umrah_packages").select("*").order("sort_order"),
      db.from("umrah_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      db.from("umrah_payment_methods").select("*").order("sort_order"),
      db.from("umrah_settings").select("deposits_enabled").eq("id", 1).maybeSingle(),
    ]);
    setState({ loading: false, goal: g.data ?? null, packages: p.data ?? [], txs: t.data ?? [], methods: m.data ?? [], depositsEnabled: Boolean(s.data?.deposits_enabled) });
  };
  useEffect(() => { void load(); }, [userId]);
  return { ...state, reload: load };
}

export function UmrahGoalPanel({ userId }: { userId: string }) {
  const { loading, goal, packages, txs, methods, depositsEnabled, reload } = useUmrahMemberData(userId);
  const [pkg, setPkg] = useState<string>("");
  const [target, setTarget] = useState("");
  const [currency, setCurrency] = useState<"NGN" | "USDT">("NGN");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setPkg(goal?.package_id ?? ""); setTarget(goal?.target_amount ? String(goal.target_amount) : ""); setCurrency(goal?.currency === "USDT" ? "USDT" : "NGN"); }, [goal]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading your Umrah goal…</p>;
  const balance = Number(goal?.balance ?? 0);
  const status = goal?.status ?? "not_started";
  const selected = packages.find((p) => p.id === goal?.package_id);
  const tgt = goal?.target_amount ? Number(goal.target_amount) : null;
  const pct = tgt ? Math.min(100, Math.round((balance / tgt) * 100)) : 0;
  const approved = txs.filter((t) => t.status === "approved");
  const currencyLocked = balance !== 0;

  const save = async () => {
    const amount = target ? Number(target) : null;
    if (amount != null && (!Number.isFinite(amount) || amount <= 0)) { toast.error("Enter a valid target amount."); return; }
    setSaving(true);
    const row: Record<string, unknown> = { user_id: userId, package_id: pkg || null, target_amount: amount, status: status === "not_started" ? "active" : status };
    if (!currencyLocked) row.currency = currency;
    const { error } = goal ? await db.from("umrah_goals").update(row).eq("id", goal.id) : await db.from("umrah_goals").insert(row);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Your Umrah goal was saved.");
    setEditing(false);
    void reload();
  };


  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Current recorded balance" value={money(balance, goal?.currency)} />
        <Stat label="Status" value={statusLabel(status)} />
        <Stat label="Selected package" value={selected?.name ?? "None selected"} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Goal progress</CardTitle><CardDescription>Only approved, genuinely received payments are counted. No sample figures are shown.</CardDescription></CardHeader>
        <CardContent className="grid gap-3">
          <div className="h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} /></div>
          <p className="text-sm text-muted-foreground">{tgt ? `${pct}% of ${money(tgt, goal?.currency)}` : "No target amount set yet."}</p>
          {!editing ? (
            <Button className="w-fit" onClick={() => setEditing(true)}>{goal ? "Edit my goal" : "Set my Umrah goal"}</Button>
          ) : (
            <div className="grid gap-4 rounded-lg border border-border p-4">
              <div className="grid gap-2">
                <Label>Package category (planning only, not an investment)</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {packages.length === 0 ? <p className="text-sm text-muted-foreground sm:col-span-3">Package categories are being prepared by the administrator. You can still set a personal target.</p> : packages.map((p) => (
                    <button type="button" key={p.id} onClick={() => setPkg(p.id === pkg ? "" : p.id)} className={`rounded-lg border p-3 text-start text-sm transition ${pkg === p.id ? "border-primary bg-primary/10" : "border-border"}`}>
                      <span className="font-semibold">{p.name}</span>
                      <span className="block text-muted-foreground">{p.price != null ? money(p.price, p.currency) : "Price to be confirmed"}</span>
                      {p.description ? <span className="mt-1 block text-xs text-muted-foreground">{p.description}</span> : null}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="grid gap-2"><Label>Goal currency</Label><div className="flex gap-2">{(["NGN", "USDT"] as const).map((c) => <Button key={c} type="button" size="sm" variant={currency === c ? "default" : "outline"} disabled={currencyLocked} onClick={() => setCurrency(c)}>{c}</Button>)}</div>{currencyLocked ? <p className="text-xs text-muted-foreground">Locked because a balance is recorded.</p> : null}</div>
                <div className="grid max-w-xs gap-2"><Label htmlFor="goal-target">Personal target amount ({currency})</Label><Input id="goal-target" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. your own target" /></div>
              </div>
              <div className="flex gap-2"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save goal"}</Button><Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Payment methods</CardTitle><CardDescription>{depositsEnabled ? "Record a payment only after you have sent it. It stays pending until an administrator confirms receipt." : "Online contributions are not open yet. Nothing can be paid through this website at the moment."}</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {depositsEnabled && methods.length > 0 ? methods.map((m) => <div key={m.code} className="rounded-lg border border-border p-3 text-sm"><p className="font-semibold">{m.label}</p>{m.instructions ? <p className="mt-1 whitespace-pre-line text-muted-foreground">{m.instructions}</p> : null}{m.receiving_details ? <p className="mt-1 whitespace-pre-line font-mono text-xs">{m.receiving_details}</p> : null}</div>)
            : <p className="text-sm text-muted-foreground sm:col-span-2">1. USDT · 2. Nigerian Naira (NGN) — currently unavailable.</p>}
          {depositsEnabled && goal ? <RecordPayment userId={userId} goalId={goal.id} goalCurrency={goal.currency} methods={methods.filter((m) => m.code.toUpperCase() === goal.currency)} onDone={reload} /> : null}
        </CardContent>
      </Card>


      <Card>
        <CardHeader><CardTitle className="text-lg">Approved history</CardTitle></CardHeader>
        <CardContent>{approved.length === 0 ? <p className="text-sm text-muted-foreground">No recorded contributions yet.</p> : <TxList txs={approved} />}</CardContent>
      </Card>
    </div>
  );
}

export function TxList({ txs }: { txs: Tx[] }) {
  return <ul className="divide-y divide-border text-sm">{txs.map((t) => (
    <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
      <span><span className="font-medium capitalize">{t.kind}</span> · {t.method_code.toUpperCase()}{t.reference ? ` · Ref ${t.reference}` : ""}<span className="block text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</span></span>
      <span className="text-end"><span className={t.kind === "refund" ? "text-destructive" : ""}>{t.kind === "refund" ? "−" : ""}{money(t.amount, t.currency)}</span><span className="block text-xs capitalize text-muted-foreground">{t.status}</span></span>
    </li>
  ))}</ul>;
}

export function UmrahRecordsPanel({ userId }: { userId: string }) {
  const { loading, txs } = useUmrahMemberData(userId);
  const [app, setApp] = useState<any>(null);
  const [appLoaded, setAppLoaded] = useState(false);
  useEffect(() => { db.from("umrah_applications").select("application_number,status,submitted_at,created_at").eq("user_id", userId).maybeSingle().then(({ data }: any) => { setApp(data); setAppLoaded(true); }); }, [userId]);
  if (loading || !appLoaded) return <p className="text-sm text-muted-foreground">Loading your records…</p>;
  const payments = txs.filter((t) => t.kind === "payment");
  const refunds = txs.filter((t) => t.kind === "refund");
  return (
    <div className="grid gap-5">
      <Card><CardHeader><CardTitle className="text-lg">Umrah application</CardTitle></CardHeader><CardContent className="text-sm">
        {app ? <dl className="grid gap-2 sm:grid-cols-3"><div><dt className="text-muted-foreground">Application</dt><dd className="font-medium">{app.application_number}</dd></div><div><dt className="text-muted-foreground">Status</dt><dd className="font-medium capitalize">{String(app.status).replace(/_/g, " ")}</dd></div><div><dt className="text-muted-foreground">Submitted</dt><dd className="font-medium">{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : "Not submitted yet"}</dd></div></dl> : <p className="text-muted-foreground">You have not started an Umrah application yet.</p>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-lg">Payment history</CardTitle><CardDescription>Pending, approved and rejected payment records.</CardDescription></CardHeader><CardContent>{payments.length ? <TxList txs={payments} /> : <p className="text-sm text-muted-foreground">No payment records yet.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-lg">Refunds</CardTitle></CardHeader><CardContent>{refunds.length ? <TxList txs={refunds} /> : <p className="text-sm text-muted-foreground">No refunds recorded.</p>}</CardContent></Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-card p-4 shadow-sm"><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-display text-xl font-bold">{value}</p></div>;
}
