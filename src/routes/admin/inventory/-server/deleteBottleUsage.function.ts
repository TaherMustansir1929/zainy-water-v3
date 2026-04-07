import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import {
  deleteBottleUsageInputSchema,
  inventoryMutationResultSchema,
} from "./inventory.schemas";
import { db } from "@/db";
import { BottleUsage } from "@/db/schema";

export const deleteBottleUsage = createServerFn({ method: "POST" })
  .inputValidator(deleteBottleUsageInputSchema)
  .handler(async ({ data }) => {
    await requireAdminAuthorization();

    const rows = await db
      .select()
      .from(BottleUsage)
      .where(eq(BottleUsage.id, data.id))
      .limit(1);

    const bottleUsage = rows.at(0);
    if (!bottleUsage) {
      throw new Error("Bottle usage record not found");
    }

    await db.delete(BottleUsage).where(eq(BottleUsage.id, bottleUsage.id));

    return inventoryMutationResultSchema.parse({
      success: true,
      message: "Bottle usage deleted successfully",
    });
  });
