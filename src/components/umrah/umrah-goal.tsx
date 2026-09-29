import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import QRCode from "react-qr-code";
import { Check, Copy, Info, LockKeyhole, Target, UserRound, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getMyUmrahGoalDashboard } from "@/lib/umrah-goal.functions";
import { umrahBalanceVisual } from "@/lib/umrah-visuals";

const db = supabase as any;

export type Pkg = { id: string; tier: string; name: string; description: string | null; price: number | null; currency: string; is_available: boolean; sort_order: number };
export type Goal = { id: string; user_id: string; package_id: string | null; target_amount: number | null; currency: string; balance: number; status: string; created_at: string };
export type Tx = { id: string; user_id: string; method_code: string; kind: string; amount: number; currency: string; reference: string | null; note: string | null; status: string; review_note: string | null; receipt_path?: string | null; created_at: string; reviewed_at: string | null };
type Method = { code: "ngn" | "usdt"; label: string; instructions: string | null; bankName: string | null; accountName: string | null; accountNumber: string | null; walletAddress: string | null; network: string | null; available: boolean };

const money = (n: number | null | undefined, c = "NGN") => (n == null ? "—" : `${c} ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
const statusLabel = (s: string) => ({ not_started: "Not Started", active: "Active", completed: "Completed" } as Record<string, string>)[s] ?? s;

export function useUmrahMemberData(userId: string) {
  const load = useServerFn(getMyUmrahGoalDashboard);
  const query = useQuery({ queryKey: ["my-umrah-goal", userId], queryFn: () => load() });
  return {
    loading: query.isPending,
    profile: query.data?.profile ?? null,
    goal: (query.data?.goal ?? null) as Goal | null,
    packages: (query.data?.packages ?? []) as Pkg[],
    txs: (query.data?.transactions ?? []) as Tx[],
    methods: (query.data?.methods ?? []) as Method[],
    depositsEnabled: query.data?.depositsEnabled ?? false,
    reload: query.refetch,
  };
}

export function UmrahGoalPanel({ userId }: { userId: string }) {
  const { loading, profile, goal, packages, txs, methods, depositsEnabled, reload } = useUmrahMemberData(userId);
  const [pkg, setPkg] = useState("");
  const [target, setTarget] = useState("");
  const [currency, setCurrency] = useState<"NGN" | "USDT">("NGN");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setPkg(goal?.package_id ?? "");
    setTarget(goal?.target_amount ? String(goal.target_amount) : "");
    setCurrency(goal?.currency === "USDT" ? "USDT" : "NGN");
  }, [goal]);

  if (loading) return <div className="h-96 animate-pulse rounded-lg bg-secondary" />;
  const balance = Number(goal?.balance ?? 0);
  const status = goal?.status ?? "not_started";
  const selected = packages.find((p) => p.id === goal?.package_id);
  const tgt = goal?.target_amount ? Number(goal.target_amount) : null;
  const pct = tgt ? Math.min(100, Math.round((balance / tgt) * 100)) : 0;
  const currencyLocked = balance !== 0;
  const initials = (profile?.fullName ?? "Member").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  const save = async (): Promise<void> => {
    const amount = target ? Number(target) : null;
    if (amount != null && (!Number.isFinite(amount) || amount <= 0)) { toast.error("Enter a valid target amount."); return; }
    setSaving(true);
    const row: Record<string, unknown> = { user_id: userId, package_id: pkg || null, target_amount: amount, status: status === "not_started" ? "active" : status };
    if (!currencyLocked) row["currency"] = currency;
    const { error } = goal ? await db.from("umrah_goals").update(row).eq("id", goal.id) : await db.from("umrah_goals").insert(row);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Your Umrah goal was saved.");
    setEditing(false);
    void reload();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-brand-cyan/25 bg-secondary/40 shadow-platform">
      <section className="relative overflow-hidden bg-brand-ink px-4 py-5 text-primary-foreground sm:px-7 sm:py-7">
        <img src={umrahBalanceVisual.image} alt={umrahBalanceVisual.alt} className="absolute inset-y-0 right-0 h-full w-2/5 object-cover opacity-20" />
        <div className="relative flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-cyan/20 text-xl font-bold text-brand-cyan sm:size-20 sm:text-2xl">{initials}</div>
            <div className="min-w-0">
              <h2 className="truncate font-display text-2xl font-bold sm:text-3xl">{profile?.fullName || "Member"}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-primary-foreground/75">
                <span>Member ID: <strong className="text-primary-foreground">{profile?.memberId ?? "Pending assignment"}</strong></span>
                {profile?.memberId ? <CopyAction value={profile.memberId} label="Copy Member ID" /> : null}
              </div>
              {status === "active" ? <span className="mt-3 inline-flex items-center gap-2 rounded-md bg-success/20 px-3 py-1 text-sm font-semibold text-success"><span className="size-2 rounded-full bg-success" />Active</span> : <span className="mt-3 inline-flex rounded-md bg-primary-foreground/10 px-3 py-1 text-sm font-medium text-primary-foreground/75">{statusLabel(status)}</span>}
            </div>
          </div>
          <div className="border-t border-primary-foreground/15 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div className="flex items-center justify-between gap-3"><p className="font-semibold">Umrah Goal Progress</p><strong className="text-xl">{pct}%</strong></div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-primary-foreground/15"><div className="h-full rounded-full bg-brand-cyan transition-[width] duration-500" style={{ width: `${pct}%` }} /></div>
            <div className="mt-2 flex flex-col gap-1 text-sm text-primary-foreground/75 sm:flex-row sm:justify-between"><span>{balance > 0 ? `${money(balance, goal?.currency)} recorded` : "No recorded contributions yet."}</span><span>{tgt ? `${money(tgt, goal?.currency)} target` : "No target set"}</span></div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 p-4 sm:p-6">
        {!depositsEnabled ? <div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4"><Info className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-semibold">Payment collection is not active yet</p><p className="mt-1 text-sm text-muted-foreground">Payment destinations below are locked previews. No account number, wallet address, scannable QR, or payment submission is available.</p></div></div> : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <PaymentMethodCard method={methods.find((m) => m.code === "ngn")} memberId={profile?.memberId ?? null} depositsEnabled={depositsEnabled} goal={goal} userId={userId} onDone={() => { void reload(); }} />
          <PaymentMethodCard method={methods.find((m) => m.code === "usdt")} memberId={profile?.memberId ?? null} depositsEnabled={depositsEnabled} goal={goal} userId={userId} onDone={() => { void reload(); }} />
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Target className="size-5 text-primary" />Goal settings</CardTitle><CardDescription>Choose your planning category and target. Only approved recorded amounts appear in progress.</CardDescription></CardHeader>
          <CardContent>
            {!editing ? <div className="flex flex-wrap items-center justify-between gap-3"><div className="text-sm"><strong>{selected?.name ?? "No package selected"}</strong><span className="block text-muted-foreground">{tgt ? money(tgt, goal?.currency) : "No personal target set"}</span></div><Button onClick={() => setEditing(true)}>{goal ? "Edit my goal" : "Set my Umrah goal"}</Button></div> : <div className="grid gap-4">
              <div className="grid gap-2"><Label>Package category (planning only, not an investment)</Label><div className="grid gap-2 sm:grid-cols-3">{packages.length === 0 ? <p className="text-sm text-muted-foreground sm:col-span-3">Package categories are being prepared. You can still set a personal target.</p> : packages.map((p) => <Button type="button" key={p.id} variant={pkg === p.id ? "default" : "outline"} className="h-auto justify-start py-3" onClick={() => setPkg(p.id === pkg ? "" : p.id)}><span className="text-left"><span className="block font-semibold">{p.name}</span><span className="block text-xs opacity-75">{p.price != null ? money(p.price, p.currency) : "Price to be confirmed"}</span></span></Button>)}</div></div>
              <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Goal currency</Label><div className="flex gap-2">{(["NGN", "USDT"] as const).map((c) => <Button key={c} type="button" size="sm" variant={currency === c ? "default" : "outline"} disabled={currencyLocked} onClick={() => setCurrency(c)}>{c}</Button>)}</div></div><div className="grid gap-2"><Label htmlFor="goal-target">Personal target amount ({currency})</Label><Input id="goal-target" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} /></div></div>
              <div className="flex gap-2"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save goal"}</Button><Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button></div>
            </div>}
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-lg">Approved history</CardTitle></CardHeader><CardContent>{txs.filter((t) => t.status === "approved").length === 0 ? <p className="text-sm text-muted-foreground">No recorded contributions yet.</p> : <TxList txs={txs.filter((t) => t.status === "approved")} />}</CardContent></Card>
      </div>
    </div>
  );
}

function PaymentMethodCard({ method, memberId, depositsEnabled, goal, userId, onDone }: { method: Method | undefined; memberId: string | null; depositsEnabled: boolean; goal: Goal | null; userId: string; onDone: () => void }) {
  const code = method?.code ?? "ngn";
  const active = depositsEnabled && Boolean(method?.available);
  const destination = code === "ngn" ? method?.accountNumber : method?.walletAddress;
  return <Card className="overflow-hidden border-primary/15">
    <CardHeader className="border-b border-border bg-card"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">{code === "ngn" ? <NigeriaFlagIcon /> : <TetherIcon />}</span><div><CardTitle className="text-lg">{code === "ngn" ? "NGN Bank Transfer" : "USDT Transfer"}</CardTitle><CardDescription>{code === "ngn" ? "Nigerian Naira bank transfer" : "USDT · TRC20 ONLY"}</CardDescription></div></div><span className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-muted-foreground">{active ? "AVAILABLE" : "COMING SOON"}</span></div></CardHeader>
    <CardContent className="grid gap-4 pt-5">
      {!active ? <ComingSoonState method={code} /> : <>
        {code === "ngn" ? <div className="divide-y divide-border rounded-md bg-secondary/60 px-4 text-sm"><DetailRow label="Bank name" value={method?.bankName ?? null} /><DetailRow label="Account name" value={method?.accountName ?? null} /><DetailRow label="Account number" value={method?.accountNumber ?? null} copy /></div> : <>
          <div className="divide-y divide-border rounded-md bg-secondary/60 px-4 text-sm"><DetailRow label="Network" value="TRC20 ONLY" /><DetailRow label="Wallet address" value={method?.walletAddress ?? null} copy /></div>
          <div className="grid gap-3 sm:grid-cols-[145px_1fr]"><div className="grid min-h-36 place-items-center rounded-md border border-border bg-card p-3">{destination ? <QRCode value={destination} size={112} bgColor="transparent" fgColor="currentColor" aria-label="Payment destination QR code" /> : null}</div><div className="rounded-md border border-brand-gold/30 bg-brand-gold/10 p-4 text-sm"><p className="font-semibold">USDT — TRC20 ONLY</p><p className="mt-2 text-muted-foreground">Only use the TRC20 network. Other networks may result in loss of funds.</p></div></div>
        </>}
        {memberId ? <p className="rounded-md bg-primary/5 p-3 text-sm">Use your Member ID <strong>{memberId}</strong> as the payment reference.</p> : null}
        {goal && goal.currency.toLowerCase() === code ? <RecordPayment userId={userId} goalId={goal.id} goalCurrency={goal.currency} method={method} onDone={onDone} /> : <Button disabled className="w-full"><LockKeyhole />Payment submission unavailable for this goal</Button>}
      </>}
    </CardContent>
  </Card>;
}

function ComingSoonState({ method }: { method: "ngn" | "usdt" }) {
  return <div className="grid min-h-48 place-items-center rounded-md border border-dashed border-primary/20 bg-primary/5 p-6 text-center"><div><LockKeyhole className="mx-auto size-8 text-primary" /><p className="mt-3 font-semibold">Coming soon</p><p className="mt-1 text-sm text-muted-foreground">{method === "usdt" ? "USDT transfers will use TRC20 ONLY." : "NGN bank transfer is not open yet."}</p></div></div>;
}

function NigeriaFlagIcon() {
  return <svg viewBox="0 0 30 20" className="h-5 w-7 overflow-hidden rounded-sm shadow-sm" role="img" aria-label="Nigeria flag"><rect width="10" height="20" x="0" fill="currentColor" className="text-success" /><rect width="10" height="20" x="10" fill="currentColor" className="text-primary-foreground" /><rect width="10" height="20" x="20" fill="currentColor" className="text-success" /></svg>;
}

function TetherIcon() {
  return <svg viewBox="0 0 32 32" className="size-7 text-success" role="img" aria-label="Tether USDT"><circle cx="16" cy="16" r="15" fill="currentColor" /><path fill="var(--card)" d="M18.1 17.8v-.1c-.1 0-.8.1-2.1.1-1 0-1.8 0-2.1-.1v.1c-3.9-.2-6.8-.9-6.8-1.8s2.9-1.6 6.8-1.8v2.8c.3 0 1.1.1 2.1.1 1.2 0 1.9-.1 2.1-.1v-2.8c3.9.2 6.8.9 6.8 1.8s-2.9 1.6-6.8 1.8Zm0-4.1v-2.5h4.8V7.4H9.1v3.8h4.8v2.5c-5.3.3-9.3 1.3-9.3 2.6s4 2.4 9.3 2.7v8.3h4.2V19c5.3-.3 9.3-1.4 9.3-2.7s-4-2.3-9.3-2.6Z" /></svg>;
}

function DetailRow({ label, value, copy = false }: { label: string; value: string | null; copy?: boolean }) {
  return <div className="grid min-h-11 grid-cols-[7rem_1fr_auto] items-center gap-2 py-2"><span className="text-muted-foreground">{label}</span><strong className="min-w-0 truncate">{value || "Not available"}</strong>{copy && value ? <CopyAction value={value} label={`Copy ${label}`} /> : <LockKeyhole className="size-4 text-muted-foreground" />}</div>;
}

function CopyAction({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return <Button type="button" size="icon" variant="ghost" title={label} aria-label={label} onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check /> : <Copy />}</Button>;
}

export function TxList({ txs }: { txs: Tx[] }) {
  return <ul className="divide-y divide-border text-sm">{txs.map((t) => <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span><span className="font-medium capitalize">{t.kind}</span> · {t.method_code.toUpperCase()}{t.reference ? ` · Ref ${t.reference}` : ""}<span className="block text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</span></span><span className="text-end"><span className={t.kind === "refund" ? "text-destructive" : ""}>{t.kind === "refund" ? "−" : ""}{money(t.amount, t.currency)}</span><span className="block text-xs capitalize text-muted-foreground">{t.status}</span>{t.receipt_path ? <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => openReceipt(t.receipt_path ?? "")}>View receipt</Button> : null}</span></li>)}</ul>;
}

export function UmrahRecordsPanel({ userId }: { userId: string }) {
  const { loading, txs } = useUmrahMemberData(userId);
  const [app, setApp] = useState<any>(null);
  const [appLoaded, setAppLoaded] = useState(false);
  useEffect(() => { db.from("umrah_applications").select("application_number,status,submitted_at,created_at").eq("user_id", userId).maybeSingle().then(({ data }: any) => { setApp(data); setAppLoaded(true); }); }, [userId]);
  if (loading || !appLoaded) return <p className="text-sm text-muted-foreground">Loading your records…</p>;
  const payments = txs.filter((t) => t.kind === "payment");
  const refunds = txs.filter((t) => t.kind === "refund");
  return <div className="grid gap-5"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><UserRound className="size-5" />Umrah application</CardTitle></CardHeader><CardContent className="text-sm">{app ? <dl className="grid gap-2 sm:grid-cols-3"><div><dt className="text-muted-foreground">Application</dt><dd className="font-medium">{app.application_number}</dd></div><div><dt className="text-muted-foreground">Status</dt><dd className="font-medium capitalize">{String(app.status).replace(/_/g, " ")}</dd></div><div><dt className="text-muted-foreground">Submitted</dt><dd className="font-medium">{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : "Not submitted yet"}</dd></div></dl> : <p className="text-muted-foreground">You have not started an Umrah application yet.</p>}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><WalletCards className="size-5" />Payment history</CardTitle></CardHeader><CardContent>{payments.length ? <TxList txs={payments} /> : <p className="text-sm text-muted-foreground">No payment records yet.</p>}</CardContent></Card><Card><CardHeader><CardTitle className="text-lg">Refunds</CardTitle></CardHeader><CardContent>{refunds.length ? <TxList txs={refunds} /> : <p className="text-sm text-muted-foreground">No refunds recorded.</p>}</CardContent></Card></div>;
}

const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function RecordPayment({ userId, goalId, goalCurrency, method, onDone }: { userId: string; goalId: string; goalCurrency: string; method: Method | undefined; onDone: () => void }) {
  const [amount, setAmount] = useState(""); const [reference, setReference] = useState(""); const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false);
  if (!method?.available) return null;
  const submit = async (): Promise<void> => {
    const n = Number(amount); if (!(n > 0)) { toast.error("Enter the amount you sent."); return; } if (!reference.trim()) { toast.error("Enter the transaction reference."); return; } if (!file) { toast.error("Attach your payment receipt."); return; } if (!RECEIPT_TYPES.includes(file.type) || file.size > 10 * 1024 * 1024) { toast.error("Receipt must be a JPG, PNG, WEBP or PDF under 10MB."); return; }
    setBusy(true); const path = `${userId}/umrah-receipts/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`; const up = await supabase.storage.from("member-documents").upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) { setBusy(false); toast.error(up.error.message); return; }
    const { error } = await db.from("umrah_transactions").insert({ user_id: userId, goal_id: goalId, method_code: method.code, kind: "payment", amount: n, currency: goalCurrency, reference: reference.trim(), receipt_path: path, status: "pending" }); setBusy(false);
    if (error) { await supabase.storage.from("member-documents").remove([path]); toast.error(error.message); return; }
    toast.success("Payment recorded. It remains pending until verified."); setAmount(""); setReference(""); setFile(null); onDone();
  };
  return <div className="grid gap-3 rounded-md border border-border p-3"><p className="font-semibold">Record a payment already sent</p><div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-1"><Label>Amount ({goalCurrency})</Label><Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></div><div className="grid gap-1"><Label>Reference / hash</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} /></div></div><div className="grid gap-1"><Label>Receipt</Label><Input type="file" accept={RECEIPT_TYPES.join(",")} onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div><Button onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit payment record"}</Button></div>;
}

export async function openReceipt(path: string) {
  if (!path) return;
  const { data, error } = await supabase.storage.from("member-documents").createSignedUrl(path, 120);
  if (error || !data) { toast.error(error?.message ?? "Receipt unavailable"); return; }
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}