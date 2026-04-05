import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { requireModeratorAuthMiddleware } from "@/routes/moderator/login/-server/modMiddleware.function";
import {
  bottleUsageDayRecordSchema,
  bottleUsageViewSchema,
  getBottleUsageInputSchema,
} from "@/types/moderator.types";

export const getBottleUsage = createServerFn({ method: "GET" })
  .middleware([requireModeratorAuthMiddleware])
  .inputValidator(getBottleUsageInputSchema)
  .handler(getBottleUsageHandler);

export async function getBottleUsageHandler({
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
    const totalBottleRows = await db
      .select({
        available_bottles: TotalBottles.available_bottles,
      })
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt))
      .limit(1);

    const usageRows = await db
      .select({
        id: BottleUsage.id,
        moderator_id: BottleUsage.moderator_id,
        filled_bottles: BottleUsage.filled_bottles,
        sales: BottleUsage.sales,
        empty_bottles: BottleUsage.empty_bottles,
        remaining_bottles: BottleUsage.remaining_bottles,
        returned_bottles: BottleUsage.returned_bottles,
        empty_returned: BottleUsage.empty_returned,
        remaining_returned: BottleUsage.remaining_returned,
        caps: BottleUsage.caps,
        revenue: BottleUsage.revenue,
        expense: BottleUsage.expense,
        done: BottleUsage.done,
        createdAt: BottleUsage.createdAt,
        updatedAt: BottleUsage.updatedAt,
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

    const usage = usageRows[0] ? bottleUsageDayRecordSchema.parse(usageRows[0]) : null;

    return bottleUsageViewSchema.parse({
      available_bottles: totalBottleRows[0]?.available_bottles ?? 0,
      usage,
    });
}

