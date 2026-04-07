import { createServerFn } from "@tanstack/react-start";
import { startOfDay } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import {
  salesAndExpensesInputSchema,
  salesAndExpensesResultSchema,
} from "./inventory.schemas";
import { db } from "@/db";
import { Delivery, Miscellaneous, Moderator, OtherExpense } from "@/db/schema";

export const getSalesAndExpenses = createServerFn({ method: "GET" })
  .inputValidator(salesAndExpensesInputSchema)
  .handler(async ({ data }) => {
    await requireAdminAuthorization();

    const to = new Date(data.date);
    const from = startOfDay(to);

    const moderatorRows = await db
      .select({ id: Moderator.id })
      .from(Moderator)
      .where(eq(Moderator.id, data.moderatorId))
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
              lte(Delivery.createdAt, to),
            ),
          ),

        tx
          .select({ payment: Miscellaneous.payment })
          .from(Miscellaneous)
          .where(
            and(
              eq(Miscellaneous.moderator_id, moderator.id),
              gte(Miscellaneous.createdAt, from),
              lte(Miscellaneous.createdAt, to),
            ),
          ),

        tx
          .select({ amount: OtherExpense.amount })
          .from(OtherExpense)
          .where(
            and(
              eq(OtherExpense.moderator_id, moderator.id),
              gte(OtherExpense.createdAt, from),
              lte(OtherExpense.createdAt, to),
            ),
          ),
      ]);
    });

    const salesFromDeliveries = result[0].reduce(
      (sum, row) => sum + Number(row.payment),
      0,
    );
    const salesFromMisc = result[1].reduce(
      (sum, row) => sum + Number(row.payment),
      0,
    );
    const totalExpenses = result[2].reduce(
      (sum, row) => sum + Number(row.amount),
      0,
    );

    return salesAndExpensesResultSchema.parse({
      sales: salesFromDeliveries + salesFromMisc,
      expenses: totalExpenses,
      date: to,
    });
  });
