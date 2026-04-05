"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { toast } from "sonner";

import { deleteDailyDelivery } from "../server/delete-daily-delivery.function";
import { getDailyDelivery } from "../server/get-daily-delivery.function";
import type { ColumnDef } from "@tanstack/react-table";
import type { DeliveryTableRow } from "@/types/moderator.types";
import { Button } from "@/components/ui/button";
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
import { useConfirm } from "@/hooks/use-confirm";
import { useModeratorSession } from "@/hooks/use-moderator-session";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";

type DeliveryTableProps = {
  refreshKey?: number;
};

function formatAmount(value: number): string {
  return `${value.toLocaleString()} /-`;
}

export const DeliveryTable = ({ refreshKey = 0 }: DeliveryTableProps) => {
  const { isAuthenticated, sessionToken } = useModeratorSession();
  const dob = useDOBStore((state) => state.dob);

  const [DeleteConfirmDialog, confirmDelete] = useConfirm(
    "Delete delivery entry?",
    "This will roll back bottle usage and customer balances for this record.",
    true,
  );

  const [rows, setRows] = React.useState<Array<DeliveryTableRow>>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const loadDeliveries = React.useCallback(async () => {
    if (!isAuthenticated || !sessionToken) {
      setRows([]);
      return;
    }

    setIsLoading(true);
    try {
      const fetchedRows = await getDailyDelivery({
        data: {
          sessionToken,
          date: dob ?? new Date(),
        },
      });
      setRows(fetchedRows);
    } catch (error) {
      console.error("Failed to fetch daily deliveries", error);
      setRows([]);
      toast.error("Failed to load daily deliveries.");
    } finally {
      setIsLoading(false);
    }
  }, [dob, isAuthenticated, sessionToken]);

  React.useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries, refreshKey]);

  const handleDelete = React.useCallback(
    async (row: DeliveryTableRow) => {
      if (!sessionToken) {
        toast.error("Session not found. Please login again.");
        return;
      }

      const confirmed = (await confirmDelete()) as boolean;
      if (!confirmed) {
        return;
      }

      setDeletingId(row.delivery.id);
      try {
        const mutationPromise = deleteDailyDelivery({
          data: {
            sessionToken,
            delivery_id: row.delivery.id,
            date: row.delivery.delivery_date,
          },
        }).then((mutationResult) => {
          if (!mutationResult.success) {
            throw new Error(mutationResult.error);
          }

          return mutationResult;
        });

        void toast.promise(mutationPromise, {
          loading: "Deleting delivery...",
          success: (mutationResult) =>
            mutationResult.message ?? "Delivery deleted successfully.",
          error: (error) =>
            error instanceof Error ? error.message : "Failed to delete delivery.",
        });

        await mutationPromise;

        await loadDeliveries();
      } catch (error) {
        console.error("Failed to delete delivery", error);
      } finally {
        setDeletingId(null);
      }
    },
    [confirmDelete, loadDeliveries, sessionToken],
  );

  const columns = React.useMemo<Array<ColumnDef<DeliveryTableRow>>>(
    () => [
      {
        accessorKey: "delivery.delivery_date",
        header: "Date",
        cell: ({ row }) => format(row.original.delivery.delivery_date, "dd MMM yyyy"),
      },
      {
        accessorKey: "customer.name",
        header: "Customer",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.customer.name}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.customer.customer_id}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "customer.area",
        header: "Area",
        cell: ({ row }) => row.original.customer.area,
      },
      {
        accessorKey: "delivery.filled_bottles",
        header: "Filled",
        cell: ({ row }) => row.original.delivery.filled_bottles,
      },
      {
        accessorKey: "delivery.empty_bottles",
        header: "Empty",
        cell: ({ row }) => row.original.delivery.empty_bottles,
      },
      {
        accessorKey: "delivery.foc",
        header: "FOC",
        cell: ({ row }) => row.original.delivery.foc,
      },
      {
        accessorKey: "delivery.damaged_bottles",
        header: "Damaged",
        cell: ({ row }) => row.original.delivery.damaged_bottles,
      },
      {
        accessorKey: "delivery.payment",
        header: "Payment",
        cell: ({ row }) => formatAmount(row.original.delivery.payment),
      },
      {
        id: "todaysBill",
        header: "Today's Bill",
        cell: ({ row }) => {
          const bill =
            (row.original.delivery.filled_bottles - row.original.delivery.foc) *
            row.original.customer.bottle_price;
          return formatAmount(Math.max(0, bill));
        },
      },
      {
        id: "remainingBalance",
        header: "Remaining Balance",
        cell: ({ row }) => formatAmount(row.original.customer.balance),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="shadow-sm"
            disabled={deletingId === row.original.delivery.id}
            onClick={() => {
              void handleDelete(row.original);
            }}
          >
            {deletingId === row.original.delivery.id ? (
              <Spinner className="size-4" />
            ) : null}
            {deletingId === row.original.delivery.id ? "Deleting..." : "Delete"}
          </Button>
        ),
      },
    ],
    [deletingId, handleDelete],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="w-full max-w-7xl rounded-3xl border bg-card p-4">
      <DeleteConfirmDialog />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Daily Deliveries</h3>
          <p className="text-xs text-muted-foreground">
            {`Showing records for ${format(dob ?? new Date(), "dd MMM yyyy")}`}
          </p>
        </div>
        {isLoading ? <Spinner className="size-4" /> : null}
      </div>

      {rows.length === 0 && !isLoading ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No delivery records found</EmptyTitle>
            <EmptyDescription>
              Add a delivery from the form above to see it here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
};