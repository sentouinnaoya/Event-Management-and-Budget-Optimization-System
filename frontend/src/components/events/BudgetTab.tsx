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
import type { AppliedAllocation, BudgetCategory, OptimizationResponse } from "../../lib/types";
import {
  useAddCategoryMutation,
  useApplyOptimizationMutation,
  useBudgetSummaryQuery,
  useDeleteCategoryMutation,
  useOptimizeBudgetMutation,
  useUpdateCategoryMutation,
} from "../../lib/apiSlices";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  FieldError,
  Input,
  Label,
  Modal,
  Select,
  Spinner,
  StatusBadge,
  apiError,
  formatMoney,
} from "../ui";

const PRIORITY_LABELS: Record<number, string> = {
  1: "Low",
  2: "Moderate",
  3: "Medium",
  4: "High",
  5: "Critical",
};

export default function BudgetTab({ eventId }: { eventId: number }) {
  const { data, isLoading } = useBudgetSummaryQuery(eventId);
  const [addCategory, { isLoading: adding }] = useAddCategoryMutation();
  const [removeCategory] = useDeleteCategoryMutation();
  const [error, setError] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<BudgetCategory | null>(null);

  const [optimizeBudget, { isLoading: optimizing }] = useOptimizeBudgetMutation();
  const [applyOptimization, { isLoading: applying }] = useApplyOptimizationMutation();
  const [budgetInput, setBudgetInput] = useState<string>("");
  const [proposal, setProposal] = useState<OptimizationResponse | null>(null);
  const [optimizerError, setOptimizerError] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null);

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
          priority: input.priority ?? 3,
        },
      }).unwrap();
      reset();
      setError(null);
    } catch (e) {
      setError(apiError(e));
    }
  }

  function openEdit(c: BudgetCategory) {
    setEditCategory(c);
  }

  async function onOptimize(e?: React.FormEvent) {
    e?.preventDefault();
    try {
      setOptimizerError(null);
      setApplyError(null);
      setAppliedMessage(null);
      const trimmed = budgetInput.trim();
      const totalBudget =
        trimmed === "" ? undefined : Number(trimmed);
      if (totalBudget !== undefined && (!Number.isFinite(totalBudget) || totalBudget < 0)) {
        setOptimizerError("Total budget must be zero or more");
        return;
      }
      const result = await optimizeBudget({ eventId, totalBudget }).unwrap();
      setProposal(result);
    } catch (err) {
      setProposal(null);
      setOptimizerError(apiError(err));
    }
  }

  async function onApply() {
    if (!proposal) return;
    try {
      setApplyError(null);
      const allocations: AppliedAllocation[] = proposal.categories.map((c) => ({
        categoryId: c.categoryId,
        suggestedAllocation: c.suggestedAllocation,
      }));
      await applyOptimization({ eventId, allocations }).unwrap();
      setProposal(null);
      setConfirmOpen(false);
      setAppliedMessage("Optimized allocations applied to your budget categories.");
    } catch (err) {
      setConfirmOpen(false);
      setApplyError(apiError(err));
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
            <div>
              <Label required>Priority</Label>
              <Select defaultValue="3" invalid={!!errors.priority} {...register("priority")}>
                {[5, 4, 3, 2, 1].map((p) => (
                  <option key={p} value={p}>
                    {p} — {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.priority?.message} />
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button type="submit" loading={adding}>
                Add category
              </Button>
            </div>
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
                  <th className="pb-2 pr-4 font-medium">Priority</th>
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
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          (c.priority ?? 3) >= 4
                            ? "bg-red-50 text-red-700"
                            : (c.priority ?? 3) <= 2
                            ? "bg-slate-100 text-slate-600"
                            : "bg-indigo-50 text-indigo-700"
                        }`}
                        title={`Priority ${c.priority ?? 3} — ${
                          PRIORITY_LABELS[c.priority ?? 3]
                        }`}
                      >
                        P{c.priority ?? 3}
                      </span>
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
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete category "${c.name}"?`))
                              removeCategory({ eventId, id: c.id });
                          }}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <OptimizerPanel
        eventId={eventId}
        currentTotal={data.totalAllocated}
        hasCategories={data.categories.length > 0}
        budgetInput={budgetInput}
        setBudgetInput={setBudgetInput}
        proposal={proposal}
        optimizing={optimizing}
        applying={applying}
        optimizerError={optimizerError}
        applyError={applyError}
        appliedMessage={appliedMessage}
        confirmOpen={confirmOpen}
        setConfirmOpen={setConfirmOpen}
        onOptimize={onOptimize}
        onApply={onApply}
        onDismiss={() => {
          setProposal(null);
          setOptimizerError(null);
        }}
      />

      {editCategory && (
        <EditCategoryModal
          eventId={eventId}
          category={editCategory}
          onClose={() => setEditCategory(null)}
        />
      )}
    </div>
  );
}

