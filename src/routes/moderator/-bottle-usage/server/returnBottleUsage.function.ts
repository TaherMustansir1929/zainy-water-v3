import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { requireModeratorAuthMiddleware } from "@/routes/moderator/login/-server/modMiddleware.function";
import {
  mutationResultSchema,
  returnBottleUsageInputSchema,
} from "@/types/moderator.types";

export const returnBottleUsage = createServerFn({ method: "POST" })
  .middleware([requireModeratorAuthMiddleware])
  .inputValidator(returnBottleUsageInputSchema)
  .handler(returnBottleUsageHandler);

export async function returnBottleUsageHandler({
  data,
  context,
}: {
  data: {
    date: Date;
    empty_bottles: number;
    remaining_bottles: number;
    caps: number;
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
          returned_bottles: BottleUsage.returned_bottles,
          empty_returned: BottleUsage.empty_returned,
          remaining_returned: BottleUsage.remaining_returned,
          caps: BottleUsage.caps,
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

      const availableEmptyForReturn = Math.max(
        0,
        usage.empty_bottles - usage.empty_returned,
      );
      const availableRemainingForReturn = Math.max(
        0,
        usage.remaining_bottles - usage.remaining_returned,
      );

      if (data.empty_bottles > availableEmptyForReturn) {
        return mutationResultSchema.parse({
          success: false,
          error: "Cannot return more empty bottles than available.",
        });
      }

      if (data.remaining_bottles > availableRemainingForReturn) {
        return mutationResultSchema.parse({
          success: false,
          error: "Cannot return more remaining bottles than available.",
        });
      }

      if (data.caps > usage.caps) {
        return mutationResultSchema.parse({
          success: false,
          error: "Cannot return more caps than available.",
        });
      }

      const returnedIncrement = data.empty_bottles + data.remaining_bottles;
      if (returnedIncrement === 0 && data.caps === 0) {
        return mutationResultSchema.parse({
          success: true,
          message: "Nothing to return.",
        });
      }

      const totalBottleRows = await db
        .select({
          id: TotalBottles.id,
          available_bottles: TotalBottles.available_bottles,
        })
        .from(TotalBottles)
        .orderBy(desc(TotalBottles.createdAt))
        .limit(1);

      if (totalBottleRows.length === 0) {
        return mutationResultSchema.parse({
          success: false,
          error: "Total bottles record not found.",
        });
      }

      const totalBottles = totalBottleRows[0];

      await db.transaction(async (tx) => {
        await Promise.all([
          tx
            .update(BottleUsage)
            .set({
              returned_bottles: usage.returned_bottles + returnedIncrement,
              empty_returned: usage.empty_returned + data.empty_bottles,
              remaining_returned:
                usage.remaining_returned + data.remaining_bottles,
              caps: usage.caps - data.caps,
              updatedAt: new Date(),
            })
            .where(eq(BottleUsage.id, usage.id)),
          tx
            .update(TotalBottles)
            .set({
              available_bottles: totalBottles.available_bottles + returnedIncrement,
              updatedAt: new Date(),
            })
            .where(eq(TotalBottles.id, totalBottles.id)),
        ]);
      });

      return mutationResultSchema.parse({
        success: true,
        message: "Bottle return saved successfully.",
      });
    } catch (error) {
      console.error("Failed to return bottle usage", error);
      return mutationResultSchema.parse({
        success: false,
        error: "Failed to return bottle usage.",
      });
    }
}

