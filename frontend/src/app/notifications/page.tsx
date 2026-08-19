"use client";

import { useRouter } from "next/navigation";
import {
  CheckCheck,
  Inbox,
  Trash2,
} from "lucide-react";
import ProtectedRoute from "../../components/ProtectedRoute";
import AppShell from "../../components/AppShell";
import {
  useClearNotificationsMutation,
  useDeleteNotificationMutation,
  useGetUnreadNotificationCountQuery,
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "../../lib/apiSlices";
import {
  Button,
  Card,
  EmptyState,
  Skeleton,
  cn,
  formatDate,
} from "../../components/ui";
import NotificationIcon from "../../components/NotificationIcon";
import type { AppNotification } from "../../lib/types";

function formatDateTime(value: string) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formatDate(value)} · ${time}`;
}

function groupByDay(items: AppNotification[]) {
  const groups: Array<{ label: string; items: AppNotification[] }> = [];
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);

  let current: AppNotification[] = [];
  let label = "Earlier";

  items.forEach((n, i) => {
    const d = new Date(n.createdAt);
    const day =
      d >= startOfToday
        ? "today"
        : d >= startOfYesterday
          ? "yesterday"
          : "earlier";
    const groupLabel = day === "today" ? "Today" : day === "yesterday" ? "Yesterday" : "Earlier";

    if (i === 0 || groupLabel !== label) {
      if (current.length > 0) groups.push({ label, items: current });
      current = [];
      label = groupLabel;
    }
    current.push(n);
  });
  if (current.length > 0) groups.push({ label, items: current });
  return groups;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { data: items, isLoading } = useListNotificationsQuery(undefined, {
    pollingInterval: 30000,
  });
  const { data: countData } = useGetUnreadNotificationCountQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [remove] = useDeleteNotificationMutation();
  const [clearAll] = useClearNotificationsMutation();

  const unread = countData?.count ?? 0;

  function handleOpen(n: AppNotification) {
    if (!n.read) markRead(n.id).catch(() => {});
    if (n.eventId) router.push(`/events/${n.eventId}`);
  }

  function handleClearAll() {
    if (confirm("Delete all notifications? This cannot be undone.")) {
      clearAll().catch(() => {});
    }
  }

  const groups = items ? groupByDay(items) : [];

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-medium tracking-tight text-slate-900">
                Notifications
              </h1>
              <p className="text-sm text-slate-500">
                {unread > 0
                  ? `${unread} unread notification${unread === 1 ? "" : "s"}`
                  : "You're all caught up"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={unread === 0}
                onClick={() => markAllRead().catch(() => {})}
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!items || items.length === 0}
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleClearAll}
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : !items || items.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Inbox className="h-5 w-5" />}
                title="No notifications"
                description="Updates about your events will appear here."
              />
            </Card>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.label}>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {group.label}
                  </h2>
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
                    {group.items.map((n, i) => (
                      <div
                        key={n.id}
                        className={cn(
                          "group flex w-full items-start gap-3 border-slate-100 px-4 py-3 text-left transition-colors",
                          i !== 0 && "border-t",
                          !n.read && "bg-indigo-50/60"
                        )}
                      >
                        <button
                          onClick={() => handleOpen(n)}
                          className="flex min-w-0 flex-1 items-start gap-3 text-left"
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              n.read
                                ? "bg-slate-100 text-slate-500"
                                : "bg-indigo-100 text-indigo-600"
                            )}
                          >
                            <NotificationIcon type={n.type} className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-medium text-slate-900">
                                {n.title}
                              </span>
                              {!n.read && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                              )}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                              {n.message}
                            </span>
                            <span className="mt-1 block text-[11px] text-slate-400">
                              {formatDateTime(n.createdAt)}
                            </span>
                          </span>
                        </button>
                        <button
                          onClick={() => remove(n.id).catch(() => {})}
                          className="mt-1 rounded-md p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
