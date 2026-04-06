import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import { dailyDeliveryRecordSchema } from "./deliveries.schemas";
import { db } from "@/db";
import { Customer, Delivery, Moderator } from "@/db/schema";

export const getDailyDeliveries = createServerFn({ method: "GET" })
  .inputValidator(z.void())
  .handler(async () => {
    await requireAdminAuthorization();

    const rows = await db
      .select({
        id: Delivery.id,
        customerId: Delivery.customer_id,
        customerName: Customer.name,
        moderatorId: Delivery.moderator_id,
        moderatorName: Moderator.name,
        deliveryDate: Delivery.delivery_date,
        payment: Delivery.payment,
        balance: Customer.balance,
        filledBottles: Delivery.filled_bottles,
        emptyBottles: Delivery.empty_bottles,
        foc: Delivery.foc,
        damagedBottles: Delivery.damaged_bottles,
        createdAt: Delivery.createdAt,
        updatedAt: Delivery.updatedAt,
      })
      .from(Delivery)
      .innerJoin(Customer, eq(Delivery.customer_id, Customer.customer_id))
      .innerJoin(Moderator, eq(Delivery.moderator_id, Moderator.id))
      .orderBy(desc(Delivery.createdAt));

    return rows.map((row) => dailyDeliveryRecordSchema.parse(row));
  });

export type DailyDeliveryRecord = z.infer<typeof dailyDeliveryRecordSchema>;
