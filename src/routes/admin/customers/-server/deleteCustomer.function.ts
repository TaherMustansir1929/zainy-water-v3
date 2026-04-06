import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import { deleteCustomerInputSchema } from "./customer.schemas";
import { db } from "@/db";
import { Customer, Delivery } from "@/db/schema";

export const deleteCustomer = createServerFn({ method: "POST" })
  .inputValidator(deleteCustomerInputSchema)
  .handler(async ({ data }) => {
    await requireAdminAuthorization();

    const customerRows = await db
      .select({ customer_id: Customer.customer_id })
      .from(Customer)
      .where(eq(Customer.id, data.id))
      .limit(1);

    const customer = customerRows.at(0);
    if (!customer) {
      throw new Error("Customer not found.");
    }

    const deliveryRows = await db
      .select({ id: Delivery.id })
      .from(Delivery)
      .where(eq(Delivery.customer_id, customer.customer_id))
      .limit(1);

    if (deliveryRows.length > 0) {
      throw new Error(
        "This customer has delivery records and cannot be deleted. Please mark the customer as inactive instead.",
      );
    }

    await db.delete(Customer).where(eq(Customer.id, data.id));
  });
