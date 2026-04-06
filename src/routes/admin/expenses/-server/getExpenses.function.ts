import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import { db } from "@/db";
import { Moderator, OtherExpense } from "@/db/schema";

const adminExpenseRecordSchema = z.object({
  id: z.string(),
  moderatorId: z.string(),
  moderatorName: z.string(),
  amount: z.number(),
  description: z.string(),
  refilledBottles: z.number(),
  date: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const getExpenses = createServerFn({ method: "GET" })
  .inputValidator(z.void())
  .handler(async () => {
    await requireAdminAuthorization();

    const rows = await db
      .select({
        id: OtherExpense.id,
        moderatorId: OtherExpense.moderator_id,
        moderatorName: Moderator.name,
        amount: OtherExpense.amount,
        description: OtherExpense.description,
        refilledBottles: OtherExpense.refilled_bottles,
        date: OtherExpense.date,
        createdAt: OtherExpense.createdAt,
        updatedAt: OtherExpense.updatedAt,
      })
      .from(OtherExpense)
      .innerJoin(Moderator, eq(OtherExpense.moderator_id, Moderator.id))
      .orderBy(desc(OtherExpense.createdAt));

    return rows.map((row) => adminExpenseRecordSchema.parse(row));
  });

export type AdminExpenseRecord = z.infer<typeof adminExpenseRecordSchema>;
