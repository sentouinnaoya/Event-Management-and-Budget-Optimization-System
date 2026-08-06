"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useAttendanceReportQuery,
  useBudgetReportQuery,
  useDailyOverviewQuery,
  useDailyReportQuery,
  useExpensesReportQuery,
  useStaffReportQuery,
  useSummaryReportQuery,
  useVendorsReportQuery,
} from "../../lib/apiSlices";
import {
  Card,
  CardHeader,
  EmptyState,
  Spinner,
  StatusBadge,
  formatDate,
  formatMoney,
} from "../ui";

const pieColors = ["#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#a855f7"];

export default function ReportsTab({ eventId }: { eventId: number }) {
  const summary = useSummaryReportQuery(eventId);
  const budget = useBudgetReportQuery(eventId);
  const expenses = useExpensesReportQuery(eventId);
  const vendors = useVendorsReportQuery(eventId);
  const staff = useStaffReportQuery(eventId);
  const attendance = useAttendanceReportQuery(eventId);
  const dailyOverview = useDailyOverviewQuery(eventId);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const daily = useDailyReportQuery(
    { eventId, date: selectedDate },
    { skip: !selectedDate }
  );

  const rangeLabel = useMemo(() => {
    const event = summary.data?.event;
    if (!event) return undefined;
    const days = event.durationInDays ?? 1;
    if (days <= 1) return formatDate(event.date);
    const end = new Date(event.date);
    end.setDate(end.getDate() + days - 1);
    return `${formatDate(event.date)} – ${formatDate(end.toISOString().slice(0, 10))}`;
  }, [summary.data]);

  useEffect(() => {
    if (!selectedDate && summary.data?.event?.date) {
      setSelectedDate(summary.data.event.date);
    }
  }, [summary.data, selectedDate]);

  if (
    summary.isLoading ||
    budget.isLoading ||
    expenses.isLoading ||
    vendors.isLoading ||
    staff.isLoading ||
    attendance.isLoading
  ) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const s = summary.data;
  const b = budget.data;
  const e = expenses.data;
  const v = vendors.data;
  const st = staff.data;
  const a = attendance.data;
  const overview = dailyOverview.data;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Event summary"
          subtitle={s ? `${s.event.name} · ${rangeLabel}` : undefined}
        />
        {s && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              { label: "Guests", value: String(s.totalGuests) },
              { label: "Approved", value: String(s.approvedGuests) },
              { label: "Vendors", value: String(s.vendorCount) },
              { label: "Staff", value: String(s.staffCount) },
              { label: "Tasks done", value: `${s.tasksDone}/${s.taskCount}` },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Budget report" subtitle="Allocated vs spent" />
          {b && b.categories.length === 0 ? (
            <EmptyState title="No budget data" />
          ) : (
            b && (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={b.categories.map((c) => ({
                    name: c.name,
                    Allocated: c.allocatedAmount,
                    Spent: c.spentAmount,
                  }))}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => formatMoney(Number(val))} />
                  <Legend />
                  <Bar dataKey="Allocated" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spent" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          )}
          {b && (
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="text-slate-600">
                Spent <b>{formatMoney(b.totalSpent)}</b> of{" "}
                <b>{formatMoney(b.totalAllocated)}</b> allocated
              </span>
              <span
                className={`font-semibold ${
                  b.totalRemaining >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                ({formatMoney(b.totalRemaining)} remaining)
              </span>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Attendance report" subtitle="Guests by status" />
          {a && a.total === 0 ? (
            <EmptyState title="No attendance data" />
          ) : (
            a && (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Registered", value: a.registered },
                      { name: "Approved", value: a.approved },
                      { name: "Attended", value: a.attended },
                      { name: "Absent", value: a.absent },
                      { name: "Rejected", value: a.rejected },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label
                  >
                    {["Registered", "Approved", "Attended", "Absent", "Rejected"].map(
                      (name, i) => (
                        <Cell key={name} fill={pieColors[i]} />
                      )
                    )}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Expense report" />
        {e && (
          <div className="mb-3 flex flex-wrap gap-4 text-sm">
            <span className="text-slate-600">
              Total: <b className="text-slate-900">{formatMoney(e.totalSpent)}</b>
            </span>
            <span className="text-emerald-600">
              Paid: {formatMoney(e.totalPaid)}
            </span>
            <span className="text-amber-600">
              Pending: {formatMoney(e.totalPending)}
            </span>
          </div>
        )}
        {!e || e.expenses.length === 0 ? (
          <EmptyState title="No expenses" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Description</th>
                  <th className="pb-2 pr-4 font-medium">Category</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody>
                {e.expenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {exp.description}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{exp.categoryName}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatDate(exp.expenseDate)}
                    </td>
                    <td className="py-3 pr-4 text-slate-800">
                      {formatMoney(exp.amount)}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={exp.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Daily breakdown"
          subtitle="Per-day activity during the event"
        />
        {dailyOverview.isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !overview || overview.days.length === 0 ? (
          <EmptyState title="No day data" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Day</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Spent</th>
                  <th className="pb-2 pr-4 font-medium">Registered</th>
                  <th className="pb-2 pr-4 font-medium">Tasks created</th>
                  <th className="pb-2 pr-4 font-medium">Tasks due</th>
                  <th className="pb-2 pr-4 font-medium">Tasks done</th>
                  <th className="pb-2 font-medium">Vendors added</th>
                </tr>
              </thead>
              <tbody>
                {overview.days.map((day) => (
                  <tr
                    key={day.date}
                    className={`cursor-pointer border-b border-slate-100 last:border-0 ${
                      day.date === selectedDate
                        ? "bg-indigo-50"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {day.day}/{overview.totalDays}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatDate(day.date)}
                    </td>
                    <td className="py-3 pr-4 text-slate-800">
                      {formatMoney(day.totalSpent)}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{day.registered}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {day.tasksCreated}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{day.tasksDue}</td>
                    <td className="py-3 pr-4 text-emerald-600">
                      {day.tasksCompleted}
                    </td>
                    <td className="py-3 text-slate-600">{day.vendorsAdded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader
            title={`Day detail · ${formatDate(selectedDate)}`}
            subtitle={
              daily.data
                ? `Day ${daily.data.day} of ${daily.data.totalDays}`
                : undefined
            }
          />
          {daily.isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : daily.error ? (
            <EmptyState title="No data for this day" />
          ) : (
            daily.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { label: "Spent", value: formatMoney(daily.data.totalSpent) },
                    { label: "Registered", value: String(daily.data.registered) },
                    { label: "Approved", value: String(daily.data.approved) },
                    { label: "Attended", value: String(daily.data.attended) },
                    { label: "Absent", value: String(daily.data.absent) },
                    { label: "Tasks done", value: String(daily.data.tasksCompleted) },
                    { label: "Tasks due", value: String(daily.data.tasksDue) },
                    { label: "Vendors added", value: String(daily.data.vendorsAdded) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">{item.label}</p>
                      <p className="mt-0.5 text-lg font-bold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                {daily.data.expenses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                          <th className="pb-2 pr-4 font-medium">Description</th>
                          <th className="pb-2 pr-4 font-medium">Category</th>
                          <th className="pb-2 pr-4 font-medium">Amount</th>
                          <th className="pb-2 font-medium">Payment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {daily.data.expenses.map((exp) => (
                          <tr key={exp.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-3 pr-4 font-medium text-slate-800">
                              {exp.description}
                            </td>
                            <td className="py-3 pr-4 text-slate-600">
                              {exp.categoryName}
                            </td>
                            <td className="py-3 pr-4 text-slate-800">
                              {formatMoney(exp.amount)}
                            </td>
                            <td className="py-3">
                              <StatusBadge status={exp.paymentStatus} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState title="No expenses on this day" />
                )}
              </div>
            )
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Vendor report" />
          {v && (
            <>
              <p className="mb-3 text-sm text-slate-600">
                Total assigned:{" "}
                <b className="text-slate-900">{formatMoney(v.totalAssigned)}</b>{" "}
                ({v.vendors.length} vendor(s))
              </p>
              {v.vendors.length === 0 ? (
                <EmptyState title="No vendors" />
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {v.vendors.map((vendor) => (
                    <li key={vendor.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-slate-800">{vendor.name}</p>
                        <p className="text-xs text-slate-500">
                          {vendor.serviceType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-700">
                          {vendor.assignedAmount
                            ? formatMoney(vendor.assignedAmount)
                            : "—"}
                        </p>
                        <StatusBadge status={vendor.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Card>

        <Card>
          <CardHeader title="Staff performance" />
          {st && (
            <>
              <p className="mb-3 text-sm text-slate-600">
                Tasks completed:{" "}
                <b className="text-slate-900">
                  {st.tasksDone}/{st.totalTasks}
                </b>
              </p>
              {st.staff.length === 0 ? (
                <EmptyState title="No staff" />
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {st.staff.map((member) => (
                    <li key={member.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-slate-800">{member.name}</p>
                        <p className="text-xs text-slate-500">
                          {member.responsibility}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {member.phone || ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
