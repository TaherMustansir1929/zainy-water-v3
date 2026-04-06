import { createServerFn } from "@tanstack/react-start";
import { endOfDay, startOfDay } from "date-fns";
import { and, desc, eq, gte, lte } from "drizzle-orm";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import {
  deleteDailyDeliveryInputSchema,
  deliveryMutationResultSchema,
} from "./deliveries.schemas";
import { db } from "@/db";
import { BottleUsage, Customer, Delivery, TotalBottles } from "@/db/schema";

export const deleteDailyDelivery = createServerFn({ method: "POST" })
  .inputValidator(deleteDailyDeliveryInputSchema)
  .handler(async ({ data }) => {
    await requireAdminAuthorization();

    const deliveryRows = await db
      .select()
      .from(Delivery)
      .where(eq(Delivery.id, data.deliveryId))
      .limit(1);

    const dailyDelivery = deliveryRows.at(0);
    if (!dailyDelivery) {
      throw new Error("Delivery record not found.");
    }

    const customerRows = await db
      .select()
      .from(Customer)
      .where(eq(Customer.customer_id, dailyDelivery.customer_id))
      .limit(1);

    const customer = customerRows.at(0);
    if (!customer) {
      throw new Error("Customer record not found.");
    }

    const dayStart = startOfDay(dailyDelivery.delivery_date);
    const dayEnd = endOfDay(dailyDelivery.delivery_date);

    const bottleUsageRows = await db
      .select()
      .from(BottleUsage)
      .where(
        and(
          eq(BottleUsage.moderator_id, dailyDelivery.moderator_id),
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

    const totalBottleRows = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt))
      .limit(1);

    const totalBottles = totalBottleRows.at(0);
    if (!totalBottles) {
      throw new Error("Total bottles record not found.");
    }

    await db.transaction(async (tx) => {
      await Promise.all([
        tx
          .update(BottleUsage)
          .set({
            sales: Math.max(0, bottleUsage.sales - dailyDelivery.filled_bottles),
            remaining_bottles: bottleUsage.remaining_bottles + dailyDelivery.filled_bottles,
            empty_bottles: Math.max(
              0,
              bottleUsage.empty_bottles - dailyDelivery.empty_bottles,
            ),
            revenue: bottleUsage.revenue - dailyDelivery.payment,
            damaged_bottles:
              bottleUsage.damaged_bottles - dailyDelivery.damaged_bottles,
            updatedAt: new Date(),
          })
          .where(eq(BottleUsage.id, bottleUsage.id)),

        tx
          .update(TotalBottles)
          .set({
            damaged_bottles:
              totalBottles.damaged_bottles - dailyDelivery.damaged_bottles,
            updatedAt: new Date(),
          })
          .where(eq(TotalBottles.id, totalBottles.id)),

        tx
          .update(Customer)
          .set({
            bottles:
              customer.bottles +
              dailyDelivery.empty_bottles -
              dailyDelivery.filled_bottles,
            balance:
              customer.balance +
              dailyDelivery.payment -
              (dailyDelivery.filled_bottles - dailyDelivery.foc) *
                customer.bottle_price,
            updatedAt: new Date(),
          })
          .where(eq(Customer.id, customer.id)),

        tx.delete(Delivery).where(eq(Delivery.id, dailyDelivery.id)),
      ]);
    });

    return deliveryMutationResultSchema.parse({
      success: true,
      message: "Daily delivery deleted successfully.",
    });
  });
