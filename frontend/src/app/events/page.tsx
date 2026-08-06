"use client";

import { useState } from "react";
import Link from "next/link";
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
  Spinner,
  StatusBadge,
  cn,
  formatDate,
} from "../../components/ui";

const filters: Array<{ label: string; value: string }> = [
  { label: "All", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Ongoing", value: "ONGOING" },
  { label: "Completed", value: "COMPLETED" },
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

function EventsContent() {
  const [status, setStatus] = useState("");
  const { data, isLoading } = useListEventsQuery(status || undefined);
  const [publish] = usePublishEventMutation();
  const [remove] = useDeleteEventMutation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Events</h1>
          <p className="text-sm text-slate-500">
            Plan, publish, and manage your events.
          </p>
        </div>
        <Link href="/events/new">
          <Button>New event</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors",
              status === f.value
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <EmptyState
            title="No events found"
            description="Create a new event to start planning."
            action={
              <Link href="/events/new">
                <Button className="mt-2">Create event</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {data.map((event) => (
            <Card key={event.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/events/${event.id}`}
                  className="text-base font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  {event.name}
                </Link>
                <StatusBadge status={event.status} />
              </div>
              <p className="text-sm text-slate-500 line-clamp-2">
                {event.description || "No description provided."}
              </p>
              <div className="text-sm text-slate-600 space-y-1">
                <p>
                  <span className="font-medium text-slate-700">Date:</span>{" "}
                  {(event.durationInDays ?? 1) > 1
                    ? `${formatDate(event.date)} – ${formatDate(
                        new Date(
                          new Date(event.date).getTime() +
                            ((event.durationInDays ?? 1) - 1) * 86400000
                        ).toISOString().slice(0, 10)
                      )}`
                    : formatDate(event.date)}
                </p>
                <p>
                  <span className="font-medium text-slate-700">Venue:</span>{" "}
                  {event.venue}
                </p>
                <p>
                  <span className="font-medium text-slate-700">Capacity:</span>{" "}
                  {event.capacity}
                </p>
              </div>
              <div className="mt-auto flex gap-2 border-t border-slate-100 pt-3">
                <Link href={`/events/${event.id}`}>
                  <Button variant="secondary" className="px-3 py-1.5 text-xs">
                    Open
                  </Button>
                </Link>
                {event.status === "DRAFT" && (
                  <Button
                    variant="outline"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => publish(event.id)}
                  >
                    Publish
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="ml-auto px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    if (confirm(`Delete event "${event.name}"?`)) remove(event.id);
                  }}
                >
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
