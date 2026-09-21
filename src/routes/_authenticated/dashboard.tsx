import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  FolderKanban,
  HandHeart,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { claimFirstSuperAdmin, getMyAccount, markNotificationRead, updateMyProfile } from "@/lib/account.functions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () =>
    pageHead({
      title: "Member Dashboard — BangisKebbi.com",
      description: "Secure member space for BangisKebbi.com updates, profile, services, Umrah support and BK Foundations.",
      path: "/dashboard",
    }),
  component: DashboardPage,
});

type TabKey = "overview" | "profile" | "services" | "projects" | "umrah" | "foundations" | "activities" | "notifications" | "settings";

function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const loadAccount = useServerFn(getMyAccount);
  const saveProfile = useServerFn(updateMyProfile);
  const markRead = useServerFn(markNotificationRead);
  const claimAdmin = useServerFn(claimFirstSuperAdmin);
  const [tab, setTab] = useState<TabKey>("overview");

  const account = useQuery({ queryKey: ["member-account"], queryFn: () => loadAccount() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["member-account"] });

  const profileMutation = useMutation({
    mutationFn: (values: { fullName: string; phone: string; country: string; city: string; preferredLanguage: "en" | "ha" | "ar" }) => saveProfile({ data: values }),
    onSuccess: () => { toast.success("Profile updated"); refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/login", replace: true });
  }

  if (account.isPending) return <DashboardSkeleton />;
  if (account.isError) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">We could not load your account</h1>
        <p className="mt-3 text-sm text-muted-foreground">{account.error.message}</p>
        <Button className="mt-6" onClick={() => account.refetch()}>Try again</Button>
      </main>
    );
  }

  const data = account.data;
  const profile = data.profile;
  const unread = data.notifications.filter((item: { read_at: string | null }) => !item.read_at);

  return (
    <main className="min-h-[75vh] bg-secondary/40 pb-14">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-cyan">Member Dashboard</p>
            <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
              Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-1 text-sm text-primary-foreground/75">{profile?.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data.roles.map((role: string) => (
              <Badge key={role} variant="secondary" className="uppercase">{role.replaceAll("_", " ")}</Badge>
            ))}
            {data.isAdmin ? (
              <Button asChild variant="secondary" size="sm"><Link to="/admin"><ShieldCheck /> Admin</Link></Button>
            ) : null}
            <Button variant="outline" size="sm" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" onClick={signOut}>
              <LogOut /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
          <TabsList className="mb-6 h-auto w-full justify-start gap-1 overflow-x-auto bg-card p-1">
            <TabsTrigger value="overview"><LayoutDashboard /> Overview</TabsTrigger>
            <TabsTrigger value="profile"><UserRound /> Profile</TabsTrigger>
            <TabsTrigger value="services"><Sparkles /> Services</TabsTrigger>
            <TabsTrigger value="projects"><FolderKanban /> Projects</TabsTrigger>
            <TabsTrigger value="umrah"><CalendarCheck /> Umrah</TabsTrigger>
            <TabsTrigger value="foundations"><HandHeart /> BK Foundations</TabsTrigger>
            <TabsTrigger value="activities"><BriefcaseBusiness /> Activities</TabsTrigger>
            <TabsTrigger value="notifications"><Bell /> Notifications{unread.length ? ` (${unread.length})` : ""}</TabsTrigger>
            <TabsTrigger value="settings"><Settings /> Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryCard title="Account status" description={profile?.is_active ? "Active" : "Deactivated"}>
                <p className="text-sm text-muted-foreground">
                  Member since {profile ? new Date(profile.created_at).toLocaleDateString() : "—"}
                </p>
              </SummaryCard>
              <SummaryCard title="Notifications" description={`${unread.length} unread`}>
                <p className="text-sm text-muted-foreground">
                  {data.notifications.length === 0 ? "No notifications yet." : "Open the notifications tab to read them."}
                </p>
              </SummaryCard>
              <SummaryCard title="Applications" description="Umrah & Foundation">
                <p className="text-sm text-muted-foreground">No applications yet.</p>
              </SummaryCard>
              <SummaryCard title="Documents" description={`${data.documents.length} stored securely`}>
                <p className="text-sm text-muted-foreground">
                  {data.documents.length === 0 ? "No documents uploaded yet." : "Private to you and authorised administrators."}
                </p>
              </SummaryCard>
              <SummaryCard title="Latest updates" description="Platform news">
                <p className="text-sm text-muted-foreground">Published updates will appear here.</p>
              </SummaryCard>
              <SummaryCard title="Recent activity" description="Your account">
                <p className="text-sm text-muted-foreground">No recent activity recorded.</p>
              </SummaryCard>
            </div>
            {!data.isSuperAdmin ? (
              <BootstrapCard onClaim={async () => {
                try {
                  const result = await claimAdmin({});
                  if (result.claimed) { toast.success("Super Admin access granted to this account."); refresh(); }
                  else toast.info("A Super Admin already exists. Ask them to grant you access.");
                } catch (error) { toast.error(error instanceof Error ? error.message : "Request failed"); }
              }} />
            ) : null}
          </TabsContent>

          <TabsContent value="profile">
            <ProfileForm profile={profile} saving={profileMutation.isPending} onSave={(values) => profileMutation.mutate(values)} />
          </TabsContent>

          <TabsContent value="services">
            <PlaceholderPanel title="Services" text="Browse the public services page. Requesting a service from inside the dashboard arrives in the next module." href="/services" linkLabel="View services" />
          </TabsContent>
          <TabsContent value="projects">
            <PlaceholderPanel title="Projects" text="Published projects are shown on the public projects page." href="/projects" linkLabel="View projects" />
          </TabsContent>
          <TabsContent value="umrah">
            <PlaceholderPanel title="Umrah Support" text="Umrah applications and status tracking are a separate upcoming module. No application is open yet." href="/umrah" linkLabel="Umrah information" />
          </TabsContent>
          <TabsContent value="foundations">
            <PlaceholderPanel title="BK Foundations" text="Initiative updates will appear here once published. BK Foundations is a community support programme, not an investment." href="/foundation" linkLabel="Foundation information" />
          </TabsContent>
          <TabsContent value="activities">
            <PlaceholderPanel title="Activities" text="Community and platform activities will be listed here as they are published." href="/blog" linkLabel="Latest updates" />
          </TabsContent>

          <TabsContent value="notifications">
            {data.notifications.length === 0 ? (
              <EmptyPanel text="No notifications yet." />
            ) : (
              <div className="grid gap-3">
                {data.notifications.map((item: { id: string; title: string; body: string | null; category: string; read_at: string | null; created_at: string }) => (
                  <Card key={item.id} className={item.read_at ? "" : "border-brand-cyan/60"}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <Badge variant={item.read_at ? "secondary" : "default"}>{item.read_at ? "Read" : "New"}</Badge>
                      </div>
                      <CardDescription>{item.category} · {new Date(item.created_at).toLocaleString()}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">{item.body}</p>
                      {item.read_at ? null : (
                        <Button size="sm" variant="outline" onClick={async () => { await markRead({ data: { id: item.id } }); refresh(); }}>Mark as read</Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account settings</CardTitle>
                <CardDescription>Security options for your account.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:max-w-sm">
                <Button asChild variant="outline"><Link to="/reset-password">Change password</Link></Button>
                <Button variant="outline" onClick={signOut}><LogOut /> Sign out</Button>
                <p className="text-xs text-muted-foreground">Your role and permissions can only be changed by a Super Admin.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function SummaryCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ProfileForm({ profile, saving, onSave }: { profile: any; saving: boolean; onSave: (values: { fullName: string; phone: string; country: string; city: string; preferredLanguage: "en" | "ha" | "ar" }) => void }) {
  const [language, setLanguage] = useState<"en" | "ha" | "ar">((profile?.preferred_language as "en" | "ha" | "ar") ?? "en");
  useEffect(() => { setLanguage((profile?.preferred_language as "en" | "ha" | "ar") ?? "en"); }, [profile?.preferred_language]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({
      fullName: String(form.get("fullName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      country: String(form.get("country") ?? ""),
      city: String(form.get("city") ?? ""),
      preferredLanguage: language,
    });
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="text-lg">Your profile</CardTitle>
        <CardDescription>Update your personal details. Email and role cannot be changed here.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full name"><Input name="fullName" defaultValue={profile?.full_name ?? ""} maxLength={120} required /></FormField>
          <FormField label="Email"><Input value={profile?.email ?? ""} readOnly disabled /></FormField>
          <FormField label="Phone"><Input name="phone" type="tel" defaultValue={profile?.phone ?? ""} maxLength={40} /></FormField>
          <FormField label="Country"><Input name="country" defaultValue={profile?.country ?? ""} maxLength={80} /></FormField>
          <FormField label="City"><Input name="city" defaultValue={profile?.city ?? ""} maxLength={80} /></FormField>
          <FormField label="Preferred language">
            <Select value={language} onValueChange={(value) => setLanguage(value as "en" | "ha" | "ar")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ha">Hausa</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}

function PlaceholderPanel({ title, text, href, linkLabel }: { title: string; text: string; href: string; linkLabel: string }) {
  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle><CardDescription>{text}</CardDescription></CardHeader>
      <CardContent><Button asChild variant="outline"><a href={href}>{linkLabel}</a></Button></CardContent>
    </Card>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">{text}</div>;
}

function BootstrapCard({ onClaim }: { onClaim: () => void }) {
  return (
    <Card className="mt-6 max-w-2xl border-dashed">
      <CardHeader>
        <CardTitle className="text-base">Platform owner setup</CardTitle>
        <CardDescription>If no Super Admin exists yet, the owner account can claim it once. This works only while the platform has no Super Admin.</CardDescription>
      </CardHeader>
      <CardContent><Button variant="outline" onClick={onClaim}><ShieldCheck /> Claim Super Admin access</Button></CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-36 w-full rounded-xl" />)}
      </div>
    </main>
  );
}
