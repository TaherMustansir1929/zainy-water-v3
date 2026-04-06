import { createServerFn } from "@tanstack/react-start";
import { startOfDay } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import { db } from "@/db";
import { Delivery, Miscellaneous, Moderator, OtherExpense } from "@/db/schema";

const salesAndExpensesSchema = z.object({
	sales: z.number(),
	expenses: z.number(),
});

const moderatorNameSchema = z.string().trim().min(1, "Moderator name is required.");

export const getSalesAndExpenses = createServerFn({ method: "POST" })
	.inputValidator(moderatorNameSchema)
	.handler(async ({ data }) => {
		await requireAdminAuthorization();

		const now = new Date();
		const from = startOfDay(now);
		const normalizedName = data.toLowerCase();

		const moderatorRows = await db
			.select({ id: Moderator.id })
			.from(Moderator)
			.where(eq(Moderator.name, normalizedName))
			.limit(1);

		const moderator = moderatorRows.at(0);
		if (!moderator) {
			throw new Error("Moderator not found");
		}

		const result = await db.transaction(async (tx) => {
			return Promise.all([
				tx
					.select({ payment: Delivery.payment })
					.from(Delivery)
					.where(
						and(
							eq(Delivery.moderator_id, moderator.id),
							gte(Delivery.createdAt, from),
							lte(Delivery.createdAt, now),
						),
					),
				tx
					.select({ payment: Miscellaneous.payment })
					.from(Miscellaneous)
					.where(
						and(
							eq(Miscellaneous.moderator_id, moderator.id),
							gte(Miscellaneous.createdAt, from),
							lte(Miscellaneous.createdAt, now),
						),
					),
				tx
					.select({ amount: OtherExpense.amount })
					.from(OtherExpense)
					.where(
						and(
							eq(OtherExpense.moderator_id, moderator.id),
							gte(OtherExpense.createdAt, from),
							lte(OtherExpense.createdAt, now),
						),
					),
			]);
		});

		const salesFromDeliveries = result[0].reduce(
			(total, entry) => total + Number(entry.payment),
			0,
		);
		const salesFromMisc = result[1].reduce(
			(total, entry) => total + Number(entry.payment),
			0,
		);
		const totalExpenses = result[2].reduce(
			(total, entry) => total + Number(entry.amount),
			0,
		);

		return salesAndExpensesSchema.parse({
			sales: salesFromDeliveries + salesFromMisc,
			expenses: totalExpenses,
		});
	});

export type ModeratorSalesAndExpenses = z.infer<typeof salesAndExpensesSchema>;
