import { createServerFn } from "@tanstack/react-start";
import { desc } from "drizzle-orm";
import { z } from "zod";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import { customerRecordSchema } from "./customer.schemas";
import { db } from "@/db";
import { Customer } from "@/db/schema";

export const getAllCustomers = createServerFn({ method: "GET" })
  .inputValidator(z.void())
  .handler(async () => {
    await requireAdminAuthorization();

    const customers = await db
      .select()
      .from(Customer)
      .orderBy(desc(Customer.createdAt));

    return customers.map((customer) => customerRecordSchema.parse(customer));
  });

export type CustomerRecord = z.infer<typeof customerRecordSchema>;
