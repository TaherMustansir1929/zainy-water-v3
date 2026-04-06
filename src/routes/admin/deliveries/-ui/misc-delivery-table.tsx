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
import type { MiscDeliveryRecord } from "../-server/getMiscDeliveries.function";
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

function isDeliveryEditable(record: MiscDeliveryRecord): boolean {
	return isSameDay(record.deliveryDate, new Date());
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

type MiscDeliveryTableProps = {
	title: string;
	description: string;
	data: Array<MiscDeliveryRecord>;
	isLoading: boolean;
	onEdit: (delivery: MiscDeliveryRecord) => void;
};

export const MiscDeliveryTable = ({
	title,
	description,
	data,
	isLoading,
	onEdit,
}: MiscDeliveryTableProps) => {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = React.useState("");

	const columns = React.useMemo<Array<ColumnDef<MiscDeliveryRecord>>>(
		() => [
			{
				accessorKey: "customerName",
				header: ({ column }) => <SortableHeader column={column} title="Customer" />,
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<GeneratedAvatar seed={row.original.customerName} className="size-8" />
						<Button
							type="button"
							variant="link"
							className="h-auto cursor-pointer px-0 text-left font-semibold text-black underline"
							onClick={() => {
								onEdit(row.original);
							}}
						>
							{row.original.customerName}
						</Button>
					</div>
				),
			},
			{
				accessorKey: "deliveryDate",
				header: ({ column }) => <SortableHeader column={column} title="Date" />,
				cell: ({ row }) => <span>{format(row.original.deliveryDate, "PPPP")}</span>,
			},
			{
				id: "status",
				accessorFn: (row) => (isDeliveryEditable(row) ? 1 : 0),
				header: ({ column }) => <SortableHeader column={column} title="Status" />,
				cell: ({ row }) => {
					const editable = isDeliveryEditable(row.original);

					return (
						<Badge
							variant="outline"
							className={editable ? "border-muted-foreground/40" : "border-emerald-500 text-emerald-600"}
						>
							<HugeiconsIcon
								icon={editable ? Loading03Icon : CheckmarkCircle03Icon}
								strokeWidth={2}
								data-icon="inline-start"
								className={editable ? "animate-spin text-muted-foreground" : "text-emerald-500"}
							/>
							{editable ? "Today's delivery" : "Done"}
						</Badge>
					);
				},
			},
			{
				accessorKey: "moderatorName",
				header: ({ column }) => <SortableHeader column={column} title="Moderator" />,
			},
			{
				accessorKey: "isPaid",
				header: "Paid",
				cell: ({ row }) => (
					<Badge
						variant="outline"
						className={row.original.isPaid ? "border-emerald-500 text-emerald-500" : "border-destructive text-destructive"}
					>
						{row.original.isPaid ? "Yes" : "No"}
					</Badge>
				),
			},
			{
				accessorKey: "payment",
				header: ({ column }) => <SortableHeader column={column} title="Payment" />,
				cell: ({ row }) => <span>{formatCurrency(row.original.payment)}</span>,
			},
			{
				accessorKey: "filledBottles",
				header: ({ column }) => <SortableHeader column={column} title="Filled" />,
			},
			{
				accessorKey: "emptyBottles",
				header: ({ column }) => <SortableHeader column={column} title="Empty" />,
			},
			{
				accessorKey: "damagedBottles",
				header: ({ column }) => <SortableHeader column={column} title="Damaged" />,
			},
			{
				accessorKey: "description",
				header: "Description",
				enableSorting: false,
				cell: ({ row }) => <p className="max-w-96 whitespace-normal">{row.original.description}</p>,
			},
		],
		[onEdit],
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

			return (
				row.original.customerName.toLowerCase().includes(query) ||
				row.original.moderatorName.toLowerCase().includes(query) ||
				row.original.description.toLowerCase().includes(query)
			);
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
						placeholder="Search by customer, moderator or description"
						className="pl-9"
					/>
				</div>
				<Badge variant="outline" className="w-fit">{`${table.getFilteredRowModel().rows.length} records`}</Badge>
			</div>

			{table.getRowModel().rows.length === 0 ? (
				<Empty className="border">
					<EmptyHeader>
						<EmptyTitle>No miscellaneous deliveries found</EmptyTitle>
						<EmptyDescription>
							Try adjusting the search text or check back after entries are added.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<>
					<div className="w-full overflow-x-auto">
						<Table className="min-w-[1400px]">
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
