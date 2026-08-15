"use client";

import { useEffect, useState } from "react";
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
import type { AiInsight } from "../../lib/types";
import {
  useAddCategoryMutation,
  useBudgetSummaryQuery,
  useDeleteCategoryMutation,
  useGenerateBudgetInsightsMutation,
  useGetBudgetInsightsQuery,
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
  const { data: insights, isLoading: loadingInsights, refetch } =
    useGetBudgetInsightsQuery(eventId);
  const [generateInsights] = useGenerateBudgetInsightsMutation();
  const [aiError, setAiError] = useState<string | null>(null);
  const [localGenerating, setLocalGenerating] = useState(false);
  const generating = localGenerating || (insights?.generating ?? false);

  useEffect(() => {
    if (!generating) return;
    const id = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(id);
  }, [generating, refetch]);

  useEffect(() => {
    if (localGenerating && insights && !insights.generating) {
      setLocalGenerating(false);
    }
  }, [insights, localGenerating]);
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

  async function onGenerate() {
    try {
      setAiError(null);
      setLocalGenerating(true);
      await generateInsights(eventId).unwrap();
    } catch (e) {
      setLocalGenerating(false);
      setAiError(apiError(e));
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

      <Card className="border-indigo-200 bg-indigo-50/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardHeader
              title="Recommendation"
              subtitle="Analyzes the organizer's budget decisions and recommends options"
            />
            <p className="text-xs text-slate-500">
              {insights?.generatedAt
                ? `Last generated ${new Date(insights.generatedAt).toLocaleString()}`
                : "No analysis generated yet"}
            </p>
          </div>
          <Button onClick={onGenerate} loading={generating}>
            {generating ? "Generating…" : "Generate with AI"}
          </Button>
        </div>

        {generating && (
          <p className="mt-2 text-xs font-medium text-indigo-600">
            AI is analyzing your budget decisions — this usually takes about
            30 seconds.
          </p>
        )}

        {aiError && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {aiError}
          </div>
        )}

        {loadingInsights ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : insights && insights.insights.length > 0 ? (
          <div className="mt-4 space-y-4">
            {insights.insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            {generating ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                <Spinner /> Generating recommendations…
              </div>
            ) : (
              <EmptyState
                title="No analysis yet"
                description={
                  insights &&
                  insights.actionCount === 0 &&
                  data.categories.length === 0
                    ? "The AI analyzes your budget decisions once you've made some — add budget categories, vendors, or expenses, then click Generate with AI."
                    : "Click Generate with AI to get budget optimization recommendations."
                }
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function InsightCard({ insight }: { insight: AiInsight }) {
  const tone =
    insight.severity === "CRITICAL"
      ? "border-red-200 bg-red-50"
      : insight.severity === "WARNING"
      ? "border-amber-200 bg-amber-50"
      : "border-emerald-200 bg-emerald-50";
  const badge =
    insight.severity === "CRITICAL"
      ? "bg-red-100 text-red-700"
      : insight.severity === "WARNING"
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";

  return (
    <div className={`rounded-lg border p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-slate-900">{insight.topic}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}
        >
          {insight.severity}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-700">{insight.summary}</p>
      {insight.options.length > 0 && (
        <ul className="mt-3 space-y-2">
          {insight.options.map((o, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                {String.fromCharCode(65 + i)}
              </span>
              <div>
                <p className="font-medium text-slate-800">
                  {o.label}
                  {o.label === insight.recommendedOption && (
                    <span className="ml-1.5 text-xs font-semibold text-indigo-600">
                      ✓ Recommended
                    </span>
                  )}
                </p>
                {o.description && (
                  <p className="text-slate-600">{o.description}</p>
                )}
                {o.estimatedImpact && (
                  <p className="text-emerald-700">{o.estimatedImpact}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {insight.impactEstimate && (
        <p className="mt-3 border-t border-slate-200 pt-2 text-sm font-medium text-slate-700">
          Expected impact: {insight.impactEstimate}
        </p>
      )}
    </div>
  );
}
