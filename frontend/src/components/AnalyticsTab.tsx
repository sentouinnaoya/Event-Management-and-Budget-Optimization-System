"use client";

import { useGetAnalyticsQuery } from "../lib/apiSlices";
import {
  Card,
  Spinner,
} from "./ui";
import {
  Calendar,
  Users,
  UserCheck,
  Truck,
  ClipboardList,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Activity,
} from "lucide-react";

export default function AnalyticsTab() {
  const { data, isLoading } = useGetAnalyticsQuery();

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const { overview, eventBreakdown, financial, guests, tasks, topUsers, recentEvents, recentGuests } = data;

  const totalGuestStatuses = guests.registered + guests.approved + guests.rejected + guests.attended + guests.absent;
  const guestApprovalRate = totalGuestStatuses > 0
    ? Math.round(((guests.approved + guests.attended) / totalGuestStatuses) * 100)
    : 0;
  const taskCompletionRate = tasks.total > 0
    ? Math.round((tasks.done / tasks.total) * 100)
    : 0;
  const budgetUtilization = financial.totalAllocated > 0
    ? Math.round((financial.totalSpent / financial.totalAllocated) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <OverviewCard
          icon={<Calendar className="h-5 w-5" />}
          label="Events"
          value={overview.totalEvents}
          color="bg-indigo-50 text-indigo-600"
        />
        <OverviewCard
          icon={<Users className="h-5 w-5" />}
          label="Users"
          value={overview.totalUsers}
          sub={overview.todayUsers > 0 ? `+${overview.todayUsers} today` : undefined}
          color="bg-violet-50 text-violet-600"
        />
        <OverviewCard
          icon={<UserCheck className="h-5 w-5" />}
          label="Guests"
          value={overview.totalGuests}
          color="bg-emerald-50 text-emerald-600"
        />
        <OverviewCard
          icon={<Truck className="h-5 w-5" />}
          label="Vendors"
          value={overview.totalVendors}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event Status Breakdown */}
        <Card className="p-5">
          <h3 className="mb-4 font-display text-sm font-medium text-slate-900">Events by Status</h3>
          <div className="space-y-3">
            <StatusBar label="Draft" count={eventBreakdown.draft} total={overview.totalEvents} color="bg-slate-400" />
            <StatusBar label="Published" count={eventBreakdown.published} total={overview.totalEvents} color="bg-indigo-500" />
            <StatusBar label="Ongoing" count={eventBreakdown.ongoing} total={overview.totalEvents} color="bg-emerald-500" />
            <StatusBar label="Suspended" count={eventBreakdown.suspended} total={overview.totalEvents} color="bg-amber-500" />
            <StatusBar label="Completed" count={eventBreakdown.completed} total={overview.totalEvents} color="bg-green-500" />
            <StatusBar label="Failed" count={eventBreakdown.failed} total={overview.totalEvents} color="bg-red-500" />
            <StatusBar label="Archived" count={eventBreakdown.archived} total={overview.totalEvents} color="bg-gray-300" />
          </div>
        </Card>

        {/* Financial Overview */}
        <Card className="p-5">
          <h3 className="mb-4 font-display text-sm font-medium text-slate-900">Financial Overview</h3>
          <div className="mb-4">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="font-display text-2xl font-semibold text-slate-900">
                {budgetUtilization}%
              </span>
              <span className="text-xs text-slate-500">budget used</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  budgetUtilization >= 90 ? "bg-red-500" : budgetUtilization >= 75 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Allocated</p>
              <p className="font-display text-sm font-semibold text-slate-900">
                {formatCurrency(financial.totalAllocated)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Spent</p>
              <p className="font-display text-sm font-semibold text-slate-900">
                {formatCurrency(financial.totalSpent)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Remaining</p>
              <p className="font-display text-sm font-semibold text-emerald-600">
                {formatCurrency(financial.totalRemaining)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span>{financial.totalExpenses} expenses total</span>
            <span className="text-amber-600">{financial.pendingExpenses} pending</span>
          </div>
        </Card>

        {/* Guest Analytics */}
        <Card className="p-5">
          <h3 className="mb-4 font-display text-sm font-medium text-slate-900">Guest Analytics</h3>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold text-slate-900">{guestApprovalRate}%</span>
            <span className="text-xs text-slate-500">approval rate</span>
          </div>
          <div className="space-y-2">
            <GuestBar label="Registered" count={guests.registered} total={totalGuestStatuses} color="bg-blue-400" />
            <GuestBar label="Approved" count={guests.approved} total={totalGuestStatuses} color="bg-emerald-400" />
            <GuestBar label="Attended" count={guests.attended} total={totalGuestStatuses} color="bg-green-500" />
            <GuestBar label="Rejected" count={guests.rejected} total={totalGuestStatuses} color="bg-red-400" />
            <GuestBar label="Absent" count={guests.absent} total={totalGuestStatuses} color="bg-gray-300" />
          </div>
        </Card>

        {/* Task Health */}
        <Card className="p-5">
          <h3 className="mb-4 font-display text-sm font-medium text-slate-900">Task Health</h3>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold text-slate-900">{taskCompletionRate}%</span>
            <span className="text-xs text-slate-500">completion rate</span>
          </div>
          <div className="mb-4">
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${taskCompletionRate}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">To Do</p>
              <p className="font-display text-lg font-semibold text-slate-900">{tasks.todo}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">In Progress</p>
              <p className="font-display text-lg font-semibold text-amber-600">{tasks.inProgress}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Done</p>
              <p className="font-display text-lg font-semibold text-emerald-600">{tasks.done}</p>
            </div>
          </div>
          {tasks.overdue > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="h-4 w-4" />
              {tasks.overdue} overdue task{tasks.overdue !== 1 ? "s" : ""}
            </div>
          )}
        </Card>
      </div>

      {/* Activity + Trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Active Users */}
        <Card className="p-5">
          <h3 className="mb-4 font-display text-sm font-medium text-slate-900">Most Active Users</h3>
          {topUsers.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">No activity recorded yet</p>
          ) : (
            <div className="space-y-2">
              {topUsers.map((u, i) => (
                <div key={u.userId} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                    {u.userName?.charAt(0)?.toUpperCase() ?? "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{u.userName}</p>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {u.actionCount} actions
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 7-Day Event Trend */}
        <Card className="p-5">
          <h3 className="mb-4 font-display text-sm font-medium text-slate-900">Events Created (7 days)</h3>
          <MiniBarChart data={recentEvents} />
        </Card>
      </div>

      {/* 7-Day Guest Trend */}
      <Card className="p-5">
        <h3 className="mb-4 font-display text-sm font-medium text-slate-900">Guest Registrations (7 days)</h3>
        <MiniBarChart data={recentGuests} color="bg-emerald-400" />
      </Card>
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </span>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="font-display text-2xl font-semibold text-slate-900">{value.toLocaleString()}</p>
      {sub && <p className="mt-0.5 text-xs text-emerald-600">{sub}</p>}
    </div>
  );
}

function StatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-slate-600">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-medium text-slate-700">{count}</span>
    </div>
  );
}

function GuestBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-slate-600">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-medium text-slate-700">{count}</span>
    </div>
  );
}

function MiniBarChart({
  data,
  color = "bg-indigo-400",
}: {
  data: { date: string; count: number }[];
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-2" style={{ height: 120 }}>
      {data.map((d) => {
        const height = max > 0 ? (d.count / max) * 100 : 0;
        const day = new Date(d.date + "T00:00:00").toLocaleDateString("en", { weekday: "short" });
        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-slate-500">{d.count > 0 ? d.count : ""}</span>
            <div className="w-full" style={{ height: 80 }}>
              <div
                className={`w-full rounded-t-sm ${color} transition-all`}
                style={{ height: `${height}%`, minHeight: d.count > 0 ? 4 : 0 }}
              />
            </div>
            <span className="text-[10px] text-slate-400">{day}</span>
          </div>
        );
      })}
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `MMK ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `MMK ${(value / 1_000).toFixed(1)}K`;
  return `MMK ${value.toLocaleString()}`;
}
