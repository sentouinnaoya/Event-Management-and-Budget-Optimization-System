"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  CircleDollarSign,
  CircleX,
  Flag,
  Users,
  Wallet,
} from "lucide-react";
import ProtectedRoute from "../../components/ProtectedRoute";
import AppShell from "../../components/AppShell";
import { useGetDashboardQuery } from "../../lib/apiSlices";
import {
  Card,
  EmptyState,
  ProgressBar,
  Skeleton,
  StatCard,
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }
  if (!data) {
    return <EmptyState title="No dashboard data available" />;
  }

  const totalBudget = data.totalAllocated;
  const totalSpent = data.totalSpent;
  const remaining = totalBudget - totalSpent;
  const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const healthTone =
    utilization >= 90 ? "red" : utilization >= 75 ? "amber" : "emerald";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Overview of your events and budget health.
          </p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98]"
        >
          <CalendarDays className="h-4 w-4" />
          Create event
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Total events"
          value={data.totalEvents}
          icon={<CalendarDays className="h-4 w-4" />}
          accent="indigo"
        />
        <StatCard
          label="Published"
          value={data.publishedEvents}
          icon={<CalendarClock className="h-4 w-4" />}
          accent="blue"
        />
        <StatCard
          label="Ongoing"
          value={data.ongoingEvents}
          icon={<CalendarClock className="h-4 w-4" />}
          accent="emerald"
        />
        <StatCard
          label="Suspended"
          value={data.suspendedEvents}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="amber"
        />
        <StatCard
          label="Completed"
          value={data.completedEvents}
          icon={<CircleCheck className="h-4 w-4" />}
          accent="emerald"
        />
        <StatCard
          label="Failed"
          value={data.failedEvents}
          icon={<CircleX className="h-4 w-4" />}
          accent="red"
        />
        <StatCard
          label="Guests registered"
          value={data.totalGuests}
          icon={<Users className="h-4 w-4" />}
          accent="purple"
        />
        <StatCard
          label="Budget allocated"
          value={formatMoney(totalBudget)}
          icon={<Wallet className="h-4 w-4" />}
          accent="indigo"
        />
      </div>

      <Card className="border-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <CircleDollarSign className="h-4 w-4 text-indigo-600" />
              Budget health
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Overall spend vs. allocated across all events.
            </p>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-bold text-slate-900">
              {formatMoney(totalSpent)}
            </span>
            <span className="text-sm text-slate-500">
              of {formatMoney(totalBudget)}
            </span>
            <span
              className={`text-sm font-semibold ${
                healthTone === "red"
                  ? "text-red-600"
                  : healthTone === "amber"
                    ? "text-amber-600"
                    : "text-emerald-600"
              }`}
            >
              {utilization.toFixed(0)}%
            </span>
          </div>
        </div>
        <ProgressBar value={utilization} tone={healthTone} className="mt-4 h-2.5" />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Spent
            </p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">
              {formatMoney(totalSpent)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Remaining
            </p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">
              {formatMoney(remaining)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Utilization
            </p>
            <p
              className={`mt-0.5 text-base font-semibold ${
                healthTone === "red"
                  ? "text-red-600"
                  : healthTone === "amber"
                    ? "text-amber-600"
                    : "text-emerald-600"
              }`}
            >
              {utilization.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Recent events
          </h3>
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
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
                  <th className="pb-2 font-medium">Status</th>
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
                        className="group inline-flex items-center gap-2 font-medium text-slate-900 hover:text-indigo-600"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                          <Flag className="h-3.5 w-3.5" />
                        </span>
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
