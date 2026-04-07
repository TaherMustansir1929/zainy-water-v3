import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import {
  inventoryMutationResultSchema,
  totalBottlesDataSchema,
} from "./inventory.schemas";
import { db } from "@/db";
import { TotalBottles } from "@/db/schema";

export const updateTotalBottles = createServerFn({ method: "POST" })
  .inputValidator(totalBottlesDataSchema)
  .handler(async ({ data }) => {
    await requireAdminAuthorization();

    const latestRows = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt))
      .limit(1);

    const latestTotalBottles = latestRows.at(0);

    if (!latestTotalBottles) {
      const total = data.total_bottles ?? 0;
      const available = data.available_bottles ?? total;
      const used = data.used_bottles ?? 0;
      const damaged = data.damaged_bottles ?? 0;

      if (available + used > total) {
        return inventoryMutationResultSchema.parse({
          success: false,
          message:
            "Total bottles cannot be less than the sum of available and used bottles",
        });
      }

      await db.insert(TotalBottles).values({
        total_bottles: total,
        available_bottles: available,
        used_bottles: used,
        damaged_bottles: damaged,
      });

      return inventoryMutationResultSchema.parse({
        success: true,
        message: "New Bottles record added successfully",
      });
    }

    if (data.total_bottles !== undefined) {
      const availableBottles =
        latestTotalBottles.available_bottles +
        data.total_bottles -
        latestTotalBottles.total_bottles;

      await db
        .update(TotalBottles)
        .set({
          total_bottles: data.total_bottles,
          available_bottles: availableBottles,
          updatedAt: new Date(),
        })
        .where(eq(TotalBottles.id, latestTotalBottles.id));

      return inventoryMutationResultSchema.parse({
        success: true,
        message: "Total bottles updated successfully",
      });
    }

    if (data.available_bottles !== undefined) {
      if (data.available_bottles > latestTotalBottles.total_bottles) {
        return inventoryMutationResultSchema.parse({
          success: false,
          message:
            "Available bottles cannot be greater than current available bottles",
        });
      }

      const usedBottles =
        latestTotalBottles.used_bottles -
        (data.available_bottles - latestTotalBottles.available_bottles);

      await db
        .update(TotalBottles)
        .set({
          available_bottles: data.available_bottles,
          used_bottles: usedBottles,
          updatedAt: new Date(),
        })
        .where(eq(TotalBottles.id, latestTotalBottles.id));

      return inventoryMutationResultSchema.parse({
        success: true,
        message: "Available bottles updated successfully",
      });
    }

    if (data.used_bottles !== undefined) {
      if (data.used_bottles > latestTotalBottles.total_bottles) {
        return inventoryMutationResultSchema.parse({
          success: false,
          message: "Used bottles cannot be greater than total available bottles",
        });
      }

      const availableBottles =
        latestTotalBottles.available_bottles -
        (data.used_bottles - latestTotalBottles.used_bottles);

      await db
        .update(TotalBottles)
        .set({
          available_bottles: availableBottles,
          used_bottles: data.used_bottles,
          updatedAt: new Date(),
        })
        .where(eq(TotalBottles.id, latestTotalBottles.id));

      return inventoryMutationResultSchema.parse({
        success: true,
        message: "Used bottles updated successfully",
      });
    }

    if (data.damaged_bottles !== undefined) {
      await db
        .update(TotalBottles)
        .set({
          damaged_bottles: data.damaged_bottles,
          total_bottles:
            latestTotalBottles.total_bottles -
            (data.damaged_bottles - latestTotalBottles.damaged_bottles),
          available_bottles:
            latestTotalBottles.available_bottles -
            (data.damaged_bottles - latestTotalBottles.damaged_bottles),
          updatedAt: new Date(),
        })
        .where(eq(TotalBottles.id, latestTotalBottles.id));

      return inventoryMutationResultSchema.parse({
        success: true,
        message: "Damaged bottles updated successfully",
      });
    }

    return inventoryMutationResultSchema.parse({
      success: false,
      message: "Atleast one field must be provided",
    });
  });
