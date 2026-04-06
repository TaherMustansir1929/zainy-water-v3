import { createServerFn } from "@tanstack/react-start";
import { endOfDay, startOfDay } from "date-fns";
import { and, desc, eq, gte, lte } from "drizzle-orm";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import {
  deliveryMutationResultSchema,
  updateDailyDeliveryInputSchema,
} from "./deliveries.schemas";
import { db } from "@/db";
import { BottleUsage, Customer, Delivery, TotalBottles } from "@/db/schema";

export const updateDailyDelivery = createServerFn({ method: "POST" })
  .inputValidator(updateDailyDeliveryInputSchema)
  .handler(async ({ data }) => {
    await requireAdminAuthorization();

    const deliveryRows = await db
      .select()
      .from(Delivery)
      .where(eq(Delivery.id, data.deliveryId))
      .limit(1);

    const dailyDelivery = deliveryRows.at(0);
    if (!dailyDelivery) {
      throw new Error("Daily delivery record not found.");
    }

    const customerRows = await db
      .select()
      .from(Customer)
      .where(eq(Customer.customer_id, dailyDelivery.customer_id))
      .limit(1);

    const customer = customerRows.at(0);
    if (!customer) {
      throw new Error("Customer not found for this delivery.");
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
      throw new Error("Total bottles not found.");
    }

    const valueDiffs = {
      filledBottles: data.data.filled_bottles - dailyDelivery.filled_bottles,
      emptyBottles: data.data.empty_bottles - dailyDelivery.empty_bottles,
      damagedBottles: data.data.damaged_bottles - dailyDelivery.damaged_bottles,
      foc: data.data.foc - dailyDelivery.foc,
      payment: data.data.payment - dailyDelivery.payment,
    };

    const updatedData = {
      sales: bottleUsage.sales + valueDiffs.filledBottles,
      remainingBottles: bottleUsage.remaining_bottles - valueDiffs.filledBottles,
      emptyBottles: bottleUsage.empty_bottles + valueDiffs.emptyBottles,
      damagedBottles: totalBottles.damaged_bottles + valueDiffs.damagedBottles,
      availableBottles: totalBottles.available_bottles - valueDiffs.damagedBottles,
      customerBalance:
        customer.balance -
        valueDiffs.foc * customer.bottle_price +
        valueDiffs.filledBottles * customer.bottle_price -
        valueDiffs.payment,
      customerBottles: customer.bottles - valueDiffs.emptyBottles,
    };

    Object.entries(updatedData).forEach(([key, value]) => {
      if (key === "customerBalance") {
        return;
      }

      if (value < 0) {
        throw new Error(`Invalid ${key} value: ${value}`);
      }
    });

    await db.transaction(async (tx) => {
      await Promise.all([
        tx
          .update(Customer)
          .set({
            balance: updatedData.customerBalance,
            bottles: updatedData.customerBottles,
            updatedAt: new Date(),
          })
          .where(eq(Customer.id, customer.id)),

        tx
          .update(BottleUsage)
          .set({
            sales: updatedData.sales,
            remaining_bottles: updatedData.remainingBottles,
            empty_bottles: updatedData.emptyBottles,
            damaged_bottles:
              bottleUsage.damaged_bottles -
              dailyDelivery.damaged_bottles +
              data.data.damaged_bottles,
            revenue:
              bottleUsage.revenue - dailyDelivery.payment + data.data.payment,
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
          .update(Delivery)
          .set({
            payment: data.data.payment,
            filled_bottles: data.data.filled_bottles,
            empty_bottles: data.data.empty_bottles,
            foc: data.data.foc,
            damaged_bottles: data.data.damaged_bottles,
            updatedAt: new Date(),
          })
          .where(eq(Delivery.id, dailyDelivery.id)),
      ]);
    });

    return deliveryMutationResultSchema.parse({
      success: true,
      message: "Daily delivery updated successfully.",
    });
  });
