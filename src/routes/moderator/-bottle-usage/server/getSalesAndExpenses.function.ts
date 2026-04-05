import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db";
import { BottleUsage, Miscellaneous, OtherExpense } from "@/db/schema";
import { requireModeratorAuthMiddleware } from "@/routes/moderator/login/-server/modMiddleware.function";
import {
  getSalesAndExpensesInputSchema,
  salesExpenseSummarySchema,
} from "@/types/moderator.types";

export const getSalesAndExpenses = createServerFn({ method: "GET" })
  .middleware([requireModeratorAuthMiddleware])
  .inputValidator(getSalesAndExpensesInputSchema)
  .handler(getSalesAndExpensesHandler);

export async function getSalesAndExpensesHandler({
  data,
  context,
}: {
  data: {
    date: Date;
  };
  context: {
    moderator: {
      id: string;
    };
  };
}) {
    const usageRows = await db
      .select({
        sales: BottleUsage.sales,
        revenue: BottleUsage.revenue,
      })
      .from(BottleUsage)
      .where(
        and(
          eq(BottleUsage.moderator_id, context.moderator.id),
          gte(BottleUsage.createdAt, startOfDay(data.date)),
          lte(BottleUsage.createdAt, endOfDay(data.date)),
        ),
      )
      .orderBy(desc(BottleUsage.createdAt))
      .limit(1);

    const expenseRows = await db
      .select({
        amount: OtherExpense.amount,
        refilled_bottles: OtherExpense.refilled_bottles,
      })
      .from(OtherExpense)
      .where(
        and(
          eq(OtherExpense.moderator_id, context.moderator.id),
          gte(OtherExpense.date, startOfDay(data.date)),
          lte(OtherExpense.date, endOfDay(data.date)),
        ),
      );

    const miscRows = await db
      .select({
        isPaid: Miscellaneous.isPaid,
        payment: Miscellaneous.payment,
      })
      .from(Miscellaneous)
      .where(
        and(
          eq(Miscellaneous.moderator_id, context.moderator.id),
          gte(Miscellaneous.delivery_date, startOfDay(data.date)),
          lte(Miscellaneous.delivery_date, endOfDay(data.date)),
        ),
      );

    const sales = usageRows[0]?.sales ?? 0;
    const revenue = usageRows[0]?.revenue ?? 0;
    const expenses = expenseRows.reduce((sum, row) => sum + row.amount, 0);
    const refilled_bottles = expenseRows.reduce(
      (sum, row) => sum + row.refilled_bottles,
      0,
    );
    const misc_revenue = miscRows.reduce(
      (sum, row) => sum + (row.isPaid ? row.payment : 0),
      0,
    );

    return salesExpenseSummarySchema.parse({
      sales,
      revenue,
      expenses,
      misc_revenue,
      refilled_bottles,
      net: revenue + misc_revenue - expenses,
    });
}

