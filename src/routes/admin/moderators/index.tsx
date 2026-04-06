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
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  CancelCircleHalfDotIcon,
  CheckmarkCircle03Icon,
  Delete02Icon,
  Loading03Icon,
  MinusSignIcon,
  MoreHorizontalCircle01Icon,
  PlusSignCircleIcon,
  PlusSignIcon,
  SearchIcon,
  Settings05Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { z } from "zod";
import { toast } from "sonner";

import {
  createModerator,
  deleteModerator,
  getModList,
  updateModStatus,
  updateModerator,
} from "./-server/crudModerators.function";
import { getSalesAndExpenses } from "./-server/getSalesAndExpenses.function";
import type { Column, ColumnDef, SortingState } from "@tanstack/react-table";
import type { ModeratorMutationInput, ModeratorRecord } from "./-server/crudModerators.function";
import type { ModeratorSalesAndExpenses } from "./-server/getSalesAndExpenses.function";
import { areas_list } from "@/db/areas";
import { GeneratedAvatar } from "@/lib/avatar";
import { useConfirm } from "@/hooks/use-confirm";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ModeratorWithMetrics = ModeratorRecord & ModeratorSalesAndExpenses;

type ModeratorFormValues = {
  name: string;
  password: string;
  areas: Array<string>;
  isWorking: boolean;
};

const pageSize = 20;

const moderatorFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  password: z.string().trim().min(1, "Password is required."),
  areas: z
    .array(
      z
        .string()
        .trim()
        .refine((value) => areas_list.includes(value), {
          message: "Select a valid area.",
        }),
    )
    .min(1, "At least one area is required."),
  isWorking: z.boolean(),
});

async function loadModeratorsWithMetrics(): Promise<Array<ModeratorWithMetrics>> {
  const moderators = await getModList();

  const summaries = await Promise.all(
    moderators.map(async (moderator) => {
      try {
        const summary = await getSalesAndExpenses({ data: moderator.name });
        return {
          ...moderator,
          sales: summary.sales,
          expenses: summary.expenses,
        };
      } catch (error) {
        console.error(`Failed to load sales/expenses for ${moderator.name}`, error);
        return {
          ...moderator,
          sales: 0,
          expenses: 0,
        };
      }
    }),
  );

  return summaries;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
}

function toMutationInput(values: ModeratorFormValues): ModeratorMutationInput {
  return {
    name: values.name.trim(),
    password: values.password.trim(),
    areas: Array.from(new Set(values.areas.map((area) => area.trim()))),
    isWorking: values.isWorking,
  };
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

type ModeratorFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  defaultValues: ModeratorFormValues;
  onSubmit: (values: ModeratorFormValues) => Promise<void>;
};

function ModeratorFormSheet({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  defaultValues,
  onSubmit,
}: ModeratorFormSheetProps) {
  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: moderatorFormSchema,
    },
    onSubmitInvalid: () => {
      toast.error("Please review the moderator form fields.");
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <form
          className="flex flex-col gap-6 px-6 pb-6"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <div className="rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
                      <Input
                        id={field.name}
                        value={field.state.value}
                        aria-invalid={isInvalid}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value);
                        }}
                        className="rounded-xl border border-border/70 bg-background"
                      />
                    </div>
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="password"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <div className="rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
                      <Input
                        id={field.name}
                        type="text"
                        value={field.state.value}
                        aria-invalid={isInvalid}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value);
                        }}
                        className="rounded-xl border border-border/70 bg-background"
                      />
                    </div>
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="areas"
              mode="array"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Areas</FieldLabel>
                    <div className="flex flex-col gap-2">
                      {field.state.value.map((area, index) => (
                        <div key={`${field.name}-${index}`} className="flex items-center gap-2">
                          <div className="min-w-0 flex-1 rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
                            <Combobox
                              value={area || null}
                              items={areas_list}
                              onValueChange={(nextValue) => {
                                field.replaceValue(index, nextValue ?? areas_list[0]);
                              }}
                            >
                              <ComboboxInput
                                className="w-full rounded-xl border border-border/70 bg-background"
                                placeholder="Search and select area"
                                showClear
                              ></ComboboxInput>
                              <ComboboxContent>
                                <ComboboxEmpty>No area found.</ComboboxEmpty>
                                <ComboboxList>
                                  <ComboboxCollection>
                                    {(areaOption, areaIndex) => (
                                      <ComboboxItem key={`${areaOption}-${areaIndex}`} value={areaOption}>
                                        {areaOption}
                                      </ComboboxItem>
                                    )}
                                  </ComboboxCollection>
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                          </div>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            className="shadow-sm"
                            disabled={field.state.value.length <= 1}
                            onClick={() => {
                              field.removeValue(index);
                            }}
                          >
                            <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} />
                            <span className="sr-only">Remove area</span>
                          </Button>
                        </div>
                      ))}

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-fit shadow-sm"
                        onClick={() => {
                          field.pushValue(areas_list[0]);
                        }}
                      >
                        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
                        Add Area
                      </Button>
                    </div>
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="isWorking"
              children={(field) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="moderator-working-checkbox"
                    checked={field.state.value}
                    onCheckedChange={(checked) => {
                      field.handleChange(Boolean(checked));
                    }}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="moderator-working-checkbox">Working Status</FieldLabel>
                    <p className="text-xs text-muted-foreground">
                      Checked means this moderator appears in working list.
                    </p>
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>

          <form.Subscribe
            selector={(state) => ({
              isSubmitting: state.isSubmitting,
            })}
            children={({ isSubmitting }) => (
              <Button type="submit" className="shadow-sm" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="size-4" /> : null}
                {isSubmitting ? "Saving..." : submitLabel}
              </Button>
            )}
          />
        </form>
      </SheetContent>
    </Sheet>
  );
}

