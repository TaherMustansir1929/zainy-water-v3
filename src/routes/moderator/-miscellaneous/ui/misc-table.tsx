"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { getMiscDeliveriesByMod } from "../server/getMiscDeliveriesByMod.function";
import type { MiscDeliveryRecord } from "@/types/moderator.types";
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

type MiscTableProps = {
	refreshKey?: number;
};

function formatAmount(value: number): string {
	return `${value.toLocaleString()} /-`;
}

export const MiscTable = ({ refreshKey = 0 }: MiscTableProps) => {
	const { isAuthenticated, sessionToken } = useModeratorSession();
	const dob = useDOBStore((state) => state.dob);

	const [rows, setRows] = React.useState<Array<MiscDeliveryRecord>>([]);
	const [isLoading, setIsLoading] = React.useState(false);

	const loadMisc = React.useCallback(async () => {
		if (!isAuthenticated || !sessionToken) {
			setRows([]);
			return;
		}

		setIsLoading(true);
		try {
			const fetchedRows = await getMiscDeliveriesByMod({
				data: {
					sessionToken,
					date: dob ?? new Date(),
				},
			});
			setRows(fetchedRows);
		} catch (error) {
			console.error("Failed to load miscellaneous deliveries", error);
			setRows([]);
			toast.error("Failed to load miscellaneous deliveries.");
		} finally {
			setIsLoading(false);
		}
	}, [dob, isAuthenticated, sessionToken]);

	React.useEffect(() => {
		void loadMisc();
	}, [loadMisc, refreshKey]);

	return (
		<section className="w-full max-w-7xl rounded-3xl border bg-card p-4">
			<div className="mb-4 flex items-center justify-between gap-3">
				<div>
					<h3 className="text-sm font-medium">Miscellaneous Deliveries</h3>
					<p className="text-xs text-muted-foreground">
						{`Showing records for ${format(dob ?? new Date(), "dd MMM yyyy")}`}
					</p>
				</div>
				{isLoading ? <Spinner className="size-4" /> : null}
			</div>

			{rows.length === 0 && !isLoading ? (
				<Empty className="border">
					<EmptyHeader>
						<EmptyTitle>No miscellaneous deliveries found</EmptyTitle>
						<EmptyDescription>
							Add a miscellaneous delivery from the form above to see it here.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Time</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Customer Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Filled</TableHead>
							<TableHead>Empty</TableHead>
							<TableHead>Damaged</TableHead>
							<TableHead>Payment</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow key={row.id}>
								<TableCell>{format(row.createdAt, "hh:mm a")}</TableCell>
								<TableCell>{row.isPaid ? "Paid" : "FOC"}</TableCell>
								<TableCell>{row.customer_name}</TableCell>
								<TableCell>{row.description}</TableCell>
								<TableCell>{row.filled_bottles}</TableCell>
								<TableCell>{row.empty_bottles}</TableCell>
								<TableCell>{row.damaged_bottles}</TableCell>
								<TableCell>{row.isPaid ? formatAmount(row.payment) : "FOC"}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</section>
	);
};
