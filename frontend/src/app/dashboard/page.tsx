"use client";

import Link from "next/link";
import ProtectedRoute from "../../components/ProtectedRoute";
import AppShell from "../../components/AppShell";
import { useGetDashboardQuery } from "../../lib/apiSlices";
import {
  Card,
  EmptyState,
  Spinner,
  StatusBadge,
  formatDate,
  formatMoney,
} from "../../components/ui";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { data, isLoading } = useGetDashboardQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }
  if (!data) {
    return <EmptyState title="No dashboard data available" />;
  }

  const stats = [
    { label: "Total events", value: String(data.totalEvents) },
    { label: "Published", value: String(data.publishedEvents), tone: "text-blue-600" },
    { label: "Ongoing", value: String(data.ongoingEvents), tone: "text-indigo-600" },
    { label: "Completed", value: String(data.completedEvents), tone: "text-emerald-600" },
    { label: "Guests registered", value: String(data.totalGuests), tone: "text-purple-600" },
    { label: "Budget allocated", value: formatMoney(data.totalAllocated), tone: "text-slate-800" },
    { label: "Budget spent", value: formatMoney(data.totalSpent), tone: "text-amber-600" },
    {
      label: "Remaining",
      value: formatMoney(data.totalAllocated - data.totalSpent),
      tone: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Overview of your events and budget health.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {s.label}
            </p>
            <p className={`mt-1 text-xl font-bold ${s.tone ?? "text-slate-900"}`}>
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Recent events
          </h3>
          <Link
            href="/events"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            View all
          </Link>
        </div>
        {data.recentEvents.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="Create your first event to get started."
            action={
              <Link
                href="/events/new"
                className="mt-2 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Create event
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Event</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Venue</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/events/${event.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        {event.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatDate(event.date)}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{event.venue}</td>
                    <td className="py-3">
                      <StatusBadge status={event.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
