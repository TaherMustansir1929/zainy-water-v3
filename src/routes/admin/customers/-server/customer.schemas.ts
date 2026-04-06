import { z } from "zod";

import { Area } from "@/db/schema";

const phonePattern = /^\+92\s\d{3}\s\d{7}$/;

export function normalizePakistanPhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  let local = digits;
  if (local.startsWith("92")) {
    local = local.slice(2);
  }
  if (local.startsWith("0")) {
    local = local.slice(1);
  }

  local = local.slice(0, 10);

  const prefix = local.slice(0, 3);
  const suffix = local.slice(3);

  if (prefix.length === 0) {
    return "+92";
  }

  if (suffix.length === 0) {
    return `+92 ${prefix}`;
  }

  return `+92 ${prefix} ${suffix}`;
}

const phoneMutationSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizePakistanPhone(value) : value),
  z.string().regex(phonePattern, "Phone number must follow +92 333 6669999 format."),
);

const phoneRecordSchema = z.string().trim().min(1);

export const customerMutationSchema = z.object({
  customer_id: z.string().trim().min(1).max(255),
  name: z.string().trim().min(1).max(255),
  address: z.string().trim().min(1),
  area: z.enum(Area.enumValues),
  phone: phoneMutationSchema,
  bottle_price: z.number().int().min(0),
  bottles: z.number().int().min(0),
  deposit: z.number().int().min(0),
  deposit_price: z.number().int().min(0),
  balance: z.number().int(),
  isActive: z.boolean(),
  customerSince: z.date(),
});

export const customerRecordSchema = customerMutationSchema.extend({
  phone: phoneRecordSchema,
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createCustomerInputSchema = z.object({
  data: customerMutationSchema,
});

export const updateCustomerInputSchema = z.object({
  id: z.string().trim().min(1),
  data: customerMutationSchema,
});

export const deleteCustomerInputSchema = z.object({
  id: z.string().trim().min(1),
});

export type CustomerMutationInput = z.infer<typeof customerMutationSchema>;
export type CustomerRecord = z.infer<typeof customerRecordSchema>;