"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categorySchema, type CategoryInputZ } from "../../lib/schemas";
import {
  useAddCategoryMutation,
  useBudgetSummaryQuery,
  useDeleteCategoryMutation,
} from "../../lib/apiSlices";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  FieldError,
  Input,
  Label,
  Spinner,
  StatusBadge,
  apiError,
  formatMoney,
} from "../ui";

export default function BudgetTab({ eventId }: { eventId: number }) {
  const { data, isLoading } = useBudgetSummaryQuery(eventId);
  const [addCategory, { isLoading: adding }] = useAddCategoryMutation();
  const [removeCategory] = useDeleteCategoryMutation();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof categorySchema>, unknown, CategoryInputZ>({
    resolver: zodResolver(categorySchema),
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  async function onSubmit(input: CategoryInputZ) {
    try {
      await addCategory({
        eventId,
        body: {
          name: input.name,
          allocatedAmount: input.allocatedAmount,
          alertThresholdPct: input.alertThresholdPct,
        },
      }).unwrap();
      reset();
      setError(null);
    } catch (e) {
      setError(apiError(e));
    }
  }

  const utilization =
    data.totalAllocated > 0
      ? Math.min(100, Math.round((data.totalSpent / data.totalAllocated) * 100))
      : 0;

  const chartData = data.categories.map((c) => ({
    name: c.name,
    Allocated: c.allocatedAmount,
    Spent: c.spentAmount,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Allocated
          </p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {formatMoney(data.totalAllocated)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Spent
          </p>
          <p className="mt-1 text-xl font-bold text-amber-600">
            {formatMoney(data.totalSpent)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Remaining
          </p>
          <p
            className={`mt-1 text-xl font-bold ${
              data.totalRemaining >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {formatMoney(data.totalRemaining)}
          </p>
        </Card>
      </div>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">
            Overall utilization
          </p>
          <span className="text-sm font-semibold text-slate-900">
            {utilization}%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${
              utilization >= 100
                ? "bg-red-500"
                : utilization >= 80
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${utilization}%` }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Add budget category" />
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label required>Category name</Label>
              <Input
                placeholder="e.g. Venue, Food, Marketing"
                invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label required>Allocated amount</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                placeholder="5000"
                invalid={!!errors.allocatedAmount}
                {...register("allocatedAmount")}
              />
              <FieldError message={errors.allocatedAmount?.message} />
            </div>
            <div>
              <Label required>Alert threshold (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="80"
                invalid={!!errors.alertThresholdPct}
                {...register("alertThresholdPct")}
              />
              <FieldError message={errors.alertThresholdPct?.message} />
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <Button type="submit" loading={adding}>
              Add category
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="Spending by category"
            subtitle="Allocated vs spent per category"
          />
          {data.categories.length === 0 ? (
            <EmptyState
              title="No budget categories"
              description="Add categories to start allocating your budget."
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatMoney(Number(v))} />
                <Legend />
                <Bar dataKey="Allocated" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Category breakdown"
          subtitle="Budget utilization and alerts per category"
        />
        {data.categories.length === 0 ? (
          <EmptyState title="No categories yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Category</th>
                  <th className="pb-2 pr-4 font-medium">Allocated</th>
                  <th className="pb-2 pr-4 font-medium">Spent</th>
                  <th className="pb-2 pr-4 font-medium">Remaining</th>
                  <th className="pb-2 pr-4 font-medium">Usage</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {data.categories.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {c.name}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatMoney(c.allocatedAmount)}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatMoney(c.spentAmount)}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatMoney(c.remainingAmount)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              c.alertLevel === "EXCEEDED"
                                ? "bg-red-500"
                                : c.alertLevel === "WARNING"
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${Math.min(100, c.utilizationPct)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {c.utilizationPct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={c.alertLevel} />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete category "${c.name}"?`))
                            removeCategory({ eventId, id: c.id });
                        }}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {data.recommendations.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader title="Recommendations" />
          <ul className="space-y-1.5 text-sm text-slate-700">
            {data.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-600">●</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
