import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db";
import { BottleUsage, Delivery, TotalBottles } from "@/db/schema";
import { requireModeratorAuthMiddleware } from "@/routes/moderator/login/-server/modMiddleware.function";
import {
  deleteBottleUsageInputSchema,
  mutationResultSchema,
} from "@/types/moderator.types";

export const deleteBottleUsage = createServerFn({ method: "POST" })
  .middleware([requireModeratorAuthMiddleware])
  .inputValidator(deleteBottleUsageInputSchema)
  .handler(deleteBottleUsageHandler);

export async function deleteBottleUsageHandler({
  data,
  context,
}: {
  data: {
    date: Date;
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
          filled_bottles: BottleUsage.filled_bottles,
          returned_bottles: BottleUsage.returned_bottles,
          sales: BottleUsage.sales,
          empty_bottles: BottleUsage.empty_bottles,
          revenue: BottleUsage.revenue,
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
          error: "Revert done status before deleting bottle usage.",
        });
      }

      const deliveryRows = await db
        .select({ id: Delivery.id })
        .from(Delivery)
        .where(
          and(
            eq(Delivery.moderator_id, context.moderator.id),
            gte(Delivery.delivery_date, startOfDay(data.date)),
            lte(Delivery.delivery_date, endOfDay(data.date)),
          ),
        )
        .limit(1);

      if (deliveryRows.length > 0) {
        return mutationResultSchema.parse({
          success: false,
          error:
            "Cannot delete bottle usage while delivery records exist for this date.",
        });
      }

      if (usage.sales > 0 || usage.empty_bottles > 0 || usage.revenue > 0) {
        return mutationResultSchema.parse({
          success: false,
          error:
            "Cannot delete bottle usage after delivery activity is recorded for this date.",
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
      const netAllocated = Math.max(
        0,
        usage.filled_bottles - usage.returned_bottles,
      );

      await db.transaction(async (tx) => {
        await Promise.all([
          tx.delete(BottleUsage).where(eq(BottleUsage.id, usage.id)),
          tx
            .update(TotalBottles)
            .set({
              available_bottles: totalBottles.available_bottles + netAllocated,
              updatedAt: new Date(),
            })
            .where(eq(TotalBottles.id, totalBottles.id)),
        ]);
      });

      return mutationResultSchema.parse({
        success: true,
        message: "Bottle usage deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete bottle usage", error);
      return mutationResultSchema.parse({
        success: false,
        error: "Failed to delete bottle usage.",
      });
    }
}

