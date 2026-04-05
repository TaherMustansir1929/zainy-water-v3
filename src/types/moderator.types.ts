import { z } from "zod";
import { areas_list } from "@/db/areas";

const areaEnumValues = areas_list as [string, ...Array<string>];

export const moderatorAreaSchema = z.enum(areaEnumValues);
export type ModeratorArea = z.infer<typeof moderatorAreaSchema>;

export const deliveryFormSchema = z
  .object({
    customer_id: z.string().min(2).max(50),
    filled_bottles: z.number().min(0),
    empty_bottles: z.number().min(0),
    deposit_bottles_given: z.number().min(0),
    deposit_bottles_taken: z.number().min(0),
    foc: z.number().min(0),
    damaged_bottles: z.number().min(0),
    payment: z.number().min(0),
  })
  .refine((data) => data.foc <= data.filled_bottles, {
    message: "FOC bottles cannot exceed filled bottles",
    path: ["foc"],
  })
  .refine((data) => data.damaged_bottles <= data.empty_bottles, {
    message: "Damaged bottles cannot exceed empty bottles",
    path: ["damaged_bottles"],
  })
  .refine((data) => data.deposit_bottles_given <= data.filled_bottles, {
    message: "Deposit bottles cannot exceed filled bottles",
    path: ["deposit_bottles_given"],
  });

export type DeliveryFormValues = z.infer<typeof deliveryFormSchema>;

export const moderatorSessionTokenSchema = z.object({
  sessionToken: z.string().min(1, "Session token is required."),
});

export const getCustomersByAreaInputSchema = moderatorSessionTokenSchema.extend({
  area: moderatorAreaSchema,
});

export const getDailyDeliveriesInputSchema = moderatorSessionTokenSchema.extend({
  date: z.coerce.date(),
});

export const addDailyDeliveryInputSchema = moderatorSessionTokenSchema.extend({
  delivery_date: z.coerce.date(),
  customer_id: z.string().min(2).max(50),
  filled_bottles: z.number().min(0),
  empty_bottles: z.number().min(0),
  deposit_bottles_given: z.number().min(0),
  deposit_bottles_taken: z.number().min(0),
  foc: z.number().min(0),
  damaged_bottles: z.number().min(0),
  payment: z.number().min(0),
});

export const deleteDailyDeliveryInputSchema = moderatorSessionTokenSchema.extend({
  delivery_id: z.string().min(1),
  date: z.coerce.date(),
});

export const bottleUsageFormSchema = z.object({
  filled_bottles: z.number().int().min(0),
  caps: z.number().int().min(0),
});

export type BottleUsageFormValues = z.infer<typeof bottleUsageFormSchema>;

export const bottleReturnFormSchema = z.object({
  empty_bottles: z.number().int().min(0),
  remaining_bottles: z.number().int().min(0),
  caps: z.number().int().min(0),
});

export type BottleReturnFormValues = z.infer<typeof bottleReturnFormSchema>;

export const getBottleUsageInputSchema = moderatorSessionTokenSchema.extend({
  date: z.coerce.date(),
});

export const getSalesAndExpensesInputSchema = moderatorSessionTokenSchema.extend({
  date: z.coerce.date(),
});

export const getOtherExpensesInputSchema = moderatorSessionTokenSchema.extend({
  date: z.coerce.date(),
});

export const getMiscDeliveriesByModInputSchema = moderatorSessionTokenSchema.extend({
  date: z.coerce.date(),
});

export const addUpdateBottleUsageInputSchema = moderatorSessionTokenSchema.extend({
  date: z.coerce.date(),
  filled_bottles: z.number().int().min(0),
  caps: z.number().int().min(0),
});

export const returnBottleUsageInputSchema = moderatorSessionTokenSchema.extend({
  date: z.coerce.date(),
  empty_bottles: z.number().int().min(0),
  remaining_bottles: z.number().int().min(0),
  caps: z.number().int().min(0),
});

export const markBottleUsageInputSchema = moderatorSessionTokenSchema.extend({
  date: z.coerce.date(),
  done: z.boolean(),
});

export const deleteBottleUsageInputSchema = moderatorSessionTokenSchema.extend({
  date: z.coerce.date(),
});

