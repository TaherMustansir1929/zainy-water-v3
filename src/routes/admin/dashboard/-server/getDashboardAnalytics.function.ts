import { createServerFn } from "@tanstack/react-start";
import { subDays } from "date-fns";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

import { requireAdminAuthorization } from "../../-server/admin-auth.function";
import { db } from "@/db";
import {
	Customer,
	Delivery,
	Miscellaneous,
	Moderator,
	OtherExpense,
	TotalBottles,
} from "@/db/schema";

export const DashboardAnalyticsSchema = z.object({
	customerCount: z.number(),
	moderatorCount: z.number(),
	totalRevenue: z.number(),
	depositCount: z.number(),
	availableBottles: z.number(),
	totalBottles: z.number(),
	usedBottles: z.number(),
	damagedBottles: z.number(),
	expenses: z.number(),
});

export type DashboardAnalytics = z.infer<typeof DashboardAnalyticsSchema>;

export const getDashboardAnalytics = createServerFn({ method: "GET" })
	.inputValidator(z.void())
	.handler(async () => {
		await requireAdminAuthorization();

		const now = new Date();
		const from = subDays(now, 30);

		try {
			const transaction = await db.transaction(async (tx) => {
				return await Promise.all([
					tx.select({ total: count() }).from(Customer),
					tx.select({ total: count() }).from(Moderator),
					tx
						.select({ payment: Delivery.payment })
						.from(Delivery)
						.where(and(lte(Delivery.createdAt, now), gte(Delivery.createdAt, from))),
					tx
						.select({ payment: Miscellaneous.payment })
						.from(Miscellaneous)
						.where(
							and(
								lte(Miscellaneous.createdAt, now),
								gte(Miscellaneous.createdAt, from),
							),
						),
					tx
						.select({ deposit: Customer.deposit })
						.from(Customer)
						.where(eq(Customer.isActive, true)),
					tx
						.select()
						.from(TotalBottles)
						.orderBy(desc(TotalBottles.createdAt))
						.limit(1),
					tx
						.select({ amount: OtherExpense.amount })
						.from(OtherExpense)
						.where(
							and(
								lte(OtherExpense.createdAt, now),
								gte(OtherExpense.createdAt, from),
							),
						),
				]);
			});

			const result = {
				customerCount: transaction[0][0],
				moderatorCount: transaction[1][0],
				deliveries: transaction[2],
				miscellaneousDeliveries: transaction[3],
				deposit: transaction[4],
				totalBottles: transaction[5][0],
				expenses: transaction[6],
			};

			const totalDelivery = result.deliveries.reduce(
				(sum, delivery) => sum + Number(delivery.payment),
				0,
			);

			const totalMiscellaneous = result.miscellaneousDeliveries.reduce(
				(sum, delivery) => sum + Number(delivery.payment),
				0,
			);

			const totalRevenue = totalDelivery + totalMiscellaneous;

			const depositCount = result.deposit.reduce(
				(sum, entry) => sum + Number(entry.deposit),
				0,
			);

			const expenses = result.expenses.reduce(
				(sum, entry) => sum + Number(entry.amount),
				0,
			);

			return DashboardAnalyticsSchema.parse({
				totalRevenue,
				customerCount: Number(result.customerCount.total),
				moderatorCount: Number(result.moderatorCount.total),
				depositCount,
				availableBottles: Number(result.totalBottles.available_bottles),
				totalBottles: Number(result.totalBottles.total_bottles),
				usedBottles: Number(result.totalBottles.used_bottles),
				damagedBottles: Number(result.totalBottles.damaged_bottles),
				expenses,
			});
		} catch (error) {
			console.error("Error fetching dashboard analytics:", error);
			throw error;
		}
	});