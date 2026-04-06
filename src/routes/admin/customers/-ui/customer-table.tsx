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
  Copy,
  SearchIcon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { toast } from "sonner";

import type { Column, ColumnDef, SortingState } from "@tanstack/react-table";
import type { CustomerRecord } from "../-server/getAllCustomers.function";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { GeneratedAvatar } from "@/lib/avatar";

const pageSize = 20;

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
        <HugeiconsIcon
          icon={ArrowUp01Icon}
          strokeWidth={2}
          data-icon="inline-end"
        />
      ) : null}
      {sortDirection === "desc" ? (
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          data-icon="inline-end"
        />
      ) : null}
      {!sortDirection ? (
        <HugeiconsIcon
          icon={UnfoldMoreIcon}
          strokeWidth={2}
          data-icon="inline-end"
        />
      ) : null}
    </Button>
  );
}

type CustomerTableProps = {
  title: string;
  description: string;
  data: Array<CustomerRecord>;
  isLoading: boolean;
  headerAction?: React.ReactNode;
  onEdit: (customer: CustomerRecord) => void;
};

export const CustomerTable = ({
  title,
  description,
  data,
  isLoading,
  headerAction,
  onEdit,
}: CustomerTableProps) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const copyToClipboard = React.useCallback(
    async (value: string, label: string) => {
      try {
        await navigator.clipboard.writeText(value);
        toast.success(`${label} copied to clipboard.`);
      } catch (error) {
        console.error(`Failed to copy ${label.toLowerCase()}`, error);
        toast.error(`Failed to copy ${label.toLowerCase()}.`);
      }
    },
    []
  );

  const columns = React.useMemo<Array<ColumnDef<CustomerRecord>>>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Name" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <GeneratedAvatar seed={row.original.name} className="size-8" />
            <Button
              type="button"
              variant="link"
              className="h-auto cursor-pointer px-0 text-left font-semibold text-black underline"
              onClick={() => {
                onEdit(row.original);
              }}
            >
              {row.original.name}
            </Button>
          </div>
        ),
      },
      {
        accessorKey: "customer_id",
        header: ({ column }) => (
          <SortableHeader column={column} title="Customer ID" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>{row.original.customer_id}</span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 cursor-pointer"
              onClick={() => {
                void copyToClipboard(row.original.customer_id, "Customer ID");
              }}
            >
              <HugeiconsIcon icon={Copy} />
            </Button>
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>{row.original.phone}</span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 cursor-pointer"
              onClick={() => {
                void copyToClipboard(row.original.phone, "Phone number");
              }}
            >
              <HugeiconsIcon icon={Copy} />
            </Button>
          </div>
        ),
      },
      {
        accessorKey: "balance",
        header: ({ column }) => (
          <SortableHeader column={column} title="Balance" />
        ),
        cell: ({ row }) => {
          if (row.original.balance > 0) {
            return (
              <span className="text-xs font-medium text-destructive">
                {`Balance: ${formatCurrency(row.original.balance)}`}
              </span>
            );
          }

          if (row.original.balance < 0) {
            return (
              <span className="text-xs font-medium text-emerald-500">
                {`Advance: ${formatCurrency(Math.abs(row.original.balance))}`}
              </span>
            );
          }

          return <span className="text-xs text-muted-foreground">Settled</span>;
        },
      },
      {
        accessorKey: "bottles",
        header: ({ column }) => (
          <SortableHeader column={column} title="Empty" />
        ),
      },
      {
        accessorKey: "deposit",
        header: ({ column }) => (
          <SortableHeader column={column} title="Deposit" />
        ),
      },
      {
        accessorKey: "deposit_price",
        header: ({ column }) => (
          <SortableHeader column={column} title="Deposit Price" />
        ),
        cell: ({ row }) => (
          <span>{formatCurrency(row.original.deposit_price)}</span>
        ),
      },
      {
        accessorKey: "bottle_price",
        header: ({ column }) => (
          <SortableHeader column={column} title="Bottle Price" />
        ),
        cell: ({ row }) => (
          <span>{formatCurrency(row.original.bottle_price)}</span>
        ),
      },
      {
        accessorKey: "area",
        header: ({ column }) => <SortableHeader column={column} title="Area" />,
      },
      {
        id: "address",
        accessorFn: (row) => row.address.length,
        header: "Address",
        enableSorting: false,
        cell: ({ row }) => {
          const address = row.original.address.trim();
          const preview =
            address.length > 48 ? `${address.slice(0, 48)}...` : address;

          return (
            <Accordion className="w-80">
              <AccordionItem value={`address-${row.original.id}`}>
                <AccordionTrigger className="w-full p-2 text-xs font-medium">
                  <span className="truncate text-left">{preview}</span>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <p className="max-w-md text-xs whitespace-normal text-muted-foreground">
                    {row.original.address}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        },
      },
      {
        accessorKey: "customerSince",
        header: ({ column }) => (
          <SortableHeader column={column} title="Customer Since" />
        ),
        cell: ({ row }) => (
          <Badge variant={"outline"}>
            {format(row.original.customerSince, "PPP")}
          </Badge>
        ),
      },
    ],
    [copyToClipboard, onEdit]
  );

  const table = useReactTable({
    data,
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

      const fields = [
        row.original.name,
        row.original.customer_id,
        row.original.phone,
        row.original.area,
        row.original.address,
      ];

      return fields.some((field) => field.toLowerCase().includes(query));
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
    <section className="w-full max-w-7xl overflow-x-hidden rounded-3xl border bg-card p-4 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? <Spinner className="size-4" /> : null}
          {headerAction}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
            placeholder="Search by name, ID, area, phone or address"
            className="pl-9"
          />
        </div>
        <Badge
          variant="outline"
          className="w-fit"
        >{`${table.getFilteredRowModel().rows.length} records`}</Badge>
      </div>

      {table.getRowModel().rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No customers found</EmptyTitle>
            <EmptyDescription>
              Try adjusting the search text or add a new customer.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[1100px]">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
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
                        className={
                          cell.column.id === "address"
                            ? "whitespace-normal"
                            : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
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
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
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
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  data-icon="inline-end"
                />
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