export const addOtherExpenseInputSchema = moderatorSessionTokenSchema.extend({
  date: z.coerce.date(),
  amount: z.number().int().min(0),
  description: z.string().trim().min(1).max(500),
  refilled_bottles: z.number().int().min(0),
});

export const addMiscDeliveryInputSchema = moderatorSessionTokenSchema.extend({
  customer_name: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1).max(1000),
  filled_bottles: z.number().int().min(0),
  empty_bottles: z.number().int().min(0),
  damaged_bottles: z.number().int().min(0),
  isPaid: z.boolean(),
  payment: z.number().int().min(0),
  delivery_date: z.coerce.date(),
});

export const mutationResultSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    message: z.string().optional(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);

export type MutationResult = z.infer<typeof mutationResultSchema>;

export const customerDeliverySchema = z.object({
  id: z.string(),
  customer_id: z.string(),
  name: z.string(),
  address: z.string(),
  area: moderatorAreaSchema,
  phone: z.string(),
  bottle_price: z.number(),
  bottles: z.number(),
  deposit: z.number(),
  deposit_price: z.number(),
  balance: z.number(),
  isActive: z.boolean(),
});

export type CustomerDelivery = z.infer<typeof customerDeliverySchema>;

export const deliveryRecordSchema = z.object({
  id: z.string(),
  customer_id: z.string(),
  moderator_id: z.string(),
  delivery_date: z.date(),
  payment: z.number(),
  filled_bottles: z.number(),
  empty_bottles: z.number(),
  foc: z.number(),
  damaged_bottles: z.number(),
});

export type DeliveryRecord = z.infer<typeof deliveryRecordSchema>;

export const deliveryTableRowSchema = z.object({
  delivery: deliveryRecordSchema,
  customer: customerDeliverySchema,
});

export type DeliveryTableRow = z.infer<typeof deliveryTableRowSchema>;

