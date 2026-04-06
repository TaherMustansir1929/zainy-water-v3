import { createServerFn } from "@tanstack/react-start";
import { endOfDay, startOfDay } from "date-fns";
import { and, desc, eq, gte, lte } from "drizzle-orm";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import {
  deliveryMutationResultSchema,
  updateMiscDeliveryInputSchema,
} from "./deliveries.schemas";
import { db } from "@/db";
import { BottleUsage, Miscellaneous, TotalBottles } from "@/db/schema";

export const updateMiscDelivery = createServerFn({ method: "POST" })
  .inputValidator(updateMiscDeliveryInputSchema)
  .handler(async ({ data }) => {
    await requireAdminAuthorization();

    const miscRows = await db
      .select()
      .from(Miscellaneous)
      .where(eq(Miscellaneous.id, data.deliveryId))
      .limit(1);

    const miscDelivery = miscRows.at(0);
    if (!miscDelivery) {
      throw new Error("Miscellaneous delivery not found.");
    }

    const totalBottleRows = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt))
      .limit(1);

    const totalBottles = totalBottleRows.at(0);
    if (!totalBottles) {
      throw new Error("Total bottles not found.");
    }

    const dayStart = startOfDay(miscDelivery.delivery_date);
    const dayEnd = endOfDay(miscDelivery.delivery_date);

    const bottleUsageRows = await db
      .select()
      .from(BottleUsage)
      .where(
        and(
          eq(BottleUsage.moderator_id, miscDelivery.moderator_id),
          gte(BottleUsage.createdAt, dayStart),
          lte(BottleUsage.createdAt, dayEnd),
        ),
      )
      .orderBy(desc(BottleUsage.createdAt))
      .limit(1);

    const bottleUsage = bottleUsageRows.at(0);
    if (!bottleUsage) {
      throw new Error("Bottle usage not found.");
    }

    const valueDiffs = {
      filledBottles: data.data.filled_bottles - miscDelivery.filled_bottles,
      emptyBottles: data.data.empty_bottles - miscDelivery.empty_bottles,
      damagedBottles: data.data.damaged_bottles - miscDelivery.damaged_bottles,
    };

    const updatedData = {
      sales: bottleUsage.sales + valueDiffs.filledBottles,
      remainingBottles: bottleUsage.remaining_bottles - valueDiffs.filledBottles,
      emptyBottles: bottleUsage.empty_bottles + valueDiffs.emptyBottles,
      damagedBottles: totalBottles.damaged_bottles + valueDiffs.damagedBottles,
      availableBottles: totalBottles.available_bottles - valueDiffs.damagedBottles,
    };

    Object.values(updatedData).forEach((value) => {
      if (value < 0) {
        throw new Error("Invalid bottle state after update.");
      }
    });

    const paymentToStore = data.data.isPaid ? data.data.payment : 0;

    await db.transaction(async (tx) => {
      await Promise.all([
        tx
          .update(BottleUsage)
          .set({
            sales: updatedData.sales,
            remaining_bottles: updatedData.remainingBottles,
            empty_bottles: updatedData.emptyBottles,
            damaged_bottles:
              bottleUsage.damaged_bottles -
              miscDelivery.damaged_bottles +
              data.data.damaged_bottles,
            revenue: bottleUsage.revenue - miscDelivery.payment + paymentToStore,
            updatedAt: new Date(),
          })
          .where(eq(BottleUsage.id, bottleUsage.id)),

        tx
          .update(TotalBottles)
          .set({
            damaged_bottles: updatedData.damagedBottles,
            available_bottles: updatedData.availableBottles,
            updatedAt: new Date(),
          })
          .where(eq(TotalBottles.id, totalBottles.id)),

        tx
          .update(Miscellaneous)
          .set({
            customer_name: data.data.customer_name.trim(),
            description: data.data.description.trim(),
            isPaid: data.data.isPaid,
            payment: paymentToStore,
            filled_bottles: data.data.filled_bottles,
            empty_bottles: data.data.empty_bottles,
            damaged_bottles: data.data.damaged_bottles,
            updatedAt: new Date(),
          })
          .where(eq(Miscellaneous.id, miscDelivery.id)),
      ]);
    });

    return deliveryMutationResultSchema.parse({
      success: true,
      message: "Miscellaneous delivery updated successfully.",
    });
  });
