import { createServerFn } from "@tanstack/react-start";
import { endOfDay, isSameDay, startOfDay } from "date-fns";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import { db } from "@/db";
import { BottleUsage, OtherExpense } from "@/db/schema";

const updateExpenseInputSchema = z.object({
  expenseId: z.string().trim().min(1, "Expense id is required."),
  moderatorId: z.string().trim().min(1, "Moderator id is required."),
  data: z.object({
    amount: z.number().int().min(0),
    description: z.string().trim().min(1).max(500),
    refilled_bottles: z.number().int().min(0),
  }),
});

export const updateExpense = createServerFn({ method: "POST" })
  .inputValidator(updateExpenseInputSchema)
  .handler(async ({ data }) => {
    await requireAdminAuthorization();

    const expenseRows = await db
      .select({
        id: OtherExpense.id,
        moderator_id: OtherExpense.moderator_id,
        amount: OtherExpense.amount,
        refilled_bottles: OtherExpense.refilled_bottles,
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
          lte(BottleUsage.createdAt, endOfDay(otherExpense.createdAt)),
          gte(BottleUsage.createdAt, startOfDay(otherExpense.createdAt)),
        ),
      )
      .orderBy(desc(BottleUsage.createdAt))
      .limit(1);

    const bottleUsage = bottleUsageRows.at(0);

    if (!bottleUsage) {
      throw new Error("No bottle usage found for the given date and moderator.");
    }

    const refilledDelta = data.data.refilled_bottles - otherExpense.refilled_bottles;
    if (refilledDelta > bottleUsage.empty_bottles) {
      throw new Error("Not enough empty bottles available.");
    }

    const expenseDelta = data.data.amount - otherExpense.amount;

    await db.transaction(async (tx) => {
      await Promise.all([
        tx
          .update(BottleUsage)
          .set({
            refilled_bottles: bottleUsage.refilled_bottles + refilledDelta,
            empty_bottles: bottleUsage.empty_bottles - refilledDelta,
            expense: bottleUsage.expense + expenseDelta,
            updatedAt: new Date(),
          })
          .where(eq(BottleUsage.id, bottleUsage.id)),

        tx
          .update(OtherExpense)
          .set({
            amount: data.data.amount,
            description: data.data.description.trim(),
            refilled_bottles: data.data.refilled_bottles,
            updatedAt: new Date(),
          })
          .where(eq(OtherExpense.id, otherExpense.id)),
      ]);
    });
  });

export type UpdateExpenseInput = z.infer<typeof updateExpenseInputSchema>;
