import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db";
import { BottleUsage, Customer, Delivery, TotalBottles } from "@/db/schema";
import { requireModeratorAuthMiddleware } from "@/routes/moderator/login/-server/modMiddleware.function";
import {
	deleteDailyDeliveryInputSchema,
	mutationResultSchema,
} from "@/types/moderator.types";

export const deleteDailyDelivery = createServerFn({ method: "POST" })
	.middleware([requireModeratorAuthMiddleware])
	.inputValidator(deleteDailyDeliveryInputSchema)
	.handler(async ({ data, context }) => {
		const deliveryRows = await db
			.select({
				id: Delivery.id,
				customer_id: Delivery.customer_id,
				filled_bottles: Delivery.filled_bottles,
				empty_bottles: Delivery.empty_bottles,
				foc: Delivery.foc,
				damaged_bottles: Delivery.damaged_bottles,
				payment: Delivery.payment,
				delivery_date: Delivery.delivery_date,
			})
			.from(Delivery)
			.where(
				and(
					eq(Delivery.id, data.delivery_id),
					eq(Delivery.moderator_id, context.moderator.id),
				),
			)
			.limit(1);

		if (deliveryRows.length === 0) {
			return mutationResultSchema.parse({
				success: false,
				error: "Delivery record not found.",
			});
		}

		const delivery = deliveryRows[0];

		const customerRows = await db
			.select({
				customer_id: Customer.customer_id,
				bottles: Customer.bottles,
				balance: Customer.balance,
				bottle_price: Customer.bottle_price,
			})
			.from(Customer)
			.where(eq(Customer.customer_id, delivery.customer_id))
			.limit(1);

		if (customerRows.length === 0) {
			return mutationResultSchema.parse({
				success: false,
				error: "Customer record not found.",
			});
		}

		const customer = customerRows[0];

		const bottleUsageRows = await db
			.select({
				id: BottleUsage.id,
				sales: BottleUsage.sales,
				remaining_bottles: BottleUsage.remaining_bottles,
				empty_bottles: BottleUsage.empty_bottles,
				damaged_bottles: BottleUsage.damaged_bottles,
				revenue: BottleUsage.revenue,
			})
			.from(BottleUsage)
			.where(
				and(
					eq(BottleUsage.moderator_id, context.moderator.id),
					gte(BottleUsage.createdAt, startOfDay(data.date)),
					lte(BottleUsage.createdAt, endOfDay(data.date)),
				),
			)
			.orderBy(desc(BottleUsage.createdAt))
			.limit(1);

		if (bottleUsageRows.length === 0) {
			return mutationResultSchema.parse({
				success: false,
				error: "Bottle usage not found.",
			});
		}

		const bottleUsage = bottleUsageRows[0];

		const totalBottlesRows = await db
			.select({
				id: TotalBottles.id,
				damaged_bottles: TotalBottles.damaged_bottles,
				available_bottles: TotalBottles.available_bottles,
			})
			.from(TotalBottles)
			.orderBy(desc(TotalBottles.createdAt))
			.limit(1);

		if (totalBottlesRows.length === 0) {
			return mutationResultSchema.parse({
				success: false,
				error: "Total bottles record not found.",
			});
		}

		const totalBottles = totalBottlesRows[0];

		try {
			await db.transaction(async (tx) => {
				await Promise.all([
					tx
						.update(BottleUsage)
						.set({
							sales: Math.max(0, bottleUsage.sales - delivery.filled_bottles),
							remaining_bottles: bottleUsage.remaining_bottles + delivery.filled_bottles,
							empty_bottles: Math.max(
								0,
								bottleUsage.empty_bottles - delivery.empty_bottles,
							),
							damaged_bottles: Math.max(
								0,
								bottleUsage.damaged_bottles - delivery.damaged_bottles,
							),
							revenue: bottleUsage.revenue - delivery.payment,
							updatedAt: new Date(),
						})
						.where(eq(BottleUsage.id, bottleUsage.id)),

					tx
						.update(TotalBottles)
						.set({
							damaged_bottles: Math.max(
								0,
								totalBottles.damaged_bottles - delivery.damaged_bottles,
							),
							available_bottles:
								totalBottles.available_bottles + delivery.damaged_bottles,
							updatedAt: new Date(),
						})
						.where(eq(TotalBottles.id, totalBottles.id)),

					tx
						.update(Customer)
						.set({
							bottles: Math.max(
								0,
								customer.bottles + delivery.empty_bottles - delivery.filled_bottles,
							),
							balance:
								customer.balance +
								delivery.payment -
								(delivery.filled_bottles - delivery.foc) * customer.bottle_price,
							updatedAt: new Date(),
						})
						.where(eq(Customer.customer_id, customer.customer_id)),

					tx.delete(Delivery).where(eq(Delivery.id, delivery.id)),
				]);
			});

			return mutationResultSchema.parse({
				success: true,
				message: "Delivery deleted successfully.",
			});
		} catch (error) {
			console.error("Failed to delete delivery", error);
			return mutationResultSchema.parse({
				success: false,
				error: "Failed to delete delivery.",
			});
		}
	});