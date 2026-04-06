"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  CheckmarkCircle03Icon,
  Loading03Icon,
  SearchIcon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, isSameDay } from "date-fns";

import type { Column, ColumnDef, SortingState } from "@tanstack/react-table";
import type { AdminExpenseRecord } from "../-server/getExpenses.function";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GeneratedAvatar } from "@/lib/avatar";

const pageSize = 20;
type ExpenseStatusFilter = "all" | "today" | "done";

function isExpenseEditable(record: AdminExpenseRecord): boolean {
  return isSameDay(record.date, new Date());
}

function getExpenseStatusLabel(record: AdminExpenseRecord): "Today's expense" | "Done" {
  return isExpenseEditable(record) ? "Today's expense" : "Done";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
}

function SortableHeader<TData, TValue>({
  column,
  title,
}: {
  column: Column<TData, TValue>;
  title: string;
}) {
  const sortDirection = column.getIsSorted();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="-ml-2 h-8"
      onClick={() => {
        column.toggleSorting(sortDirection === "asc");
      }}
    >
      {title}
      {sortDirection === "asc" ? (
        <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} data-icon="inline-end" />
      ) : null}
      {sortDirection === "desc" ? (
        <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
      ) : null}
      {!sortDirection ? (
        <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} data-icon="inline-end" />
      ) : null}
    </Button>
  );
}

type ExpenseTableProps = {
  title: string;
  description: string;
  data: Array<AdminExpenseRecord>;
  isLoading: boolean;
  onEditExpense: (expense: AdminExpenseRecord) => void;
};

export const ExpenseTable = ({
  title,
  description,
  data,
  isLoading,
  onEditExpense,
}: ExpenseTableProps) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ExpenseStatusFilter>("all");

  const statusFilteredData = React.useMemo(() => {
    if (statusFilter === "all") {
      return data;
    }

    if (statusFilter === "today") {
      return data.filter((record) => isExpenseEditable(record));
    }

    return data.filter((record) => !isExpenseEditable(record));
  }, [data, statusFilter]);

  const columns = React.useMemo<Array<ColumnDef<AdminExpenseRecord>>>(
    () => [
      {
        accessorKey: "moderatorName",
        header: ({ column }) => <SortableHeader column={column} title="Moderator" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <GeneratedAvatar seed={row.original.moderatorName} className="size-8" />
            <Button
              type="button"
              variant="link"
              className="h-auto px-0 text-left cursor-pointer underline font-semibold text-black"
              onClick={() => {
                onEditExpense(row.original);
              }}
            >
              {row.original.moderatorName}
            </Button>
          </div>
        ),
      },
      {
        accessorKey: "date",
        header: ({ column }) => <SortableHeader column={column} title="Date" />,
        cell: ({ row }) => <span>{format(row.original.date, "PPP")}</span>,
      },
      {
        id: "status",
        accessorFn: (row) => (isExpenseEditable(row) ? 1 : 0),
        header: ({ column }) => <SortableHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const isEditable = isExpenseEditable(row.original);

          return (
            <Badge
              variant="outline"
              className={isEditable ? "border-muted-foreground/40" : "border-emerald-500 text-emerald-600"}
            >
              <HugeiconsIcon
                icon={isEditable ? Loading03Icon : CheckmarkCircle03Icon}
                strokeWidth={2}
                data-icon="inline-start"
                className={isEditable ? "animate-spin text-muted-foreground" : "text-emerald-500"}
              />
              {getExpenseStatusLabel(row.original)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "amount",
        header: ({ column }) => <SortableHeader column={column} title="Amount" />,
        cell: ({ row }) => <span>{formatCurrency(row.original.amount)}</span>,
      },
      {
        accessorKey: "description",
        header: "Description",
        enableSorting: false,
        cell: ({ row }) => <p className="max-w-80 whitespace-normal">{row.original.description}</p>,
      },
      {
        accessorKey: "refilledBottles",
        header: ({ column }) => <SortableHeader column={column} title="Refilled bottles" />,
        cell: ({ row }) => <span>{row.original.refilledBottles}</span>,
      },
    ],
    [onEditExpense],
  );

  const table = useReactTable({
    data: statusFilteredData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase();
      if (query.length === 0) {
        return true;
      }

      const moderator = row.original.moderatorName.toLowerCase();
      const descriptionText = row.original.description.toLowerCase();
      return moderator.includes(query) || descriptionText.includes(query);
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <section className="w-full max-w-7xl rounded-3xl border bg-card p-4 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">{isLoading ? <Spinner className="size-4" /> : null}</div>
      </div>

      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <HugeiconsIcon
              icon={SearchIcon}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={globalFilter}
              onChange={(event) => {
                setGlobalFilter(event.target.value);
              }}
              placeholder="Search by moderator or description"
              className="pl-9"
            />
          </div>

          <ToggleGroup
            value={[statusFilter]}
            onValueChange={(values) => {
              const next = values.at(0) as ExpenseStatusFilter | undefined;
              setStatusFilter(next ?? "all");
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="today">Today's expense</ToggleGroupItem>
            <ToggleGroupItem value="done">Done</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Badge variant="outline">{`${table.getFilteredRowModel().rows.length} records`}</Badge>
      </div>

      {table.getRowModel().rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No expenses found</EmptyTitle>
            <EmptyDescription>
              Try adjusting the search text or check back after expenses are added.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
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
                    <TableCell
                      key={cell.id}
                      className={cell.column.id === "description" ? "whitespace-normal" : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {`Page ${table.getState().pagination.pageIndex + 1} of ${Math.max(table.getPageCount(), 1)}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!table.getCanPreviousPage()}
                onClick={() => {
                  table.previousPage();
                }}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!table.getCanNextPage()}
                onClick={() => {
                  table.nextPage();
                }}
              >
                Next
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};