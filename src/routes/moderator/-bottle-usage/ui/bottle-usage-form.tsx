"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { addUpdateBottleUsage } from "../server/addUpdateBottleUsage.function";
import { deleteBottleUsage } from "../server/deleteBottleUsage.function";
import { getBottleUsage } from "../server/getBottleUsage.function";
import { getSalesAndExpenses } from "../server/getSalesAndExpenses.function";
import { markAsDone } from "../server/markAsDone.function";
import { BottleReturnForm } from "./bottle-return-form";
import { BottleUsageTable } from "./bottle-usage-table";
import { DobSelector } from "./dob-selector";
import type {
  BottleUsageView,
  SalesExpenseSummary,
} from "@/types/moderator.types";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useConfirm } from "@/hooks/use-confirm";
import { useModeratorSession } from "@/hooks/use-moderator-session";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";

const INITIAL_SUMMARY: SalesExpenseSummary = {
  sales: 0,
  revenue: 0,
  expenses: 0,
  misc_revenue: 0,
  refilled_bottles: 0,
  net: 0,
};

function toPositiveNumber(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function formatAmount(value: number): string {
  return `${value.toLocaleString()} /-`;
}

export const BottleUsageForm = () => {
  const { isAuthenticated, sessionToken } = useModeratorSession();
  const dob = useDOBStore((state) => state.dob);
  const setDOB = useDOBStore((state) => state.setDOB);

  const [MarkDoneDialog, confirmMarkDone] = useConfirm(
    "Mark bottle usage as done?",
    "This will lock further bottle-usage and return updates for this date until reverted.",
  );
  const [RevertDialog, confirmRevert] = useConfirm(
    "Revert done status?",
    "This will re-open this date for bottle-usage updates.",
  );
  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete bottle usage?",
    "This removes the bottle usage record for the selected date. Delete is blocked when any delivery record exists for that date.",
    true,
  );

  const [view, setView] = React.useState<BottleUsageView>({
    available_bottles: 0,
    usage: null,
  });
  const [summary, setSummary] = React.useState<SalesExpenseSummary>(INITIAL_SUMMARY);
  const [usageValues, setUsageValues] = React.useState({
    filled_bottles: 0,
    caps: 0,
  });
  const [usageFormError, setUsageFormError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSavingUsage, setIsSavingUsage] = React.useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [isDeletingUsage, setIsDeletingUsage] = React.useState(false);

  React.useEffect(() => {
    if (!dob) {
      setDOB(new Date());
    }
  }, [dob, setDOB]);

  const loadData = React.useCallback(async () => {
    if (!isAuthenticated || !sessionToken || !dob) {
      setView({ available_bottles: 0, usage: null });
      setSummary(INITIAL_SUMMARY);
      return;
    }

    setIsLoading(true);
    try {
      const [fetchedView, fetchedSummary] = await Promise.all([
        getBottleUsage({
          data: {
            sessionToken,
            date: dob,
          },
        }),
        getSalesAndExpenses({
          data: {
            sessionToken,
            date: dob,
          },
        }),
      ]);

      setView(fetchedView);
      setSummary(fetchedSummary);
      setUsageValues({
        filled_bottles: fetchedView.usage?.filled_bottles ?? 0,
        caps: fetchedView.usage?.caps ?? 0,
      });
    } catch (error) {
      console.error("Failed to load bottle usage", error);
      toast.error("Failed to load bottle usage data.");
      setView({ available_bottles: 0, usage: null });
      setSummary(INITIAL_SUMMARY);
    } finally {
      setIsLoading(false);
    }
  }, [dob, isAuthenticated, sessionToken]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleUsageSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setUsageFormError(null);

    if (!isAuthenticated || !sessionToken) {
      toast.error("Session not found. Please login again.");
      return;
    }

    if (!dob) {
      setUsageFormError("Please select a date first.");
      return;
    }

    setIsSavingUsage(true);
    try {
      const mutationPromise = addUpdateBottleUsage({
        data: {
          sessionToken,
          date: dob,
          filled_bottles: usageValues.filled_bottles,
          caps: usageValues.caps,
        },
      }).then((mutationResult) => {
        if (!mutationResult.success) {
          throw new Error(mutationResult.error);
        }

        return mutationResult;
      });

      void toast.promise(mutationPromise, {
        loading: "Saving bottle usage...",
        success: (mutationResult) =>
          mutationResult.message ?? "Bottle usage saved successfully.",
        error: (error) =>
          error instanceof Error ? error.message : "Failed to save bottle usage.",
      });

      await mutationPromise;

      await loadData();
    } catch (error) {
      console.error("Failed to save bottle usage", error);
      const message =
        error instanceof Error ? error.message : "Failed to save bottle usage.";
      setUsageFormError(message);
    } finally {
      setIsSavingUsage(false);
    }
  };

  const updateDoneStatus = async (done: boolean) => {
    if (!sessionToken || !dob) {
      toast.error("Please select a valid session and date.");
      return;
    }

    const confirmed = ((done
      ? await confirmMarkDone()
      : await confirmRevert()) ?? false) as boolean;

    if (!confirmed) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const mutationPromise = markAsDone({
        data: {
          sessionToken,
          date: dob,
          done,
        },
      }).then((mutationResult) => {
        if (!mutationResult.success) {
          throw new Error(mutationResult.error);
        }

        return mutationResult;
      });

      void toast.promise(mutationPromise, {
        loading: done ? "Marking as done..." : "Reverting status...",
        success: (mutationResult) =>
          mutationResult.message ?? (done ? "Marked as done." : "Reverted."),
        error: (error) =>
          error instanceof Error
            ? error.message
            : "Failed to update bottle usage status.",
      });

      await mutationPromise;

      await loadData();
    } catch (error) {
      console.error("Failed to update bottle usage status", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteUsage = async () => {
    if (!sessionToken || !dob || !view.usage) {
      toast.error("Select a valid date and bottle usage record first.");
      return;
    }

    const confirmed = ((await confirmDelete()) ?? false) as boolean;
    if (!confirmed) {
      return;
    }

    setIsDeletingUsage(true);
    try {
      const mutationPromise = deleteBottleUsage({
        data: {
          sessionToken,
          date: dob,
        },
      }).then((mutationResult) => {
        if (!mutationResult.success) {
          throw new Error(mutationResult.error);
        }

        return mutationResult;
      });

      void toast.promise(mutationPromise, {
        loading: "Deleting bottle usage...",
        success: (mutationResult) =>
          mutationResult.message ?? "Bottle usage deleted successfully.",
        error: (error) =>
          error instanceof Error ? error.message : "Failed to delete bottle usage.",
      });

      await mutationPromise;

      await loadData();
    } catch (error) {
      console.error("Failed to delete bottle usage", error);
    } finally {
      setIsDeletingUsage(false);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <MarkDoneDialog />
      <RevertDialog />
      <DeleteDialog />

      <DobSelector />

      <BottleUsageTable
        availableBottles={view.available_bottles}
        usage={view.usage}
        isLoading={isLoading}
      />

      <Separator />

      <section className="rounded-3xl border bg-muted/30 p-4 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium">
            {view.usage ? "Update Bottle Usage" : "Add Bottle Usage"}
          </h3>
          {dob ? (
            <p className="text-xs text-muted-foreground">
              {`For ${format(dob, "dd MMM yyyy")}`}
            </p>
          ) : null}
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleUsageSubmit}>
          <FieldGroup className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="usage-filled-bottles">Filled Bottles</FieldLabel>
              <div className="rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
                <Input
                  id="usage-filled-bottles"
                  type="number"
                  min={0}
                  className="rounded-xl border border-border/70 bg-background shadow-[0_2px_5px_rgba(0,0,0,0.16)]"
                  value={usageValues.filled_bottles}
                  onChange={(event) => {
                    setUsageValues((current) => ({
                      ...current,
                      filled_bottles: toPositiveNumber(event.target.value),
                    }));
                  }}
                  disabled={isSavingUsage || view.usage?.done}
                />
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="usage-caps">Caps</FieldLabel>
              <div className="rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
                <Input
                  id="usage-caps"
                  type="number"
                  min={0}
                  className="rounded-xl border border-border/70 bg-background shadow-[0_2px_5px_rgba(0,0,0,0.16)]"
                  value={usageValues.caps}
                  onChange={(event) => {
                    setUsageValues((current) => ({
                      ...current,
                      caps: toPositiveNumber(event.target.value),
                    }));
                  }}
                  disabled={isSavingUsage || view.usage?.done}
                />
              </div>
            </Field>
          </FieldGroup>

          {usageFormError ? <FieldError errors={[{ message: usageFormError }]} /> : null}

          <Button
            type="submit"
            disabled={isSavingUsage || view.usage?.done}
            className="shadow-sm"
          >
            {isSavingUsage ? <Spinner className="size-4" /> : null}
            {isSavingUsage
              ? "Saving Bottle Usage..."
              : view.usage
                ? "Update Bottle Usage"
                : "Add Bottle Usage"}
          </Button>
        </form>
      </section>

      <Separator />

      <section className="rounded-3xl border bg-muted/30 p-4 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
        <h3 className="mb-3 text-sm font-medium">Bottle Return</h3>
        <BottleReturnForm usage={view.usage} date={dob} onReturned={loadData} />
      </section>

      <Separator />

      <section className="rounded-3xl border bg-muted/30 p-4 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium">Sales & Expenses</h3>
          {isLoading ? <Spinner className="size-4" /> : null}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">Sales (bottles)</p>
            <p className="text-lg font-semibold">{summary.sales}</p>
          </div>
          <div className="rounded-2xl border bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-lg font-semibold">{formatAmount(summary.revenue)}</p>
          </div>
          <div className="rounded-2xl border bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-lg font-semibold">{formatAmount(summary.expenses)}</p>
          </div>
          <div className="rounded-2xl border bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">Misc Revenue</p>
            <p className="text-lg font-semibold">{formatAmount(summary.misc_revenue)}</p>
          </div>
          <div className="rounded-2xl border bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">Refilled Bottles</p>
            <p className="text-lg font-semibold">{summary.refilled_bottles}</p>
          </div>
          <div className="rounded-2xl border bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">Net</p>
            <p className="text-lg font-semibold">{formatAmount(summary.net)}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="shadow-sm"
            onClick={() => {
              void updateDoneStatus(true);
            }}
            disabled={!view.usage || view.usage.done || isUpdatingStatus}
          >
            {isUpdatingStatus && view.usage && !view.usage.done ? (
              <Spinner className="size-4" />
            ) : null}
            Mark As Done
          </Button>
          <Button
            type="button"
            variant="outline"
            className="shadow-sm"
            onClick={() => {
              void updateDoneStatus(false);
            }}
            disabled={!view.usage || !view.usage.done || isUpdatingStatus}
          >
            {isUpdatingStatus && view.usage?.done ? <Spinner className="size-4" /> : null}
            Revert
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="shadow-sm"
            onClick={() => {
              void handleDeleteUsage();
            }}
            disabled={!view.usage || view.usage.done || isDeletingUsage || isUpdatingStatus}
          >
            {isDeletingUsage ? <Spinner className="size-4" /> : null}
            {isDeletingUsage ? "Deleting..." : "Delete Bottle Usage"}
          </Button>
        </div>
      </section>
    </section>
  );
};