"use client";

import { useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import AppShell from "../../components/AppShell";
import AuditLogTab from "../../components/AuditLogTab";
import AnalyticsTab from "../../components/AnalyticsTab";
import {
  useChangeUserRoleMutation,
  useListUserActivityQuery,
  useGetUserActivityQuery,
} from "../../lib/apiSlices";
import type { UserActivitySummary } from "../../lib/types";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  Select,
  Spinner,
  StatusBadge,
  formatDate,
} from "../../components/ui";
import { Users, ShieldCheck, BarChart3, ChevronDown, ChevronRight } from "lucide-react";

type TabKey = "users" | "audit" | "analytics";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { key: "audit", label: "Audit Trail", icon: <ShieldCheck className="h-4 w-4" /> },
];

export default function AdminPage() {
  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <AppShell>
        <AdminContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function AdminContent() {
  const [tab, setTab] = useState<TabKey>("analytics");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-medium text-slate-900">
          Admin
        </h1>
        <p className="text-sm text-slate-500">System administration and oversight.</p>
      </div>

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "analytics" && <AnalyticsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "audit" && <AuditLogTab />}
    </div>
  );
}

function UsersTab() {
  const { data: users, isLoading } = useListUserActivityQuery();
  const [changeRole] = useChangeUserRoleMutation();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading || !users) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Users"
        subtitle={`${users.length} registered user(s)`}
      />
      {users.length === 0 ? (
        <EmptyState title="No users" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pl-5 pr-4 font-medium">User</th>
                <th className="pb-2 pr-4 font-medium">Events</th>
                <th className="pb-2 pr-4 font-medium">Guests</th>
                <th className="pb-2 pr-4 font-medium">Tasks</th>
                <th className="pb-2 pr-4 font-medium">Spent</th>
                <th className="pb-2 pr-4 font-medium">Role</th>
                <th className="pb-2 pr-5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  expanded={expandedId === u.id}
                  onToggle={() => setExpandedId(expandedId === u.id ? null : u.id)}
                  changeRole={changeRole}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function UserRow({
  user,
  expanded,
  onToggle,
  changeRole,
}: {
  user: UserActivitySummary;
  expanded: boolean;
  onToggle: () => void;
  changeRole: (args: { id: number; role: string }) => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
        onClick={onToggle}
      >
        <td className="py-3 pl-5 pr-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
              {user.fullName?.charAt(0)?.toUpperCase() ?? "?"}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{user.fullName}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
        </td>
        <td className="py-3 pr-4">
          <span className="font-medium text-slate-700">{user.eventCount}</span>
        </td>
        <td className="py-3 pr-4">
          <span className="font-medium text-slate-700">{user.guestCount}</span>
        </td>
        <td className="py-3 pr-4">
          <span className="font-medium text-slate-700">{user.taskCount}</span>
        </td>
        <td className="py-3 pr-4 text-xs text-slate-600">
          {formatCurrency(user.expenseTotal)}
        </td>
        <td className="py-3 pr-4">
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <StatusBadge status={user.role} />
            <Select
              value={user.role}
              onChange={(e) => changeRole({ id: user.id, role: e.target.value })}
              className="w-28 px-2 py-1 text-xs"
            >
              <option value="ORGANIZER">Organizer</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
        </td>
        <td className="py-3 pr-5">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
            <UserActivityDetailPanel userId={user.id} />
          </td>
        </tr>
      )}
    </>
  );
}

function UserActivityDetailPanel({ userId }: { userId: number }) {
  const { data: detail, isLoading } = useGetUserActivityQuery(userId);

  if (isLoading || !detail) {
    return <div className="flex justify-center py-4"><Spinner /></div>;
  }

  const taskDonePct = detail.taskCount > 0 ? Math.round((detail.tasksDone / detail.taskCount) * 100) : 0;
  const totalStatuses = detail.eventBreakdown.reduce((s, e) => s + e.count, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-slate-500">Event Status</h4>
        {detail.eventBreakdown.filter(e => e.count > 0).length === 0 ? (
          <p className="text-xs text-slate-400">No events</p>
        ) : (
          detail.eventBreakdown.filter(e => e.count > 0).map((e) => (
            <div key={e.status} className="flex items-center gap-2">
              <StatusBadge status={e.status} />
              <span className="text-xs font-medium text-slate-600">{e.count}</span>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-slate-500">Tasks</h4>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-lg font-semibold text-slate-900">{taskDonePct}%</span>
          <span className="text-xs text-slate-500">done</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${taskDonePct}%` }} />
        </div>
        <p className="text-xs text-slate-500">{detail.tasksDone} of {detail.taskCount} completed</p>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-slate-500">Financials</h4>
        <p className="font-display text-lg font-semibold text-slate-900">{formatCurrency(detail.expenseTotal)}</p>
        <p className="text-xs text-slate-500">total expenses</p>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-slate-500">Guests: {detail.guestCount}</span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500">Unread: {detail.unreadNotifications}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-slate-500">Recent Activity</h4>
        {detail.recentAuditLogs.length === 0 ? (
          <p className="text-xs text-slate-400">No activity yet</p>
        ) : (
          <div className="space-y-1.5">
            {detail.recentAuditLogs.slice(0, 5).map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                <div className="min-w-0">
                  <p className="truncate text-xs text-slate-700">
                    {log.action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {log.entityName} · {formatDate(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `MMK ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `MMK ${(value / 1_000).toFixed(1)}K`;
  return `MMK ${value.toLocaleString()}`;
}
