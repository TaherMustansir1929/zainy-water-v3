import { createServerFn } from "@tanstack/react-start";
import { endOfDay, isSameDay, startOfDay } from "date-fns";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import { db } from "@/db";
import { BottleUsage, OtherExpense } from "@/db/schema";

const deleteExpenseInputSchema = z.object({
  expenseId: z.string().trim().min(1, "Expense id is required."),
  moderatorId: z.string().trim().min(1, "Moderator id is required."),
});

export const deleteExpense = createServerFn({ method: "POST" })
  .inputValidator(deleteExpenseInputSchema)
  .handler(async ({ data }) => {
    await requireAdminAuthorization();

    const expenseRows = await db
      .select({
        id: OtherExpense.id,
        moderator_id: OtherExpense.moderator_id,
        amount: OtherExpense.amount,
        refilled_bottles: OtherExpense.refilled_bottles,
        date: OtherExpense.date,
        createdAt: OtherExpense.createdAt,
      })
      .from(OtherExpense)
      .where(eq(OtherExpense.id, data.expenseId))
      .limit(1);

    const otherExpense = expenseRows.at(0);
    if (!otherExpense) {
      throw new Error("Expense record not found.");
    }

    if (otherExpense.moderator_id !== data.moderatorId) {
      throw new Error("Expense record does not belong to the selected moderator.");
    }

    if (!isSameDay(otherExpense.createdAt, new Date())) {
      throw new Error("Record is immutable, hence cannot be edited.");
    }

    const bottleUsageRows = await db
      .select({
        id: BottleUsage.id,
        empty_bottles: BottleUsage.empty_bottles,
        refilled_bottles: BottleUsage.refilled_bottles,
        expense: BottleUsage.expense,
      })
      .from(BottleUsage)
      .where(
        and(
          eq(BottleUsage.moderator_id, data.moderatorId),
          lte(BottleUsage.createdAt, endOfDay(otherExpense.date)),
          gte(BottleUsage.createdAt, startOfDay(otherExpense.date)),
        ),
      )
      .orderBy(desc(BottleUsage.createdAt))
      .limit(1);

    const bottleUsage = bottleUsageRows.at(0);
    if (!bottleUsage) {
      throw new Error("No bottle usage found for the given date and moderator.");
    }

    if (bottleUsage.refilled_bottles < otherExpense.refilled_bottles) {
      throw new Error("Invalid bottle usage state for delete operation.");
    }

    if (bottleUsage.expense < otherExpense.amount) {
      throw new Error("Invalid expense state for delete operation.");
    }

    await db.transaction(async (tx) => {
      await Promise.all([
        tx
          .update(BottleUsage)
          .set({
            refilled_bottles:
              bottleUsage.refilled_bottles - otherExpense.refilled_bottles,
            empty_bottles:
              bottleUsage.empty_bottles + otherExpense.refilled_bottles,
            expense: bottleUsage.expense - otherExpense.amount,
            updatedAt: new Date(),
          })
          .where(eq(BottleUsage.id, bottleUsage.id)),

        tx.delete(OtherExpense).where(eq(OtherExpense.id, otherExpense.id)),
      ]);
    });

    return {
      success: true,
    };
  });

export type DeleteExpenseInput = z.infer<typeof deleteExpenseInputSchema>;
