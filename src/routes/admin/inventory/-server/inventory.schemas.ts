import { z } from "zod";

export const totalBottlesDataSchema = z.object({
  total_bottles: z.number().int().min(0).optional(),
  available_bottles: z.number().int().min(0).optional(),
  used_bottles: z.number().int().min(0).optional(),
  damaged_bottles: z.number().int().min(0).optional(),
});

export const totalBottlesRecordSchema = z.object({
  id: z.string(),
  total_bottles: z.number().int(),
  available_bottles: z.number().int(),
  used_bottles: z.number().int(),
  damaged_bottles: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const bottleUsageRecordSchema = z.object({
  id: z.string(),
  moderatorId: z.string(),
  moderatorName: z.string(),
  done: z.boolean(),
  revenue: z.number().int(),
  expense: z.number().int(),
  filled: z.number().int(),
  refilled: z.number().int(),
  sales: z.number().int(),
  empty: z.number().int(),
  remaining: z.number().int(),
  emptyReturned: z.number().int(),
  remainingReturned: z.number().int(),
  returned: z.number().int(),
  damaged: z.number().int(),
  capsTaken: z.number().int(),
  capsUsed: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateBottleUsageInputSchema = z.object({
  id: z.string().trim().min(1),
  status: z.boolean(),
  revenue: z.number().int().min(0),
  expense: z.number().int().min(0),
  filled: z.number().int().min(0),
  sales: z.number().int().min(0),
  empty: z.number().int().min(0),
  remaining: z.number().int().min(0),
  empty_returned: z.number().int().min(0),
  remaining_returned: z.number().int().min(0),
  damaged: z.number().int().min(0),
  refilled: z.number().int().min(0),
  caps: z.number().int().min(0),
});

export const deleteBottleUsageInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const salesAndExpensesInputSchema = z.object({
  moderatorId: z.string().trim().min(1),
  date: z.coerce.date(),
});

export const salesAndExpensesResultSchema = z.object({
  sales: z.number().int(),
  expenses: z.number().int(),
  date: z.date(),
});

export const inventoryMutationResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type TotalBottlesDataInput = z.infer<typeof totalBottlesDataSchema>;
export type TotalBottlesRecord = z.infer<typeof totalBottlesRecordSchema>;
export type BottleUsageRecord = z.infer<typeof bottleUsageRecordSchema>;
export type UpdateBottleUsageInput = z.infer<typeof updateBottleUsageInputSchema>;
export type DeleteBottleUsageInput = z.infer<typeof deleteBottleUsageInputSchema>;
export type SalesAndExpensesInput = z.infer<typeof salesAndExpensesInputSchema>;
export type SalesAndExpensesResult = z.infer<typeof salesAndExpensesResultSchema>;
