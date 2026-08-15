"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { expenseSchema, type ExpenseInputZ } from "../../lib/schemas";
import {
  useAddExpenseMutation,
  useBudgetSummaryQuery,
  useDeleteExpenseMutation,
  useListExpensesQuery,
  useListVendorsQuery,
} from "../../lib/apiSlices";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  FieldError,
  Input,
  Label,
  Select,
  Spinner,
  StatusBadge,
  apiError,
  formatDate,
  formatMoney,
} from "../ui";

export default function ExpensesTab({ eventId }: { eventId: number }) {
  const { data: expenses, isLoading } = useListExpensesQuery(eventId);
  const { data: budget } = useBudgetSummaryQuery(eventId);
  const { data: vendors } = useListVendorsQuery(eventId);
  const [addExpense, { isLoading: adding }] = useAddExpenseMutation();
  const [removeExpense] = useDeleteExpenseMutation();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof expenseSchema>, unknown, ExpenseInputZ>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { paymentStatus: "PENDING" },
  });

  if (isLoading || !expenses) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const totalPaid = expenses
    .filter((e) => e.paymentStatus === "PAID")
    .reduce((sum, e) => sum + e.amount, 0);

  async function onSubmit(input: ExpenseInputZ) {
    try {
      await addExpense({
        eventId,
        body: {
          description: input.description,
          categoryId: Number(input.categoryId),
          vendorId: input.vendorId ? Number(input.vendorId) : null,
          amount: input.amount,
          expenseDate: input.expenseDate,
          paymentStatus: input.paymentStatus,
        },
      }).unwrap();

      const category = budget?.categories.find(
        (c) => c.id === Number(input.categoryId)
      );
      const categoryOver = category
        ? category.spentAmount + input.amount - category.allocatedAmount
        : 0;
      const eventOver = budget
        ? budget.totalSpent + input.amount - budget.totalAllocated
        : 0;

      if (categoryOver > 0) {
        toast.error(
          `Category "${category?.name ?? "this category"}" is over budget by ${formatMoney(
            categoryOver
          )} after this expense`
        );
      }
      if (eventOver > 0) {
        toast.error(
          `Event budget exceeded by ${formatMoney(eventOver)} after this expense`
        );
      }

      reset();
      setError(null);
    } catch (e) {
      setError(apiError(e));
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total spent
          </p>
          <p className="mt-1 text-xl font-bold text-amber-600">
            {formatMoney(expenses.reduce((s, e) => s + e.amount, 0))}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Paid
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-600">
            {formatMoney(totalPaid)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Pending
          </p>
          <p className="mt-1 text-xl font-bold text-slate-700">
            {formatMoney(
              expenses.reduce((s, e) => s + e.amount, 0) - totalPaid
            )}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Record an expense" />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label required>Description</Label>
            <Input
              placeholder="e.g. Catering deposit"
              invalid={!!errors.description}
              {...register("description")}
            />
            <FieldError message={errors.description?.message} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label required>Category</Label>
              <Select invalid={!!errors.categoryId} {...register("categoryId")}>
                <option value="">Select category</option>
                {(budget?.categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.categoryId?.message} />
            </div>
            <div>
              <Label>Vendor</Label>
              <Select {...register("vendorId")}>
                <option value="">No vendor</option>
                {(vendors ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label required>Amount</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                invalid={!!errors.amount}
                {...register("amount")}
              />
              <FieldError message={errors.amount?.message} />
            </div>
            <div>
              <Label required>Date</Label>
              <Input
                type="date"
                invalid={!!errors.expenseDate}
                {...register("expenseDate")}
              />
              <FieldError message={errors.expenseDate?.message} />
            </div>
            <div>
              <Label required>Payment</Label>
              <Select {...register("paymentStatus")}>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
              </Select>
            </div>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <Button type="submit" loading={adding}>
            Add expense
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="Expenses"
          subtitle={`${expenses.length} expense(s) recorded`}
        />
        {expenses.length === 0 ? (
          <EmptyState title="No expenses yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Description</th>
                  <th className="pb-2 pr-4 font-medium">Category</th>
                  <th className="pb-2 pr-4 font-medium">Vendor</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Amount</th>
                  <th className="pb-2 pr-4 font-medium">Payment</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {e.description}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{e.categoryName}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {e.vendorName ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatDate(e.expenseDate)}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {formatMoney(e.amount)}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={e.paymentStatus} />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm("Delete this expense?"))
                            removeExpense({ eventId, id: e.id });
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
    </div>
  );
}
