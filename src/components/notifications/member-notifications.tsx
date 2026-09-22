import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  BellRing,
  CheckCheck,
  FileUp,
  HandHeart,
  Megaphone,
  Plane,
  Settings2,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getMyInbox,
  markAllNotificationsRead,
  markNotificationAsRead,
  type NotificationCategory,
} from "@/lib/notifications.functions";

const categoryIcons: Record<NotificationCategory, LucideIcon> = {
  system: Settings2,
  umrah: Plane,
  foundation: HandHeart,
  account: UserRound,
  announcement: Megaphone,
};

const categoryLabels: Record<NotificationCategory, string> = {
  system: "System",
  umrah: "Umrah",
  foundation: "BK Foundations",
  account: "Account",
  announcement: "Announcement",
};

const activityIcons: Record<string, LucideIcon> = {
  account_registered: ShieldCheck,
  account_status: ShieldCheck,
  profile_updated: UserRound,
  umrah_saved: Plane,
  umrah_submitted: Plane,
  umrah_status: Plane,
  umrah_message: Megaphone,
  document_uploaded: FileUp,
  foundation_published: HandHeart,
};

const sectionLabels: Record<string, string> = {
  profile: "Profile",
  umrah: "Umrah",
  foundations: "BK Foundations",
};

function useInbox() {
  const load = useServerFn(getMyInbox);
  return useQuery({ queryKey: ["member-inbox"], queryFn: () => load({ data: { limit: 30 } }) });
}

export function useUnreadNotificationCount() {
  const inbox = useInbox();
  return inbox.data?.unreadCount ?? 0;
}

export function MemberNotificationsPanel() {
  const queryClient = useQueryClient();
  const inbox = useInbox();
  const markRead = useServerFn(markNotificationAsRead);
  const markAll = useServerFn(markAllNotificationsRead);
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["member-inbox"] });
    void queryClient.invalidateQueries({ queryKey: ["member-account"] });
  };

  const readOne = useMutation({
    mutationFn: (id: string) => markRead({ data: { id } }),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });
  const readAll = useMutation({
    mutationFn: () => markAll({}),
    onSuccess: () => { toast.success("All notifications marked as read"); refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });

  if (inbox.isPending) return <PanelSkeleton />;
  if (inbox.isError) return <ErrorPanel message={inbox.error.message} onRetry={() => inbox.refetch()} />;

  const { notifications, unreadCount } = inbox.data;

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold">Notifications</h2>
          <Badge variant={unreadCount ? "default" : "secondary"}>{unreadCount} unread</Badge>
        </div>
        <Button size="sm" variant="outline" disabled={!unreadCount || readAll.isPending} onClick={() => readAll.mutate()}>
          <CheckCheck /> Mark all as read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} text="No notifications yet." />
      ) : (
        <div className="grid gap-3">
          {notifications.map((item) => {
            const Icon = categoryIcons[item.category] ?? Bell;
            const unread = !item.readAt;
            return (
              <Card key={item.id} className={unread ? "border-brand-cyan/70 bg-brand-cyan/5" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></span>
                      <div className="min-w-0">
                        <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                        <CardDescription>
                          {categoryLabels[item.category] ?? item.category} · {new Date(item.createdAt).toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                    {unread ? <Badge>New</Badge> : <Badge variant="secondary">Read</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                  {item.body ? <p className="min-w-0 text-sm text-muted-foreground">{item.body}</p> : <span />}
                  <div className="flex flex-wrap gap-2">
                    {item.linkPath ? (
                      <Button size="sm" variant="ghost" asChild><a href={item.linkPath}>Open</a></Button>
                    ) : null}
                    {unread ? (
                      <Button size="sm" variant="outline" disabled={readOne.isPending} onClick={() => readOne.mutate(item.id)}>
                        Mark as read
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function MemberActivitiesPanel() {
  const inbox = useInbox();

  if (inbox.isPending) return <PanelSkeleton />;
  if (inbox.isError) return <ErrorPanel message={inbox.error.message} onRetry={() => inbox.refetch()} />;

  const activities = inbox.data.activities;

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="font-display text-lg font-bold">Recent activities</h2>
        <p className="text-sm text-muted-foreground">The latest events recorded on your own account.</p>
      </div>
      {activities.length === 0 ? (
        <EmptyState icon={Bell} text="No activity recorded yet." />
      ) : (
        <ol className="grid gap-3">
          {activities.map((item) => {
            const Icon = activityIcons[item.kind] ?? Bell;
            return (
              <li key={item.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                <span className="mt-0.5 rounded-md bg-secondary p-2 text-primary"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold leading-snug">{item.title}</p>
                    {item.section ? <Badge variant="secondary">{sectionLabels[item.section] ?? item.section}</Badge> : null}
                  </div>
                  {item.description ? <p className="mt-1 text-sm text-muted-foreground">{item.description}</p> : null}
                  <time className="mt-1 block text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</time>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <Icon className="mx-auto h-6 w-6 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button className="mt-4" variant="outline" onClick={onRetry}>Try again</Button>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-xl" />)}
    </div>
  );
}