type ModeratorTableProps = {
  title: string;
  description: string;
  data: Array<ModeratorWithMetrics>;
  isLoading: boolean;
  removedTable: boolean;
  headerAction?: React.ReactNode;
  onEdit: (moderator: ModeratorWithMetrics) => void;
  onToggleStatus: (moderator: ModeratorWithMetrics) => void;
  onDelete: (moderator: ModeratorWithMetrics) => void;
};

function ModeratorDataTable({
  title,
  description,
  data,
  isLoading,
  removedTable,
  headerAction,
  onEdit,
  onToggleStatus,
  onDelete,
}: ModeratorTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [revealedPasswords, setRevealedPasswords] = React.useState<Record<string, boolean>>({});

  const togglePasswordVisibility = React.useCallback((moderatorId: string) => {
    setRevealedPasswords((current) => ({
      ...current,
      [moderatorId]: !current[moderatorId],
    }));
  }, []);

  const columns = React.useMemo<Array<ColumnDef<ModeratorWithMetrics>>>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Moderator" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <GeneratedAvatar seed={row.original.name} className="size-8" />
            <div className="flex flex-col">
              <span className="font-medium">{row.original.name}</span>
              <span className="text-xs text-muted-foreground">{format(row.original.createdAt, "PPP")}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "password",
        header: "Password",
        enableSorting: false,
        cell: ({ row }) => {
          const isRevealed = Boolean(revealedPasswords[row.original.id]);
          const maskedPassword = "*".repeat(Math.max(row.original.password.length, 8));

          return (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-auto justify-start px-2 py-1 font-mono text-xs"
              onClick={() => {
                togglePasswordVisibility(row.original.id);
              }}
              aria-label={isRevealed ? "Hide password" : "Reveal password"}
            >
              {isRevealed ? row.original.password : maskedPassword}
            </Button>
          );
        },
      },
      {
        id: "areas",
        accessorFn: (row) => row.areas.length,
        header: ({ column }) => <SortableHeader column={column} title="Areas" />,
        cell: ({ row }) => (
          <Accordion className="w-56">
            <AccordionItem value={`areas-${row.original.id}`}>
              <AccordionTrigger className="p-2 text-xs font-medium">
                {`${row.original.areas.length} assigned area(s)`}
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {row.original.areas.map((area) => (
                    <li key={`${row.original.id}-${area}`}>{area}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ),
      },
      {
        id: "salesAndExpenses",
        accessorFn: (row) => row.sales,
        header: ({ column }) => <SortableHeader column={column} title="Sales / Expenses" />,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-emerald-600">
              {`Sales: ${formatCurrency(row.original.sales)}`}
            </span>
            <span className="text-xs text-destructive">
              {`Expenses: ${formatCurrency(row.original.expenses)}`}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "isWorking",
        header: ({ column }) => <SortableHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const isWorking = row.original.isWorking;

          return (
            <Badge
              variant="outline"
              className={
                isWorking
                  ? "border-muted-foreground/40"
                  : "border-destructive text-destructive"
              }
            >
              <HugeiconsIcon
                icon={isWorking ? Loading03Icon : CancelCircleHalfDotIcon}
                strokeWidth={2}
                data-icon="inline-start"
                className={isWorking ? "animate-spin text-muted-foreground" : "text-destructive"}
              />
              {isWorking ? "Working" : "Removed"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <Popover>
            <PopoverTrigger
              className="rounded-2xl"
              render={
                <Button type="button" size="icon-sm" variant="outline" className="shadow-sm">
                  <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
                  <span className="sr-only">Open moderator actions</span>
                </Button>
              }
            />
            <PopoverContent className="w-64">
              <PopoverHeader>
                <PopoverDescription>{row.original.name}</PopoverDescription>
              </PopoverHeader>

              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    onEdit(row.original);
                  }}
                >
                  <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} data-icon="inline-start" />
                  Edit
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    onToggleStatus(row.original);
                  }}
                >
                  <HugeiconsIcon
                    icon={removedTable ? CheckmarkCircle03Icon : CancelCircleHalfDotIcon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  {removedTable ? "Restore worker" : "Remove worker"}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  className="justify-start"
                  onClick={() => {
                    onDelete(row.original);
                  }}
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
                  Delete moderator
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ),
      },
    ],
    [onDelete, onEdit, onToggleStatus, removedTable, revealedPasswords, togglePasswordVisibility],
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

      const name = row.original.name.toLowerCase();
      const areas = row.original.areas.join(" ").toLowerCase();
      return name.includes(query) || areas.includes(query);
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
        <div className="flex items-center gap-2">
          {isLoading ? <Spinner className="size-4" /> : null}
          {headerAction}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
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
            placeholder="Search by name or area"
            className="pl-9"
          />
        </div>
        <Badge variant="outline">{`${table.getFilteredRowModel().rows.length} records`}</Badge>
      </div>

      {table.getRowModel().rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No moderators found</EmptyTitle>
            <EmptyDescription>
              Try changing the search text or create a new moderator.
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
                    <TableCell key={cell.id} className="align-top">
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
}

