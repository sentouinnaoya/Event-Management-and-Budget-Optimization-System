"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Plus, Trash2, Users } from "lucide-react";
import ProtectedRoute from "../../components/ProtectedRoute";
import AppShell from "../../components/AppShell";
import {
  useDeleteEventMutation,
  useListEventsQuery,
  usePublishEventMutation,
} from "../../lib/apiSlices";
import {
  Button,
  Card,
  EmptyState,
  Skeleton,
  StatusBadge,
  cn,
  formatDate,
} from "../../components/ui";

const filters: Array<{ label: string; value: string }> = [
  { label: "All", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Ongoing", value: "ONGOING" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
  { label: "Archived", value: "ARCHIVED" },
];

export default function EventsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <EventsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function dateRange(event: {
  date: string;
  durationInDays?: number;
}): string {
  const days = event.durationInDays ?? 1;
  if (days <= 1) return formatDate(event.date);
  const end = new Date(
    new Date(event.date).getTime() + (days - 1) * 86400000
  )
    .toISOString()
    .slice(0, 10);
  return `${formatDate(event.date)} – ${formatDate(end)}`;
}

function EventsContent() {
  const [status, setStatus] = useState("");
  const { data, isLoading } = useListEventsQuery(status || undefined);
  const [publish] = usePublishEventMutation();
  const [remove] = useDeleteEventMutation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Events
          </h1>
          <p className="text-sm text-slate-500">
            Plan, publish, and manage your events.
          </p>
        </div>
        <Link href="/events/new">
          <Button>
            <Plus className="h-4 w-4" />
            New event
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
              status === f.value
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title="No events found"
            description="Create a new event to start planning."
            action={
              <Link href="/events/new">
                <Button className="mt-2">
                  <Plus className="h-4 w-4" />
                  Create event
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {data.map((event) => (
            <Card
              key={event.id}
              hover
              className="group flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/events/${event.id}`}
                  className="text-base font-semibold text-slate-900 transition-colors group-hover:text-indigo-600"
                >
                  {event.name}
                </Link>
                <StatusBadge status={event.status} />
              </div>
              <p className="text-sm text-slate-500 line-clamp-2">
                {event.description || "No description provided."}
              </p>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                  </span>
                  {dateRange(event)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate">{event.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                  </span>
                  {event.capacity} seats
                </div>
              </div>
              <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3">
                <Link href={`/events/${event.id}`}>
                  <Button size="sm" variant="secondary">
                    Open
                  </Button>
                </Link>
                {event.status === "DRAFT" && (
                  <Button size="sm" variant="outline" onClick={() => publish(event.id)}>
                    Publish
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    if (confirm(`Delete event "${event.name}"?`)) remove(event.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
