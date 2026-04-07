import { createServerFn } from "@tanstack/react-start";
import { endOfDay, startOfDay, subDays } from "date-fns";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import { bottleUsageRecordSchema } from "./inventory.schemas";
import { db } from "@/db";
import { BottleUsage, Moderator } from "@/db/schema";

export const getBottleUsageRecords = createServerFn({ method: "GET" })
  .inputValidator(z.void())
  .handler(async () => {
    await requireAdminAuthorization();

    const now = new Date();
    const from = startOfDay(subDays(now, 29));
    const to = endOfDay(now);

    const rows = await db
      .select({
        id: BottleUsage.id,
        moderatorId: BottleUsage.moderator_id,
        moderatorName: Moderator.name,
        done: BottleUsage.done,
        revenue: BottleUsage.revenue,
        expense: BottleUsage.expense,
        filled: BottleUsage.filled_bottles,
        refilled: BottleUsage.refilled_bottles,
        sales: BottleUsage.sales,
        empty: BottleUsage.empty_bottles,
        remaining: BottleUsage.remaining_bottles,
        emptyReturned: BottleUsage.empty_returned,
        remainingReturned: BottleUsage.remaining_returned,
        returned: BottleUsage.returned_bottles,
        damaged: BottleUsage.damaged_bottles,
        capsTaken: BottleUsage.caps,
        capsUsed: BottleUsage.refilled_bottles,
        createdAt: BottleUsage.createdAt,
        updatedAt: BottleUsage.updatedAt,
      })
      .from(BottleUsage)
      .innerJoin(Moderator, eq(BottleUsage.moderator_id, Moderator.id))
      .where(and(gte(BottleUsage.createdAt, from), lte(BottleUsage.createdAt, to)))
      .orderBy(desc(BottleUsage.createdAt));

    return rows.map((row) => bottleUsageRecordSchema.parse(row));
  });

export type InventoryBottleUsageRecord = z.infer<typeof bottleUsageRecordSchema>;
