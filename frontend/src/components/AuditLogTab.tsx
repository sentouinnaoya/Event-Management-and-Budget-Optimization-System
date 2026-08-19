"use client";

import { useState } from "react";
import {
  useListAuditLogsQuery,
  useGetAuditLogStatsQuery,
} from "../lib/apiSlices";
import type { AuditLogEntry } from "../lib/types";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  Select,
  Spinner,
  formatDate,
} from "./ui";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Activity,
  Users,
  Clock,
  RefreshCw,
} from "lucide-react";

const ACTION_OPTIONS = [
  "",
  "EVENT_CREATED",
  "EVENT_UPDATED",
  "EVENT_DELETED",
  "EVENT_PUBLISHED",
  "EVENT_STATUS_CHANGED",
  "BUDGET_CATEGORY_CREATED",
  "BUDGET_CATEGORY_UPDATED",
  "BUDGET_CATEGORY_DELETED",
  "EXPENSE_CREATED",
  "EXPENSE_UPDATED",
  "EXPENSE_DELETED",
  "VENDOR_CREATED",
  "VENDOR_UPDATED",
  "VENDOR_DELETED",
  "GUEST_ADDED",
  "GUEST_APPROVED",
  "GUEST_REJECTED",
  "STAFF_CREATED",
  "STAFF_UPDATED",
  "STAFF_DELETED",
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_DELETED",
  "TASK_STATUS_CHANGED",
  "BACKUP_UPDATED",
  "RECOVERY_POINT_CREATED",
  "RECOVERY_POINT_RESTORED",
];

const ENTITY_OPTIONS = [
  "",
  "Event",
  "BudgetCategory",
  "Expense",
  "Vendor",
  "Guest",
  "Staff",
  "Task",
  "EventBackup",
  "RecoveryPoint",
];

function actionLabel(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function entityColor(entity: string): string {
  switch (entity) {
    case "Event":
      return "bg-indigo-50 text-indigo-700";
    case "BudgetCategory":
      return "bg-emerald-50 text-emerald-700";
    case "Expense":
      return "bg-amber-50 text-amber-700";
    case "Vendor":
      return "bg-violet-50 text-violet-700";
    case "Guest":
      return "bg-pink-50 text-pink-700";
    case "Staff":
      return "bg-sky-50 text-sky-700";
    case "Task":
      return "bg-orange-50 text-orange-700";
    case "EventBackup":
      return "bg-slate-50 text-slate-700";
    case "RecoveryPoint":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-50 text-slate-600";
  }
}

export default function AuditLogTab() {
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const size = 15;

  const { data: pageData, isLoading: logsLoading } = useListAuditLogsQuery({
    page,
    size,
    action: actionFilter || undefined,
    entityType: entityFilter || undefined,
  });

  const { data: stats, isLoading: statsLoading } = useGetAuditLogStatsQuery();

  const [showFilters, setShowFilters] = useState(false);

  const hasFilters = actionFilter || entityFilter;

  function clearFilters() {
    setActionFilter("");
    setEntityFilter("");
    setPage(0);
  }

  return (
    <div className="space-y-6">
      {statsLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<Activity className="h-5 w-5 text-indigo-600" />}
            label="Total Actions"
            value={stats.totalLogs.toLocaleString()}
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            label="Today"
            value={stats.todayLogs.toLocaleString()}
          />
          <StatCard
            icon={<RefreshCw className="h-5 w-5 text-emerald-600" />}
            label="Top Action"
            value={stats.topActions.length > 0 ? actionLabel(stats.topActions[0].action) : "—"}
            sub={stats.topActions.length > 0 ? `${stats.topActions[0].count}×` : undefined}
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-violet-600" />}
            label="Most Active User"
            value={stats.topUsers.length > 0 ? stats.topUsers[0].userName : "—"}
            sub={stats.topUsers.length > 0 ? `${stats.topUsers[0].count}×` : undefined}
          />
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div>
            <h3 className="font-display text-base font-medium text-slate-900">Activity Log</h3>
            <p className="text-xs text-slate-500">
              {pageData ? `${pageData.totalElements} total entries` : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters || hasFilters ? "text-indigo-600" : ""}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasFilters && (
              <span className="ml-1 h-2 w-2 rounded-full bg-indigo-600" />
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="mx-5 mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Action</label>
              <Select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                className="w-full text-xs"
              >
                <option value="">All actions</option>
                {ACTION_OPTIONS.filter(Boolean).map((a) => (
                  <option key={a} value={a}>{actionLabel(a)}</option>
                ))}
              </Select>
            </div>
            <div className="min-w-[140px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Entity</label>
              <Select
                value={entityFilter}
                onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }}
                className="w-full text-xs"
              >
                <option value="">All entities</option>
                {ENTITY_OPTIONS.filter(Boolean).map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </Select>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        )}

        {logsLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : !pageData || pageData.content.length === 0 ? (
          <EmptyState title="No audit logs yet" description="Actions will appear here as users interact with the system." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-2 pl-5 pr-4 font-medium">User</th>
                    <th className="pb-2 pr-4 font-medium">Action</th>
                    <th className="pb-2 pr-4 font-medium">Entity</th>
                    <th className="pb-2 pr-4 font-medium">Details</th>
                    <th className="pb-2 pr-5 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.content.map((entry) => (
                    <AuditRow key={entry.id} entry={entry} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
              <p className="text-xs text-slate-500">
                Page {pageData.page + 1} of {pageData.totalPages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= pageData.totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="truncate font-display text-lg font-medium text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function AuditRow({ entry }: { entry: AuditLogEntry }) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
      <td className="py-2.5 pl-5 pr-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
            {entry.userName?.charAt(0)?.toUpperCase() ?? "?"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{entry.userName}</p>
            <p className="text-xs text-slate-500">{entry.userRole?.replace("ROLE_", "")}</p>
          </div>
        </div>
      </td>
      <td className="py-2.5 pr-4">
        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {actionLabel(entry.action)}
        </span>
      </td>
      <td className="py-2.5 pr-4">
        <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${entityColor(entry.entityType)}`}>
          {entry.entityType}
        </span>
      </td>
      <td className="max-w-[240px] py-2.5 pr-4">
        <p className="truncate text-xs text-slate-600" title={entry.details || ""}>
          {entry.entityName || "—"}
        </p>
        {entry.details && (
          <p className="truncate text-xs text-slate-400" title={entry.details}>
            {entry.details}
          </p>
        )}
      </td>
      <td className="whitespace-nowrap py-2.5 pr-5 text-xs text-slate-500">
        {formatDate(entry.createdAt)}
      </td>
    </tr>
  );
}
