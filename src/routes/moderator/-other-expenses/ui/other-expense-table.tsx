"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { getOtherExpense } from "../server/getOtherExpense.function";
import type { OtherExpenseRecord } from "@/types/moderator.types";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModeratorSession } from "@/hooks/use-moderator-session";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";

type OtherExpenseTableProps = {
  refreshKey?: number;
};

function formatAmount(value: number): string {
  return `${value.toLocaleString()} /-`;
}

export const OtherExpenseTable = ({ refreshKey = 0 }: OtherExpenseTableProps) => {
  const { isAuthenticated, sessionToken } = useModeratorSession();
  const dob = useDOBStore((state) => state.dob);

  const [rows, setRows] = React.useState<Array<OtherExpenseRecord>>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadExpenses = React.useCallback(async () => {
    if (!isAuthenticated || !sessionToken) {
      setRows([]);
      return;
    }

    setIsLoading(true);
    try {
      const fetchedRows = await getOtherExpense({
        data: {
          sessionToken,
          date: dob ?? new Date(),
        },
      });
      setRows(fetchedRows);
    } catch (error) {
      console.error("Failed to load other expenses", error);
      setRows([]);
      toast.error("Failed to load other expenses.");
    } finally {
      setIsLoading(false);
    }
  }, [dob, isAuthenticated, sessionToken]);

  React.useEffect(() => {
    void loadExpenses();
  }, [loadExpenses, refreshKey]);

  return (
    <section className="w-full max-w-6xl rounded-3xl border bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Other Expenses</h3>
          <p className="text-xs text-muted-foreground">
            {`Showing records for ${format(dob ?? new Date(), "dd MMM yyyy")}`}
          </p>
        </div>
        {isLoading ? <Spinner className="size-4" /> : null}
      </div>

      {rows.length === 0 && !isLoading ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No expense records found</EmptyTitle>
            <EmptyDescription>
              Add an expense from the form above to see it here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Refilled Bottles</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{format(row.createdAt, "hh:mm a")}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>{row.refilled_bottles}</TableCell>
                <TableCell>{formatAmount(row.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
};