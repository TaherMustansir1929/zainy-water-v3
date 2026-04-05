import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db";
import { Miscellaneous } from "@/db/schema";
import { requireModeratorAuthMiddleware } from "@/routes/moderator/login/-server/modMiddleware.function";
import {
	getMiscDeliveriesByModInputSchema,
	miscDeliveryRecordSchema,
} from "@/types/moderator.types";

export const getMiscDeliveriesByMod = createServerFn({ method: "GET" })
	.middleware([requireModeratorAuthMiddleware])
	.inputValidator(getMiscDeliveriesByModInputSchema)
	.handler(async ({ data, context }) => {
		const rows = await db
			.select({
				id: Miscellaneous.id,
				moderator_id: Miscellaneous.moderator_id,
				customer_name: Miscellaneous.customer_name,
				description: Miscellaneous.description,
				isPaid: Miscellaneous.isPaid,
				payment: Miscellaneous.payment,
				filled_bottles: Miscellaneous.filled_bottles,
				empty_bottles: Miscellaneous.empty_bottles,
				damaged_bottles: Miscellaneous.damaged_bottles,
				delivery_date: Miscellaneous.delivery_date,
				createdAt: Miscellaneous.createdAt,
				updatedAt: Miscellaneous.updatedAt,
			})
			.from(Miscellaneous)
			.where(
				and(
					eq(Miscellaneous.moderator_id, context.moderator.id),
					gte(Miscellaneous.delivery_date, startOfDay(data.date)),
					lte(Miscellaneous.delivery_date, endOfDay(data.date)),
				),
			)
			.orderBy(desc(Miscellaneous.createdAt));

		return rows.map((row) => miscDeliveryRecordSchema.parse(row));
	});
