import { createServerFn } from "@tanstack/react-start";
import { desc } from "drizzle-orm";
import { z } from "zod";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import { totalBottlesRecordSchema } from "./inventory.schemas";
import { db } from "@/db";
import { TotalBottles } from "@/db/schema";

export const getTotalBottles = createServerFn({ method: "GET" })
  .inputValidator(z.void())
  .handler(async () => {
    await requireAdminAuthorization();

    const rows = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt))
      .limit(1);

    const latest = rows.at(0);
    if (!latest) {
      return null;
    }

    return totalBottlesRecordSchema.parse(latest);
  });