export const Route = createFileRoute("/admin/moderators/")({
  loader: async () => {
    return {
      moderators: await loadModeratorsWithMetrics(),
    };
  },
  component: ModeratorsRouteComponent,
});

function ModeratorsRouteComponent() {
  const { moderators: initialModerators } = Route.useLoaderData();

  const [moderators, setModerators] = React.useState<Array<ModeratorWithMetrics>>(initialModerators);
  const [isLoading, setIsLoading] = React.useState(false);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedModerator, setSelectedModerator] =
    React.useState<ModeratorWithMetrics | null>(null);

  const [DeleteConfirmDialog, confirmDelete] = useConfirm(
    "Delete moderator?",
    "This action is permanent and cannot be undone.",
    true,
  );

  const [StatusConfirmDialog, confirmStatusChange] = useConfirm(
    "Change moderator status?",
    "This will move the moderator between working and removed tables.",
  );

  const refreshModerators = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const updated = await loadModeratorsWithMetrics();
      setModerators(updated);
    } catch (error) {
      console.error("Failed to refresh moderators", error);
      toast.error("Failed to refresh moderator records.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateModerator = React.useCallback(
    async (values: ModeratorFormValues) => {
      const payload = toMutationInput(values);
      const mutationPromise = createModerator({ data: payload });

      void toast.promise(mutationPromise, {
        loading: "Creating moderator...",
        success: "Moderator created successfully.",
        error: (error) => (error instanceof Error ? error.message : "Failed to create moderator."),
      });

      await mutationPromise;
      setIsCreateOpen(false);
      await refreshModerators();
    },
    [refreshModerators],
  );

  const handleEditModerator = React.useCallback(
    async (values: ModeratorFormValues) => {
      if (!selectedModerator) {
        return;
      }

      const payload = toMutationInput(values);
      const mutationPromise = updateModerator({
        data: {
          name: selectedModerator.name,
          data: payload,
        },
      });

      void toast.promise(mutationPromise, {
        loading: "Updating moderator...",
        success: "Moderator updated successfully.",
        error: (error) => (error instanceof Error ? error.message : "Failed to update moderator."),
      });

      await mutationPromise;
      setIsEditOpen(false);
      setSelectedModerator(null);
      await refreshModerators();
    },
    [refreshModerators, selectedModerator],
  );

  const handleToggleStatus = React.useCallback(
    async (moderator: ModeratorWithMetrics) => {
      const confirmed = (await confirmStatusChange()) as boolean;
      if (!confirmed) {
        return;
      }

      const mutationPromise = updateModStatus({
        data: {
          name: moderator.name,
          currentStatus: moderator.isWorking,
        },
      });

      void toast.promise(mutationPromise, {
        loading: moderator.isWorking ? "Removing worker..." : "Restoring worker...",
        success: moderator.isWorking
          ? "Moderator moved to removed workers."
          : "Moderator restored to working list.",
        error: (error) =>
          error instanceof Error ? error.message : "Failed to update moderator status.",
      });

      await mutationPromise;
      await refreshModerators();
    },
    [confirmStatusChange, refreshModerators],
  );

  const handleDeleteModerator = React.useCallback(
    async (moderator: ModeratorWithMetrics) => {
      const confirmed = (await confirmDelete()) as boolean;
      if (!confirmed) {
        return;
      }

      const mutationPromise = deleteModerator({
        data: {
          name: moderator.name,
        },
      });

      void toast.promise(mutationPromise, {
        loading: "Deleting moderator...",
        success: "Moderator deleted successfully.",
        error: (error) => (error instanceof Error ? error.message : "Failed to delete moderator."),
      });

      await mutationPromise;
      await refreshModerators();
    },
    [confirmDelete, refreshModerators],
  );

  const workingModerators = React.useMemo(
    () => moderators.filter((moderator) => moderator.isWorking),
    [moderators],
  );

  const removedModerators = React.useMemo(
    () => moderators.filter((moderator) => !moderator.isWorking),
    [moderators],
  );

  const addFormDefaults = React.useMemo<ModeratorFormValues>(
    () => ({
      name: "",
      password: "",
      areas: [areas_list[0]],
      isWorking: true,
    }),
    [],
  );

  const editFormDefaults = React.useMemo<ModeratorFormValues>(
    () => ({
      name: selectedModerator?.name ?? "",
      password: selectedModerator?.password ?? "",
      areas:
        selectedModerator && selectedModerator.areas.length > 0
          ? [...selectedModerator.areas]
          : [areas_list[0]],
      isWorking: selectedModerator?.isWorking ?? true,
    }),
    [selectedModerator],
  );

  return (
    <main className="flex w-full flex-col items-center gap-4 p-4">
      <DeleteConfirmDialog />
      <StatusConfirmDialog />

      <ModeratorDataTable
        title="Working Moderators"
        description="Manage active moderators, assignments and operational status."
        data={workingModerators}
        isLoading={isLoading}
        removedTable={false}
        headerAction={
          <Button
            type="button"
            className="shadow-sm"
            onClick={() => {
              setIsCreateOpen(true);
            }}
          >
            <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} data-icon="inline-start" />
            Add Moderator
          </Button>
        }
        onEdit={(moderator) => {
          setSelectedModerator(moderator);
          setIsEditOpen(true);
        }}
        onToggleStatus={(moderator) => {
          void handleToggleStatus(moderator);
        }}
        onDelete={(moderator) => {
          void handleDeleteModerator(moderator);
        }}
      />

      <ModeratorDataTable
        title="Removed Moderators"
        description="Previously removed moderators that can be restored when needed."
        data={removedModerators}
        isLoading={isLoading}
        removedTable
        onEdit={(moderator) => {
          setSelectedModerator(moderator);
          setIsEditOpen(true);
        }}
        onToggleStatus={(moderator) => {
          void handleToggleStatus(moderator);
        }}
        onDelete={(moderator) => {
          void handleDeleteModerator(moderator);
        }}
      />

      <ModeratorFormSheet
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Add Moderator"
        description="Create a moderator profile and assign one or more areas."
        submitLabel="Create Moderator"
        defaultValues={addFormDefaults}
        onSubmit={handleCreateModerator}
      />

      <ModeratorFormSheet
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedModerator(null);
          }
        }}
        title="Edit Moderator"
        description="Update moderator details, assigned areas, and status."
        submitLabel="Update Moderator"
        defaultValues={editFormDefaults}
        onSubmit={handleEditModerator}
      />
    </main>
  );
}
