import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import { miscDeliveryRecordSchema } from "./deliveries.schemas";
import { db } from "@/db";
import { Miscellaneous, Moderator } from "@/db/schema";

export const getMiscDeliveries = createServerFn({ method: "GET" })
  .inputValidator(z.void())
  .handler(async () => {
    await requireAdminAuthorization();

    const rows = await db
      .select({
        id: Miscellaneous.id,
        customerName: Miscellaneous.customer_name,
        moderatorId: Miscellaneous.moderator_id,
        moderatorName: Moderator.name,
        deliveryDate: Miscellaneous.delivery_date,
        isPaid: Miscellaneous.isPaid,
        payment: Miscellaneous.payment,
        filledBottles: Miscellaneous.filled_bottles,
        emptyBottles: Miscellaneous.empty_bottles,
        damagedBottles: Miscellaneous.damaged_bottles,
        description: Miscellaneous.description,
        createdAt: Miscellaneous.createdAt,
        updatedAt: Miscellaneous.updatedAt,
      })
      .from(Miscellaneous)
      .innerJoin(Moderator, eq(Miscellaneous.moderator_id, Moderator.id))
      .orderBy(desc(Miscellaneous.createdAt));

    return rows.map((row) => miscDeliveryRecordSchema.parse(row));
  });

export type MiscDeliveryRecord = z.infer<typeof miscDeliveryRecordSchema>;
