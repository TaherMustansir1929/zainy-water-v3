import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db";
import { BottleUsage, OtherExpense } from "@/db/schema";
import { requireModeratorAuthMiddleware } from "@/routes/moderator/login/-server/modMiddleware.function";
import {
  markBottleUsageInputSchema,
  mutationResultSchema,
} from "@/types/moderator.types";

export const markAsDone = createServerFn({ method: "POST" })
  .middleware([requireModeratorAuthMiddleware])
  .inputValidator(markBottleUsageInputSchema)
  .handler(markAsDoneHandler);

export async function markAsDoneHandler({
  data,
  context,
}: {
  data: {
    date: Date;
    done: boolean;
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

      if (usageRows.length === 0) {
        return mutationResultSchema.parse({
          success: false,
          error: "Bottle usage record not found.",
        });
      }

      const usage = usageRows[0];
      if (usage.done === data.done) {
        return mutationResultSchema.parse({
          success: true,
          message: data.done
            ? "Bottle usage is already marked as done."
            : "Bottle usage is already in pending state.",
        });
      }

      const expenseRows = await db
        .select({
          amount: OtherExpense.amount,
          refilled_bottles: OtherExpense.refilled_bottles,
        })
        .from(OtherExpense)
        .where(
          and(
            eq(OtherExpense.moderator_id, context.moderator.id),
            gte(OtherExpense.date, startOfDay(data.date)),
            lte(OtherExpense.date, endOfDay(data.date)),
          ),
        );

      const expenses = expenseRows.reduce((sum, row) => sum + row.amount, 0);
      const refilled_bottles = expenseRows.reduce(
        (sum, row) => sum + row.refilled_bottles,
        0,
      );

      await db
        .update(BottleUsage)
        .set({
          done: data.done,
          expense: expenses,
          refilled_bottles,
          updatedAt: new Date(),
        })
        .where(eq(BottleUsage.id, usage.id));

      return mutationResultSchema.parse({
        success: true,
        message: data.done
          ? "Bottle usage marked as done."
          : "Bottle usage reverted successfully.",
      });
    } catch (error) {
      console.error("Failed to update bottle usage status", error);
      return mutationResultSchema.parse({
        success: false,
        error: "Failed to update bottle usage status.",
      });
    }
}

