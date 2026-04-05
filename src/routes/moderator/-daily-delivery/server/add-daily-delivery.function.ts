import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db";
import { BottleUsage, Customer, Delivery, TotalBottles } from "@/db/schema";
import { requireModeratorAuthMiddleware } from "@/routes/moderator/login/-server/modMiddleware.function";
import {
	addDailyDeliveryInputSchema,
	calculateFinalDeliveryState,
	getDeliveryBusinessRuleErrors,
	mutationResultSchema,
} from "@/types/moderator.types";

export const addDailyDelivery = createServerFn({ method: "POST" })
	.middleware([requireModeratorAuthMiddleware])
	.inputValidator(addDailyDeliveryInputSchema)
	.handler(async ({ data, context }) => {
		try {
			const customerRows = await db
				.select({
					customer_id: Customer.customer_id,
					area: Customer.area,
					isActive: Customer.isActive,
					balance: Customer.balance,
					bottle_price: Customer.bottle_price,
					bottles: Customer.bottles,
					deposit: Customer.deposit,
				})
				.from(Customer)
				.where(eq(Customer.customer_id, data.customer_id))
				.limit(1);

			if (customerRows.length === 0) {
				return mutationResultSchema.parse({
					success: false,
					error: "Customer not found.",
				});
			}

			const customer = customerRows[0];

			if (!context.moderator.areas.includes(customer.area)) {
				return mutationResultSchema.parse({
					success: false,
					error: "You do not have access to this customer area.",
				});
			}

			if (!customer.isActive) {
				return mutationResultSchema.parse({
					success: false,
					error: "Customer is not active.",
				});
			}

			const businessRuleErrors = getDeliveryBusinessRuleErrors({
				customer,
				values: {
					filled_bottles: data.filled_bottles,
					empty_bottles: data.empty_bottles,
					deposit_bottles_taken: data.deposit_bottles_taken,
				},
			});

			if (businessRuleErrors.length > 0) {
				return mutationResultSchema.parse({
					success: false,
					error: businessRuleErrors[0]?.message ?? "Invalid delivery values.",
				});
			}

			const bottleUsageRows = await db
				.select({
					id: BottleUsage.id,
					done: BottleUsage.done,
					sales: BottleUsage.sales,
					empty_bottles: BottleUsage.empty_bottles,
					remaining_bottles: BottleUsage.remaining_bottles,
					damaged_bottles: BottleUsage.damaged_bottles,
					revenue: BottleUsage.revenue,
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

			if (bottleUsageRows.length === 0) {
				return mutationResultSchema.parse({
					success: false,
					error: "Bottle usage record not found.",
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

			if (bottleUsage.done) {
				return mutationResultSchema.parse({
					success: false,
					error: "Bottle usage record not found.",
				});
			}

			if (bottleUsage.remaining_bottles < data.filled_bottles) {
				return mutationResultSchema.parse({
					success: false,
					error: "Insufficient bottles to sale.",
				});
			}

			const finalState = calculateFinalDeliveryState({
				customer,
				values: {
					customer_id: data.customer_id,
					filled_bottles: data.filled_bottles,
					empty_bottles: data.empty_bottles,
					deposit_bottles_given: data.deposit_bottles_given,
					deposit_bottles_taken: data.deposit_bottles_taken,
					foc: data.foc,
					damaged_bottles: data.damaged_bottles,
					payment: data.payment,
				},
			});

			const updatedSales = bottleUsage.sales + data.filled_bottles;

			await db.transaction(async (tx) => {
				await Promise.all([
					tx
						.update(Customer)
						.set({
							balance: finalState.balance,
							bottles: finalState.customer_bottles,
							deposit: customer.deposit + finalState.deposit_bottles,
							updatedAt: new Date(),
						})
						.where(eq(Customer.customer_id, data.customer_id)),

					tx
						.update(BottleUsage)
						.set({
							sales: updatedSales,
							empty_bottles: bottleUsage.empty_bottles + data.empty_bottles,
							remaining_bottles: bottleUsage.remaining_bottles - data.filled_bottles,
							damaged_bottles: bottleUsage.damaged_bottles + data.damaged_bottles,
							revenue: bottleUsage.revenue + data.payment,
							updatedAt: new Date(),
						})
						.where(eq(BottleUsage.id, bottleUsage.id)),

					tx
						.update(TotalBottles)
						.set({
							damaged_bottles: totalBottles.damaged_bottles + data.damaged_bottles,
							available_bottles: Math.max(
								0,
								totalBottles.available_bottles - data.damaged_bottles,
							),
							updatedAt: new Date(),
						})
						.where(eq(TotalBottles.id, totalBottles.id)),

					tx.insert(Delivery).values({
						customer_id: data.customer_id,
						moderator_id: context.moderator.id,
						delivery_date: data.delivery_date,
						payment: data.payment,
						filled_bottles: data.filled_bottles,
						empty_bottles: data.empty_bottles,
						foc: data.foc,
						damaged_bottles: data.damaged_bottles,
						updatedAt: new Date(),
					}),
				]);
			});

			return mutationResultSchema.parse({
				success: true,
				message: "Delivery record added successfully.",
			});
		} catch (error) {
			console.error("Error adding daily delivery record:", error);
			return mutationResultSchema.parse({
				success: false,
				error: "Failed to add delivery record.",
			});
		}
	});