import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db";
import { BottleUsage, OtherExpense } from "@/db/schema";
import { requireModeratorAuthMiddleware } from "@/routes/moderator/login/-server/modMiddleware.function";
import {
  addOtherExpenseInputSchema,
  mutationResultSchema,
} from "@/types/moderator.types";

export const addOtherExpense = createServerFn({ method: "POST" })
  .middleware([requireModeratorAuthMiddleware])
  .inputValidator(addOtherExpenseInputSchema)
  .handler(addOtherExpenseHandler);

export async function addOtherExpenseHandler({
  data,
  context,
}: {
  data: {
    date: Date;
    amount: number;
    description: string;
    refilled_bottles: number;
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
        empty_bottles: BottleUsage.empty_bottles,
        remaining_bottles: BottleUsage.remaining_bottles,
        expense: BottleUsage.expense,
        refilled_bottles: BottleUsage.refilled_bottles,
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

    if (usage.done) {
      return mutationResultSchema.parse({
        success: false,
        error: "Bottle usage is already marked as done.",
      });
    }

    if (data.refilled_bottles > usage.empty_bottles) {
      return mutationResultSchema.parse({
        success: false,
        error: "Refilled bottles cannot be more than available empty bottles.",
      });
    }

    await db.transaction(async (tx) => {
      await Promise.all([
        tx.insert(OtherExpense).values({
          moderator_id: context.moderator.id,
          amount: data.amount,
          description: data.description,
          refilled_bottles: data.refilled_bottles,
          date: data.date,
          updatedAt: new Date(),
        }),

        tx
          .update(BottleUsage)
          .set({
            empty_bottles: Math.max(0, usage.empty_bottles - data.refilled_bottles),
            remaining_bottles: usage.remaining_bottles + data.refilled_bottles,
            expense: usage.expense + data.amount,
            refilled_bottles: usage.refilled_bottles + data.refilled_bottles,
            updatedAt: new Date(),
          })
          .where(eq(BottleUsage.id, usage.id)),
      ]);
    });

    return mutationResultSchema.parse({
      success: true,
      message: "Other expense added successfully.",
    });
  } catch (error) {
    console.error("Failed to add other expense", error);
    return mutationResultSchema.parse({
      success: false,
      error: "Failed to add other expense.",
    });
  }
}
