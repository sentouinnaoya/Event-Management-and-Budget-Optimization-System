"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import AppShell from "../../../components/AppShell";
import { useGetEventQuery } from "../../../lib/apiSlices";
import { Spinner, StatusBadge, cn } from "../../../components/ui";
import OverviewTab from "../../../components/events/OverviewTab";
import BudgetTab from "../../../components/events/BudgetTab";
import VendorsTab from "../../../components/events/VendorsTab";
import StaffTab from "../../../components/events/StaffTab";
import TasksTab from "../../../components/events/TasksTab";
import GuestsTab from "../../../components/events/GuestsTab";
import ExpensesTab from "../../../components/events/ExpensesTab";
import ReportsTab from "../../../components/events/ReportsTab";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "budget", label: "Budget" },
  { key: "vendors", label: "Vendors" },
  { key: "staff", label: "Staff" },
  { key: "tasks", label: "Tasks" },
  { key: "guests", label: "Guests" },
  { key: "expenses", label: "Expenses" },
  { key: "reports", label: "Reports" },
];

export default function EventDetailPage() {
  const params = useParams();
  const eventId = Number(params.id);
  const [tab, setTab] = useState("overview");
  const { data: event, isLoading } = useGetEventQuery(eventId);

  if (isLoading || !event) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{event.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <StatusBadge status={event.status} />
              <span>{event.venue}</span>
              <span>·</span>
              <span>{event.date}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-slate-200">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  tab === t.key
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" && <OverviewTab eventId={eventId} />}
          {tab === "budget" && <BudgetTab eventId={eventId} />}
          {tab === "vendors" && <VendorsTab eventId={eventId} />}
          {tab === "staff" && <StaffTab eventId={eventId} />}
          {tab === "tasks" && <TasksTab eventId={eventId} />}
          {tab === "guests" && <GuestsTab eventId={eventId} />}
          {tab === "expenses" && <ExpensesTab eventId={eventId} />}
          {tab === "reports" && <ReportsTab eventId={eventId} />}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
