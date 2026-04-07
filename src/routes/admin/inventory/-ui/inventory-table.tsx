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
import { format } from "date-fns";

import type { Column, ColumnDef, SortingState } from "@tanstack/react-table";
import type { InventoryBottleUsageRecord } from "../-server/getBottleUsageRecords.function";
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
}

type InventoryActivityFilter = "all" | "nonZero";

function isZeroActivity(record: InventoryBottleUsageRecord): boolean {
  return (
    record.filled === 0 &&
    record.empty === 0 &&
    record.emptyReturned === 0 &&
    record.remainingReturned === 0 &&
    record.capsTaken === 0
  );
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

type InventoryTableProps = {
  title: string;
  description: string;
  data: Array<InventoryBottleUsageRecord>;
  isLoading: boolean;
  onEdit: (usage: InventoryBottleUsageRecord) => void;
};

export const InventoryTable = ({
  title,
  description,
  data,
  isLoading,
  onEdit,
}: InventoryTableProps) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [activityFilter, setActivityFilter] = React.useState<InventoryActivityFilter>("all");

  const filteredData = React.useMemo(() => {
    if (activityFilter === "all") {
      return data;
    }

    return data.filter((record) => !isZeroActivity(record));
  }, [activityFilter, data]);

  const columns = React.useMemo<Array<ColumnDef<InventoryBottleUsageRecord>>>(
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
              className="h-auto cursor-pointer px-0 text-left font-semibold text-black underline"
              onClick={() => {
                onEdit(row.original);
              }}
            >
              {row.original.moderatorName}
            </Button>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <SortableHeader column={column} title="Date" />,
        cell: ({ row }) => <span>{format(row.original.createdAt, "PPPP")}</span>,
      },
      {
        id: "status",
        accessorFn: (row) => (row.done ? 0 : 1),
        header: ({ column }) => <SortableHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const done = row.original.done;

          return (
            <Badge
              variant="outline"
              className={done ? "border-emerald-500 text-emerald-600" : "border-muted-foreground/40"}
            >
              <HugeiconsIcon
                icon={done ? CheckmarkCircle03Icon : Loading03Icon}
                strokeWidth={2}
                data-icon="inline-start"
                className={done ? "text-emerald-500" : "animate-spin text-muted-foreground"}
              />
              {done ? "Done" : "Today's usage"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "revenue",
        header: ({ column }) => <SortableHeader column={column} title="Revenue" />,
        cell: ({ row }) => (
          <span className="text-xs font-medium text-emerald-500">
            {formatCurrency(row.original.revenue)}
          </span>
        ),
      },
      {
        accessorKey: "expense",
        header: ({ column }) => <SortableHeader column={column} title="Expense" />,
        cell: ({ row }) => (
          <span className="text-xs font-medium text-destructive">
            {formatCurrency(row.original.expense)}
          </span>
        ),
      },
      {
        accessorKey: "filled",
        header: ({ column }) => <SortableHeader column={column} title="Filled" />,
      },
      {
        accessorKey: "refilled",
        header: ({ column }) => <SortableHeader column={column} title="Refilled" />,
      },
      {
        accessorKey: "sales",
        header: ({ column }) => <SortableHeader column={column} title="Sales" />,
      },
      {
        accessorKey: "empty",
        header: ({ column }) => <SortableHeader column={column} title="Empty" />,
      },
      {
        accessorKey: "remaining",
        header: ({ column }) => <SortableHeader column={column} title="Remaining" />,
      },
      {
        id: "returned",
        accessorFn: (row) => row.returned,
        header: ({ column }) => <SortableHeader column={column} title="Returned" />,
        cell: ({ row }) => (
          <div className="flex min-w-32 flex-col gap-1 text-xs">
            <span className="text-muted-foreground">{`Empty: ${row.original.emptyReturned}`}</span>
            <span className="text-muted-foreground">{`Remaining: ${row.original.remainingReturned}`}</span>
          </div>
        ),
      },
      {
        accessorKey: "damaged",
        header: ({ column }) => <SortableHeader column={column} title="Damaged" />,
      },
      {
        id: "caps",
        accessorFn: (row) => row.capsTaken,
        header: ({ column }) => <SortableHeader column={column} title="Caps" />,
        cell: ({ row }) => (
          <div className="flex min-w-24 flex-col gap-1 text-xs">
            <span>{`Taken: ${row.original.capsTaken}`}</span>
            <span className="text-muted-foreground">{`Used: ${row.original.capsUsed}`}</span>
          </div>
        ),
      },
    ],
    [onEdit],
  );

  const table = useReactTable({
    data: filteredData,
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

      return row.original.moderatorName.toLowerCase().includes(query);
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

  React.useEffect(() => {
    table.setPageIndex(0);
  }, [activityFilter, globalFilter, table]);

  return (
    <section className="w-full max-w-7xl overflow-x-hidden rounded-3xl border bg-card p-4 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? <Spinner className="size-4" /> : null}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
              placeholder="Search by moderator"
              className="pl-9"
            />
          </div>

          <ToggleGroup
            value={[activityFilter]}
            onValueChange={(values) => {
              const next = values.at(0) as InventoryActivityFilter | undefined;
              setActivityFilter(next ?? "all");
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="all">All records</ToggleGroupItem>
            <ToggleGroupItem value="nonZero">Non-zero activity</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Badge variant="outline" className="w-fit">{`${table.getFilteredRowModel().rows.length} records`}</Badge>
      </div>

      {table.getRowModel().rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No bottle usage records found</EmptyTitle>
            <EmptyDescription>
              Try adjusting search or check back after records are added.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[1600px]">
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
          </div>

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