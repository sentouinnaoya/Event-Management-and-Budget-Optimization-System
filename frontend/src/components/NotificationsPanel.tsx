"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, Inbox, Trash2 } from "lucide-react";
import {
  useDeleteNotificationMutation,
  useGetUnreadNotificationCountQuery,
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "../lib/apiSlices";
import type { AppNotification } from "../lib/types";
import { cn, formatDate, Spinner } from "./ui";
import NotificationIcon from "./NotificationIcon";

export default function NotificationsPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: count } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const { data: items, isLoading } = useListNotificationsQuery(undefined, {
    skip: !open,
  });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [remove] = useDeleteNotificationMutation();

  const unread = count?.count ?? 0;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function handleOpen() {
    setOpen((v) => !v);
    if (!open && unread > 0) markAllRead().catch(() => {});
  }

  function handleItem(n: AppNotification) {
    setOpen(false);
    if (!n.read) markRead(n.id).catch(() => {});
    if (n.eventId) router.push(`/events/${n.eventId}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-popover animate-pop-in sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              Notifications
            </p>
            {unread > 0 && (
              <button
                onClick={() => markAllRead().catch(() => {})}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-10">
                <Spinner className="h-5 w-5" />
              </div>
            )}

            {!isLoading && (!items || items.length === 0) && (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-slate-400">
                <Inbox className="h-8 w-8" />
                <p className="text-sm">No notifications yet</p>
              </div>
            )}

            {!isLoading &&
              items?.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "group flex items-start gap-3 border-b border-slate-50 px-4 py-3 transition-colors",
                    !n.read && "bg-indigo-50/60"
                  )}
                >
                  <button
                    onClick={() => handleItem(n)}
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
                        {formatDate(n.createdAt)}
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => remove(n.id).catch(() => {})}
                    className="mt-1 rounded-md p-1.5 text-slate-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
