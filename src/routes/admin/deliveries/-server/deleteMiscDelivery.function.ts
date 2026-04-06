import { createServerFn } from "@tanstack/react-start";
import { endOfDay, startOfDay } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import {
  deleteMiscDeliveryInputSchema,
  deliveryMutationResultSchema,
} from "./deliveries.schemas";
import { db } from "@/db";
import { BottleUsage, Miscellaneous } from "@/db/schema";

export const deleteMiscDelivery = createServerFn({ method: "POST" })
  .inputValidator(deleteMiscDeliveryInputSchema)
  .handler(async ({ data }) => {
    await requireAdminAuthorization();

    const miscRows = await db
      .select()
      .from(Miscellaneous)
      .where(eq(Miscellaneous.id, data.deliveryId))
      .limit(1);

    const miscDelivery = miscRows.at(0);
    if (!miscDelivery) {
      throw new Error("Miscellaneous delivery record not found.");
    }

    const dayStart = startOfDay(miscDelivery.delivery_date);
    const dayEnd = endOfDay(miscDelivery.delivery_date);

    const bottleUsageRows = await db
      .select()
      .from(BottleUsage)
      .where(
        and(
          eq(BottleUsage.moderator_id, miscDelivery.moderator_id),
          lte(BottleUsage.createdAt, dayEnd),
          gte(BottleUsage.createdAt, dayStart),
        ),
      )
      .limit(1);

    const bottleUsage = bottleUsageRows.at(0);
    if (!bottleUsage) {
      throw new Error(
        "Bottle usage record not found for the given date and moderator.",
      );
    }

    await db.transaction(async (tx) => {
      await Promise.all([
        tx
          .update(BottleUsage)
          .set({
            sales: bottleUsage.sales - miscDelivery.filled_bottles,
            revenue: bottleUsage.revenue - miscDelivery.payment,
            empty_bottles:
              bottleUsage.empty_bottles - miscDelivery.empty_bottles,
            damaged_bottles:
              bottleUsage.damaged_bottles - miscDelivery.damaged_bottles,
            updatedAt: new Date(),
          })
          .where(eq(BottleUsage.id, bottleUsage.id)),

        tx.delete(Miscellaneous).where(eq(Miscellaneous.id, miscDelivery.id)),
      ]);
    });

    return deliveryMutationResultSchema.parse({
      success: true,
      message: "Miscellaneous delivery deleted successfully.",
    });
  });
