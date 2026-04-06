import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import { customerRecordSchema, updateCustomerInputSchema } from "./customer.schemas";
import { db } from "@/db";
import { Customer, TotalBottles } from "@/db/schema";

export const updateCustomer = createServerFn({ method: "POST" })
  .inputValidator(updateCustomerInputSchema)
  .handler(async ({ data }) => {
    await requireAdminAuthorization();

    const customerRows = await db
      .select()
      .from(Customer)
      .where(eq(Customer.id, data.id))
      .limit(1);

    const customerInfo = customerRows.at(0);
    if (!customerInfo) {
      throw new Error("Customer not found.");
    }

    const totalBottleRows = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt))
      .limit(1);

    const totalBottles = totalBottleRows.at(0);
    if (!totalBottles) {
      throw new Error("Cannot update customer: TotalBottles entry does not exist.");
    }

    const bottleDifference = data.data.bottles - customerInfo.bottles;
    const depositDifference = data.data.deposit - customerInfo.deposit;

    const newAvailableBottles =
      totalBottles.available_bottles - bottleDifference - depositDifference;
    const newUsedBottles = totalBottles.used_bottles + bottleDifference;
    const newDepositBottles = totalBottles.deposit_bottles + depositDifference;
    const newTotalBottles = totalBottles.total_bottles - depositDifference;

    if (
      depositDifference > newAvailableBottles ||
      newTotalBottles < newAvailableBottles + newUsedBottles ||
      newAvailableBottles < 0 ||
      newUsedBottles < 0
    ) {
      throw new Error("Cannot update customer: Not enough available bottles.");
    }

    const updatedRows = await db.transaction(async (tx) => {
      await tx
        .update(TotalBottles)
        .set({
          total_bottles: newTotalBottles,
          available_bottles: newAvailableBottles,
          used_bottles: newUsedBottles,
          deposit_bottles: newDepositBottles,
          updatedAt: new Date(),
        })
        .where(eq(TotalBottles.id, totalBottles.id));

      return tx
        .update(Customer)
        .set({
          ...data.data,
          customer_id: data.data.customer_id.toLowerCase(),
          updatedAt: new Date(),
        })
        .where(eq(Customer.id, data.id))
        .returning();
    });

    const updatedCustomer = updatedRows.at(0);
    if (!updatedCustomer) {
      throw new Error("Failed to update customer.");
    }

    return customerRecordSchema.parse(updatedCustomer);
  });