export const bottleUsageDayRecordSchema = z.object({
  id: z.string(),
  moderator_id: z.string(),
  filled_bottles: z.number(),
  sales: z.number(),
  empty_bottles: z.number(),
  remaining_bottles: z.number(),
  returned_bottles: z.number(),
  empty_returned: z.number(),
  remaining_returned: z.number(),
  caps: z.number(),
  revenue: z.number(),
  expense: z.number(),
  done: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BottleUsageDayRecord = z.infer<typeof bottleUsageDayRecordSchema>;

export const bottleUsageViewSchema = z.object({
  available_bottles: z.number(),
  usage: bottleUsageDayRecordSchema.nullable(),
});

export type BottleUsageView = z.infer<typeof bottleUsageViewSchema>;

export const salesExpenseSummarySchema = z.object({
  sales: z.number(),
  revenue: z.number(),
  expenses: z.number(),
  misc_revenue: z.number(),
  refilled_bottles: z.number(),
  net: z.number(),
});

export type SalesExpenseSummary = z.infer<typeof salesExpenseSummarySchema>;

export const otherExpenseRecordSchema = z.object({
  id: z.string(),
  moderator_id: z.string(),
  amount: z.number(),
  description: z.string(),
  refilled_bottles: z.number(),
  date: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OtherExpenseRecord = z.infer<typeof otherExpenseRecordSchema>;

export const miscDeliveryRecordSchema = z.object({
  id: z.string(),
  moderator_id: z.string(),
  customer_name: z.string(),
  description: z.string(),
  isPaid: z.boolean(),
  payment: z.number(),
  filled_bottles: z.number(),
  empty_bottles: z.number(),
  damaged_bottles: z.number(),
  delivery_date: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MiscDeliveryRecord = z.infer<typeof miscDeliveryRecordSchema>;

export type BalanceSummary = {
  previousBalanceFromDatabase: number;
  todaysBill: number;
  totalRemainingBalance: number;
  todaysBillBeforeFoc: number;
  remainingCurrentBalance: number;
  advanceAmount: number;
};

export function calculateBalanceSummary(args: {
  customer: Pick<CustomerDelivery, "balance" | "bottle_price"> | null;
  filledBottles: number;
  foc: number;
  payment: number;
}): BalanceSummary {
  const { customer, filledBottles, foc, payment } = args;

  if (!customer) {
    return {
      previousBalanceFromDatabase: 0,
      todaysBill: 0,
      totalRemainingBalance: 0,
      todaysBillBeforeFoc: 0,
      remainingCurrentBalance: 0,
      advanceAmount: 0,
    };
  }

  const previousBalanceFromDatabase = customer.balance;
  const todaysBillBeforeFoc = customer.bottle_price * Math.max(0, filledBottles);
  const focDiscount = customer.bottle_price * Math.max(0, foc);
  const todaysBill = Math.max(0, todaysBillBeforeFoc - focDiscount);
  const totalBalanceBeforePayment = previousBalanceFromDatabase + todaysBill;
  const balanceAfterPayment = totalBalanceBeforePayment - Math.max(0, payment);

  if (balanceAfterPayment > 0) {
    return {
      previousBalanceFromDatabase,
      todaysBill,
      totalRemainingBalance: balanceAfterPayment,
      todaysBillBeforeFoc,
      remainingCurrentBalance: Math.max(0, todaysBill - Math.max(0, payment)),
      advanceAmount: 0,
    };
  }

  return {
    previousBalanceFromDatabase,
    todaysBill,
    totalRemainingBalance: 0,
    todaysBillBeforeFoc,
    remainingCurrentBalance: 0,
    advanceAmount: Math.abs(balanceAfterPayment),
  };
}

export function calculateFinalDeliveryState(args: {
  customer: Pick<CustomerDelivery, "balance" | "bottle_price" | "bottles">;
  values: DeliveryFormValues;
}): { balance: number; customer_bottles: number; deposit_bottles: number } {
  const { customer, values } = args;

  const rawCurrentBalance = customer.bottle_price * values.filled_bottles;
  const focDiscount = customer.bottle_price * values.foc;
  const finalCurrentBalanceBeforePayment = Math.max(0, rawCurrentBalance - focDiscount);
  const dbPreviousBalance = customer.balance;

  let remainingPayment = values.payment || 0;
  let finalCurrentBalance = finalCurrentBalanceBeforePayment;
  let finalPreviousBalance = dbPreviousBalance;

  if (remainingPayment > 0 && finalCurrentBalance > 0) {
    const deduction = Math.min(remainingPayment, finalCurrentBalance);
    finalCurrentBalance -= deduction;
    remainingPayment -= deduction;
  }

  if (remainingPayment > 0 && finalPreviousBalance > 0) {
    const deduction = Math.min(remainingPayment, finalPreviousBalance);
    finalPreviousBalance -= deduction;
    remainingPayment -= deduction;
  }

  let balance = finalPreviousBalance + finalCurrentBalance;
  if (remainingPayment > 0) {
    balance = -(
      remainingPayment +
      (dbPreviousBalance < 0 ? Math.abs(dbPreviousBalance) : 0)
    );
  }

  return {
    balance,
    customer_bottles: Math.max(
      customer.bottles +
        values.filled_bottles -
        values.empty_bottles -
        values.deposit_bottles_given,
      0,
    ),
    deposit_bottles: values.deposit_bottles_given - values.deposit_bottles_taken,
  };
}

export function getDeliveryBusinessRuleErrors(args: {
  customer: Pick<CustomerDelivery, "bottles" | "deposit">;
  values: Pick<
    DeliveryFormValues,
    "filled_bottles" | "empty_bottles" | "deposit_bottles_taken"
  >;
}): Array<{ field: "empty_bottles" | "deposit_bottles_taken"; message: string }> {
  const { customer, values } = args;
  const errors: Array<{
    field: "empty_bottles" | "deposit_bottles_taken";
    message: string;
  }> = [];

  if (values.empty_bottles > customer.bottles + values.filled_bottles) {
    errors.push({
      field: "empty_bottles",
      message: "Empty bottles cannot be more than customer's remaining bottles.",
    });
  }

  if (values.deposit_bottles_taken > customer.deposit) {
    errors.push({
      field: "deposit_bottles_taken",
      message: "Deposit bottles taken cannot be more than customer's deposit.",
    });
  }

  return errors;
}