function EditCategoryModal({
  eventId,
  category,
  onClose,
}: {
  eventId: number;
  category: BudgetCategory;
  onClose: () => void;
}) {
  const [updateCategory, { isLoading: saving }] = useUpdateCategoryMutation();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof categorySchema>, unknown, CategoryInputZ>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      allocatedAmount: category.allocatedAmount,
      alertThresholdPct: category.alertThresholdPct,
      priority: category.priority ?? 3,
    },
  });

  async function onSubmit(input: CategoryInputZ) {
    try {
      await updateCategory({
        eventId,
        id: category.id,
        body: {
          name: input.name,
          allocatedAmount: input.allocatedAmount,
          alertThresholdPct: input.alertThresholdPct,
          priority: input.priority ?? 3,
        },
      }).unwrap();
      reset();
      setError(null);
      onClose();
    } catch (e) {
      setError(apiError(e));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit "${category.name}"`}
    >
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
        <div>
          <Label required>Priority</Label>
          <Select invalid={!!errors.priority} {...register("priority")}>
            {[5, 4, 3, 2, 1].map((p) => (
              <option key={p} value={p}>
                {p} — {PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
          <FieldError message={errors.priority?.message} />
        </div>
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function OptimizerPanel(props: {
  eventId: number;
  currentTotal: number;
  hasCategories: boolean;
  budgetInput: string;
  setBudgetInput: (v: string) => void;
  proposal: OptimizationResponse | null;
  optimizing: boolean;
  applying: boolean;
  optimizerError: string | null;
  applyError: string | null;
  appliedMessage: string | null;
  confirmOpen: boolean;
  setConfirmOpen: (v: boolean) => void;
  onOptimize: (e?: React.FormEvent) => void;
  onApply: () => void;
  onDismiss: () => void;
}) {
  const {
    currentTotal,
    hasCategories,
    budgetInput,
    setBudgetInput,
    proposal,
    optimizing,
    applying,
    optimizerError,
    applyError,
    appliedMessage,
    confirmOpen,
    setConfirmOpen,
    onOptimize,
    onApply,
    onDismiss,
  } = props;

  const statusStyles = proposal
    ? proposal.status === "SURPLUS"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : proposal.status === "BALANCED"
      ? "border-indigo-200 bg-indigo-50 text-indigo-800"
      : "border-amber-200 bg-amber-50 text-amber-800"
    : "";

  const changedCount = proposal
    ? proposal.categories.filter(
        (c) =>
          Math.abs(
            Number(c.deltaAmount)
          ) > 0.004
      ).length
    : 0;

  return (
    <Card className="border-indigo-200 bg-indigo-50/40">
      <CardHeader
        title="Budget optimizer"
        subtitle="Redistributes your budget across categories by priority, protecting money already spent"
      />

      <form onSubmit={onOptimize} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Label>Total budget</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            placeholder={String(currentTotal)}
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            Leave empty to use the currently allocated{" "}
            {formatMoney(currentTotal)}.
          </p>
        </div>
        <Button type="submit" loading={optimizing} disabled={!hasCategories}>
          {optimizing ? "Optimizing…" : proposal ? "Re-run optimizer" : "Run optimizer"}
        </Button>
        {proposal && (
          <Button type="button" variant="secondary" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </form>

      {!hasCategories && (
        <p className="mt-3 text-xs text-slate-500">
          Add at least one budget category to run the optimizer.
        </p>
      )}

      {appliedMessage && (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {appliedMessage}
        </div>
      )}

      {applyError && (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {applyError}
        </div>
      )}

      {optimizerError && (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {optimizerError}
        </div>
      )}

      {proposal && (
        <div className="mt-4 space-y-4">
          <div className={`rounded-lg border px-4 py-3 ${statusStyles}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{proposal.status}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-medium">
                <span>Budget: {formatMoney(proposal.totalBudget)}</span>
                <span>Required: {formatMoney(proposal.totalRequired)}</span>
                <span>Suggested: {formatMoney(proposal.totalSuggested)}</span>
              </div>
            </div>
            {proposal.notes.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs opacity-90">
                {proposal.notes.map((n, i) => (
                  <li key={i}>• {n}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-indigo-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 pb-2 pt-3 font-medium">Category</th>
                  <th className="px-3 pb-2 pt-3 font-medium">Current</th>
                  <th className="px-3 pb-2 pt-3 font-medium">Spent</th>
                  <th className="px-3 pb-2 pt-3 font-medium">Required</th>
                  <th className="px-3 pb-2 pt-3 font-medium">Suggested</th>
                  <th className="px-3 pb-2 pt-3 font-medium">Change</th>
                  <th className="px-3 pb-2 pt-3 font-medium">Coverage</th>
                  <th className="px-3 pb-2 pt-3 font-medium">Why</th>
                </tr>
              </thead>
              <tbody>
                {proposal.categories.map((c) => (
                  <tr key={c.categoryId} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 font-medium text-slate-800">
                      {c.name}
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        P{c.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {formatMoney(c.currentAllocation)}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {formatMoney(c.spentAmount)}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {formatMoney(c.requiredAmount)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {formatMoney(c.suggestedAllocation)}
                    </td>
                    <td
                      className={`px-3 py-3 font-medium ${
                        c.deltaAmount > 0
                          ? "text-emerald-600"
                          : c.deltaAmount < 0
                          ? "text-red-600"
                          : "text-slate-400"
                      }`}
                    >
                      {c.deltaAmount > 0
                        ? `+${formatMoney(c.deltaAmount)}`
                        : c.deltaAmount < 0
                        ? `−${formatMoney(Math.abs(c.deltaAmount))}`
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              c.coveragePct >= 100
                                ? "bg-emerald-500"
                                : c.coveragePct >= 70
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, c.coveragePct))}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {c.coveragePct}%
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[240px] px-3 py-3 text-xs text-slate-500">
                      {c.rationale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Nothing is saved until you apply. {changedCount} of{" "}
              {proposal.categories.length} categories would change.
            </p>
            <Button onClick={() => setConfirmOpen(true)} loading={applying}>
              Apply to categories
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Apply optimized allocations"
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            This overwrites the allocation of every listed category with the
            optimizer&apos;s suggestion ({changedCount} categories change).
            Spending records are not modified.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={onApply} loading={applying}>
              Apply changes
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
