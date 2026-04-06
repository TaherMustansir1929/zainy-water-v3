import { z } from "zod";

export const dailyDeliveryRecordSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  moderatorId: z.string(),
  moderatorName: z.string(),
  deliveryDate: z.date(),
  payment: z.number().int(),
  balance: z.number().int(),
  filledBottles: z.number().int(),
  emptyBottles: z.number().int(),
  foc: z.number().int(),
  damagedBottles: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const miscDeliveryRecordSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  moderatorId: z.string(),
  moderatorName: z.string(),
  deliveryDate: z.date(),
  isPaid: z.boolean(),
  payment: z.number().int(),
  filledBottles: z.number().int(),
  emptyBottles: z.number().int(),
  damagedBottles: z.number().int(),
  description: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateDailyDeliveryInputSchema = z.object({
  deliveryId: z.string().trim().min(1),
  data: z
    .object({
      payment: z.number().int().min(0),
      filled_bottles: z.number().int().min(0),
      empty_bottles: z.number().int().min(0),
      foc: z.number().int().min(0),
      damaged_bottles: z.number().int().min(0),
    })
    .refine((value) => value.foc <= value.filled_bottles, {
      message: "FOC cannot exceed filled bottles.",
      path: ["foc"],
    })
    .refine((value) => value.damaged_bottles <= value.empty_bottles, {
      message: "Damaged bottles cannot exceed empty bottles.",
      path: ["damaged_bottles"],
    }),
});

export const updateMiscDeliveryInputSchema = z.object({
  deliveryId: z.string().trim().min(1),
  data: z
    .object({
      customer_name: z.string().trim().min(1).max(255),
      description: z.string().trim().min(1).max(1000),
      isPaid: z.boolean(),
      payment: z.number().int().min(0),
      filled_bottles: z.number().int().min(0),
      empty_bottles: z.number().int().min(0),
      damaged_bottles: z.number().int().min(0),
    })
    .refine((value) => value.damaged_bottles <= value.empty_bottles, {
      message: "Damaged bottles cannot exceed empty bottles.",
      path: ["damaged_bottles"],
    }),
});

export const deleteDailyDeliveryInputSchema = z.object({
  deliveryId: z.string().trim().min(1),
});

export const deleteMiscDeliveryInputSchema = z.object({
  deliveryId: z.string().trim().min(1),
});

export const deliveryMutationResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type DailyDeliveryRecord = z.infer<typeof dailyDeliveryRecordSchema>;
export type MiscDeliveryRecord = z.infer<typeof miscDeliveryRecordSchema>;
export type UpdateDailyDeliveryInput = z.infer<typeof updateDailyDeliveryInputSchema>;
export type UpdateMiscDeliveryInput = z.infer<typeof updateMiscDeliveryInputSchema>;
export type DeleteDailyDeliveryInput = z.infer<typeof deleteDailyDeliveryInputSchema>;
export type DeleteMiscDeliveryInput = z.infer<typeof deleteMiscDeliveryInputSchema>;
