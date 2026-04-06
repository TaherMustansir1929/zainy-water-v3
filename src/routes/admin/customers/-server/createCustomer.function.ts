import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import { createCustomerInputSchema, customerRecordSchema } from "./customer.schemas";
import { db } from "@/db";
import { Customer, TotalBottles } from "@/db/schema";

export const createCustomer = createServerFn({ method: "POST" })
  .inputValidator(createCustomerInputSchema)
  .handler(async ({ data }) => {
    await requireAdminAuthorization();

    const totalBottleRows = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt))
      .limit(1);

    const totalBottles = totalBottleRows.at(0);

    if (!totalBottles) {
      throw new Error("Cannot create customer: TotalBottles entry does not exist.");
    }

    if (data.data.deposit > totalBottles.available_bottles) {
      throw new Error("Cannot create customer: Not enough available bottles for the deposit.");
    }

    const insertedRows = await db.transaction(async (tx) => {
      await tx
        .update(TotalBottles)
        .set({
          total_bottles: totalBottles.total_bottles - data.data.deposit,
          available_bottles: totalBottles.available_bottles - data.data.deposit,
          deposit_bottles: totalBottles.deposit_bottles + data.data.deposit,
          updatedAt: new Date(),
        })
        .where(eq(TotalBottles.id, totalBottles.id));

      return tx
        .insert(Customer)
        .values({
          ...data.data,
          customer_id: data.data.customer_id.toLowerCase(),
        })
        .returning();
    });

    const createdCustomer = insertedRows.at(0);
    if (!createdCustomer) {
      throw new Error("Failed to create customer.");
    }

    return customerRecordSchema.parse(createdCustomer);
  });
