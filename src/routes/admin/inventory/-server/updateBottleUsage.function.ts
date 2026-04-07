import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import {
  inventoryMutationResultSchema,
  updateBottleUsageInputSchema,
} from "./inventory.schemas";
import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";

export const updateBottleUsage = createServerFn({ method: "POST" })
  .inputValidator(updateBottleUsageInputSchema)
  .handler(async ({ data }) => {
    await requireAdminAuthorization();

    const totalRows = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt))
      .limit(1);

    const totalBottles = totalRows.at(0);
    if (!totalBottles) {
      throw new Error("Total bottles record not found");
    }

    const bottleUsageRows = await db
      .select()
      .from(BottleUsage)
      .where(eq(BottleUsage.id, data.id))
      .limit(1);

    const bottleUsage = bottleUsageRows.at(0);
    if (!bottleUsage) {
      throw new Error("Bottle Usage record not found");
    }

    const valueDiffs = {
      filled: data.filled - bottleUsage.filled_bottles,
      empty: data.empty - bottleUsage.empty_bottles,
      sales: data.sales - bottleUsage.sales,
      remaining: data.remaining - bottleUsage.remaining_bottles,
      empty_returned: data.empty_returned - bottleUsage.empty_returned,
      remaining_returned: data.remaining_returned - bottleUsage.remaining_returned,
      damaged: data.damaged - bottleUsage.damaged_bottles,
      refilled: data.refilled - bottleUsage.refilled_bottles,
    };

    if (valueDiffs.filled + valueDiffs.damaged > totalBottles.available_bottles) {
      throw new Error("Filled + damaged bottles cannot exceed total available bottles");
    }
    if (data.empty > data.sales) {
      throw new Error("Empty bottles cannot exceed sales");
    }
    if (data.sales > data.filled + data.refilled) {
      throw new Error("Sales cannot exceed filled + refilled bottles");
    }
    if (data.remaining > data.filled - data.empty_returned - data.remaining_returned) {
      throw new Error("Remaining bottles cannot exceed filled - returned bottles");
    }
    if (data.empty_returned > data.sales - data.remaining_returned) {
      throw new Error("Empty returned bottles cannot exceed sales");
    }
    if (data.remaining_returned > data.filled + data.refilled - data.sales) {
      throw new Error(
        "Remaining returned bottles cannot exceed filled + refilled bottles - sales",
      );
    }
    if (data.refilled > data.sales) {
      throw new Error("Refilled bottles cannot exceed sales");
    }
    if (data.caps < data.refilled) {
      throw new Error("Caps (taken) cannot be less than refilled bottles");
    }

    await db.transaction(async (tx) => {
      await Promise.all([
        tx
          .update(TotalBottles)
          .set({
            damaged_bottles: Math.max(totalBottles.damaged_bottles + valueDiffs.damaged, 0),
            available_bottles: Math.max(
              totalBottles.available_bottles - valueDiffs.filled - valueDiffs.damaged,
              0,
            ),
            updatedAt: new Date(),
          })
          .where(eq(TotalBottles.id, totalBottles.id)),

        tx
          .update(BottleUsage)
          .set({
            done: data.status,
            revenue: data.revenue,
            expense: data.expense,
            filled_bottles: data.filled,
            sales: data.sales,
            empty_bottles: data.empty,
            remaining_bottles: data.remaining,
            returned_bottles: data.remaining_returned + data.empty_returned,
            empty_returned: data.empty_returned,
            remaining_returned: data.remaining_returned,
            damaged_bottles: data.damaged,
            refilled_bottles: data.refilled,
            caps: data.caps,
            updatedAt: new Date(),
          })
          .where(eq(BottleUsage.id, bottleUsage.id)),
      ]);
    });

    return inventoryMutationResultSchema.parse({
      success: true,
      message: "Bottle usage updated successfully",
    });
  });
