import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db";
import { OtherExpense } from "@/db/schema";
import { requireModeratorAuthMiddleware } from "@/routes/moderator/login/-server/modMiddleware.function";
import {
  getOtherExpensesInputSchema,
  otherExpenseRecordSchema,
} from "@/types/moderator.types";

export const getOtherExpense = createServerFn({ method: "GET" })
  .middleware([requireModeratorAuthMiddleware])
  .inputValidator(getOtherExpensesInputSchema)
  .handler(async ({ data, context }) => {
    const rows = await db
      .select({
        id: OtherExpense.id,
        moderator_id: OtherExpense.moderator_id,
        amount: OtherExpense.amount,
        description: OtherExpense.description,
        refilled_bottles: OtherExpense.refilled_bottles,
        date: OtherExpense.date,
        createdAt: OtherExpense.createdAt,
        updatedAt: OtherExpense.updatedAt,
      })
      .from(OtherExpense)
      .where(
        and(
          eq(OtherExpense.moderator_id, context.moderator.id),
          gte(OtherExpense.date, startOfDay(data.date)),
          lte(OtherExpense.date, endOfDay(data.date)),
        ),
      )
      .orderBy(desc(OtherExpense.createdAt));

    return rows.map((row) => otherExpenseRecordSchema.parse(row));
  });
