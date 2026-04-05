import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db";
import { BottleUsage, Miscellaneous } from "@/db/schema";
import { requireModeratorAuthMiddleware } from "@/routes/moderator/login/-server/modMiddleware.function";
import {
	addMiscDeliveryInputSchema,
	mutationResultSchema,
} from "@/types/moderator.types";

export const addMiscDelivery = createServerFn({ method: "POST" })
	.middleware([requireModeratorAuthMiddleware])
	.inputValidator(addMiscDeliveryInputSchema)
	.handler(addMiscDeliveryHandler);

export async function addMiscDeliveryHandler({
	data,
	context,
}: {
	data: {
		customer_name: string;
		description: string;
		filled_bottles: number;
		empty_bottles: number;
		damaged_bottles: number;
		isPaid: boolean;
		payment: number;
		delivery_date: Date;
	};
	context: {
		moderator: {
			id: string;
		};
	};
}) {
	try {
		const usageRows = await db
			.select({
				id: BottleUsage.id,
				done: BottleUsage.done,
				sales: BottleUsage.sales,
				remaining_bottles: BottleUsage.remaining_bottles,
				empty_bottles: BottleUsage.empty_bottles,
				damaged_bottles: BottleUsage.damaged_bottles,
			})
			.from(BottleUsage)
			.where(
				and(
					eq(BottleUsage.moderator_id, context.moderator.id),
					gte(BottleUsage.createdAt, startOfDay(data.delivery_date)),
					lte(BottleUsage.createdAt, endOfDay(data.delivery_date)),
				),
			)
			.orderBy(desc(BottleUsage.createdAt))
			.limit(1);

		if (usageRows.length === 0) {
			return mutationResultSchema.parse({
				success: false,
				error: "Bottle usage not found.",
			});
		}

		const usage = usageRows[0];

		if (usage.done) {
			return mutationResultSchema.parse({
				success: false,
				error: "Bottle usage is already marked as done.",
			});
		}

		if (usage.remaining_bottles < data.filled_bottles) {
			return mutationResultSchema.parse({
				success: false,
				error: "Not enough remaining bottles.",
			});
		}

		const paymentToStore = data.isPaid ? data.payment : 0;

		await db.transaction(async (tx) => {
			await Promise.all([
				tx.insert(Miscellaneous).values({
					moderator_id: context.moderator.id,
					customer_name: data.customer_name,
					description: data.description,
					isPaid: data.isPaid,
					payment: paymentToStore,
					filled_bottles: data.filled_bottles,
					empty_bottles: data.empty_bottles,
					damaged_bottles: data.damaged_bottles,
					delivery_date: data.delivery_date,
					updatedAt: new Date(),
				}),

				tx
					.update(BottleUsage)
					.set({
						sales: usage.sales + data.filled_bottles,
						remaining_bottles: usage.remaining_bottles - data.filled_bottles,
						empty_bottles: usage.empty_bottles + data.empty_bottles,
						damaged_bottles: usage.damaged_bottles + data.damaged_bottles,
						updatedAt: new Date(),
					})
					.where(eq(BottleUsage.id, usage.id)),
			]);
		});

		return mutationResultSchema.parse({
			success: true,
			message: "Miscellaneous delivery added successfully.",
		});
	} catch (error) {
		console.error("Failed to add miscellaneous delivery", error);
		return mutationResultSchema.parse({
			success: false,
			error: "Failed to add miscellaneous delivery.",
		});
	}
}
