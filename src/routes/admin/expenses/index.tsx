"use client";

import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { startOfDay, subDays } from "date-fns";
import { toast } from "sonner";

import { getExpenses } from "./-server/getExpenses.function";
import { updateExpense } from "./-server/updateExpense.function";
import { ExpenseForm } from "./-ui/expense-form";
import { ExpenseTable } from "./-ui/expense-table";
import type { AdminExpenseRecord } from "./-server/getExpenses.function";
import type { ExpenseFormValues } from "./-ui/expense-form";

async function loadExpenses(): Promise<Array<AdminExpenseRecord>> {
  return await getExpenses();
}

function ScrambleNumber({ value }: { value: number }) {
  const [display, setDisplay] = React.useState("0");

  React.useEffect(() => {
    let frame = 0;
    const totalFrames = 22;

    const timer = window.setInterval(() => {
      frame += 1;
      const progress = frame / totalFrames;

      if (progress >= 1) {
        setDisplay(String(value));
        window.clearInterval(timer);
        return;
      }

      const maxRange = Math.max(Math.abs(value), 10);
      const variation = 1.2 - progress * 0.7;
      const randomValue = Math.floor(Math.random() * maxRange * variation);
      setDisplay(String(randomValue));
    }, 42);

    return () => {
      window.clearInterval(timer);
    };
  }, [value]);

  return <span className="tabular-nums font-heading text-2xl sm:text-3xl text-destructive">{display}</span>;
}

export const Route = createFileRoute("/admin/expenses/")({
  loader: async () => {
    return {
      expenses: await loadExpenses(),
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { expenses: initialExpenses } = Route.useLoaderData();

  const [expenses, setExpenses] = React.useState<Array<AdminExpenseRecord>>(initialExpenses);
  const [isLoading, setIsLoading] = React.useState(false);

  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedExpense, setSelectedExpense] = React.useState<AdminExpenseRecord | null>(null);

  const lastThirtyDaySummary = React.useMemo(() => {
    const from = subDays(startOfDay(new Date()), 29);
    const filtered = expenses.filter((expense) => expense.createdAt >= from);

    return {
      count: filtered.length,
      total: filtered.reduce((sum, expense) => sum + expense.amount, 0),
    };
  }, [expenses]);

  const refreshExpenses = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const updated = await loadExpenses();
      setExpenses(updated);
    } catch (error) {
      console.error("Failed to refresh expenses", error);
      toast.error("Failed to refresh expense records.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEditExpense = React.useCallback(
    async (values: ExpenseFormValues) => {
      if (!selectedExpense) {
        return;
      }

      const mutationPromise = updateExpense({
        data: {
          expenseId: selectedExpense.id,
          moderatorId: selectedExpense.moderatorId,
          data: values,
        },
      });

      void toast.promise(mutationPromise, {
        loading: "Updating expense...",
        success: "Expense updated successfully.",
        error: (error) => (error instanceof Error ? error.message : "Failed to update expense."),
      });

      await mutationPromise;
      setIsEditOpen(false);
      setSelectedExpense(null);
      await refreshExpenses();
    },
    [refreshExpenses, selectedExpense],
  );

  return (
    <main className="flex w-full flex-col items-center gap-4 p-4">
      <section className="w-full max-w-7xl px-4 py-6">
        <h1 className="text-balance text-xl leading-tight font-medium sm:text-2xl">
          You have <ScrambleNumber value={lastThirtyDaySummary.count} /> expenses totaling at <span className="text-destructive sm:text-3xl">Rs.</span> <ScrambleNumber value={lastThirtyDaySummary.total} /> for last 30 days.
        </h1>
      </section>

      <ExpenseTable
        title="Expense Records"
        description="Review moderator expenses and edit only records created today."
        data={expenses}
        isLoading={isLoading}
        onEditExpense={(expense) => {
          setSelectedExpense(expense);
          setIsEditOpen(true);
        }}
      />

      <ExpenseForm
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedExpense(null);
          }
        }}
        expense={selectedExpense}
        onSubmit={handleEditExpense}
      />
    </main>
  );
}
