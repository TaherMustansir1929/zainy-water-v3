import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { requireModeratorAuthMiddleware } from "@/routes/moderator/login/-server/modMiddleware.function";
import {
  addUpdateBottleUsageInputSchema,
  mutationResultSchema,
} from "@/types/moderator.types";

export const addUpdateBottleUsage = createServerFn({ method: "POST" })
  .middleware([requireModeratorAuthMiddleware])
  .inputValidator(addUpdateBottleUsageInputSchema)
  .handler(addUpdateBottleUsageHandler);

export async function addUpdateBottleUsageHandler({
  data,
  context,
}: {
  data: {
    date: Date;
    filled_bottles: number;
    caps: number;
  };
  context: {
    moderator: {
      id: string;
    };
  };
}) {
    try {
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

      const usageRows = await db
        .select({
          id: BottleUsage.id,
          filled_bottles: BottleUsage.filled_bottles,
          sales: BottleUsage.sales,
          remaining_returned: BottleUsage.remaining_returned,
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
        if (data.filled_bottles > totalBottles.available_bottles) {
          return mutationResultSchema.parse({
            success: false,
            error: "Insufficient available bottles.",
          });
        }

        await db.transaction(async (tx) => {
          await Promise.all([
            tx.insert(BottleUsage).values({
              moderator_id: context.moderator.id,
              filled_bottles: data.filled_bottles,
              remaining_bottles: data.filled_bottles,
              caps: data.caps,
              createdAt: data.date,
              updatedAt: new Date(),
            }),
            tx
              .update(TotalBottles)
              .set({
                available_bottles: Math.max(
                  0,
                  totalBottles.available_bottles - data.filled_bottles,
                ),
                updatedAt: new Date(),
              })
              .where(eq(TotalBottles.id, totalBottles.id)),
          ]);
        });

        return mutationResultSchema.parse({
          success: true,
          message: "Bottle usage added successfully.",
        });
      }

      const usage = usageRows[0];

      if (usage.done) {
        return mutationResultSchema.parse({
          success: false,
          error: "Bottle usage is already marked as done.",
        });
      }

      if (data.filled_bottles < usage.sales + usage.remaining_returned) {
        return mutationResultSchema.parse({
          success: false,
          error:
            "Filled bottles cannot be less than sold bottles and remaining returned bottles.",
        });
      }

      const filledDelta = data.filled_bottles - usage.filled_bottles;
      if (filledDelta > 0 && filledDelta > totalBottles.available_bottles) {
        return mutationResultSchema.parse({
          success: false,
          error: "Insufficient available bottles.",
        });
      }

      const nextRemainingBottles = Math.max(0, data.filled_bottles - usage.sales);

      await db.transaction(async (tx) => {
        const updateTasks: Array<Promise<unknown>> = [
          tx
            .update(BottleUsage)
            .set({
              filled_bottles: data.filled_bottles,
              remaining_bottles: nextRemainingBottles,
              caps: data.caps,
              updatedAt: new Date(),
            })
            .where(eq(BottleUsage.id, usage.id)),
        ];

        if (filledDelta !== 0) {
          updateTasks.push(
            tx
              .update(TotalBottles)
              .set({
                available_bottles: Math.max(
                  0,
                  totalBottles.available_bottles - filledDelta,
                ),
                updatedAt: new Date(),
              })
              .where(eq(TotalBottles.id, totalBottles.id)),
          );
        }

        await Promise.all(updateTasks);
      });

      return mutationResultSchema.parse({
        success: true,
        message: "Bottle usage updated successfully.",
      });
    } catch (error) {
      console.error("Failed to add/update bottle usage", error);
      return mutationResultSchema.parse({
        success: false,
        error: "Failed to add/update bottle usage.",
      });
    }
}

