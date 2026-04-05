"use client";

import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { z } from "zod";
import { toast } from "sonner";

import { addOtherExpense } from "../server/addOtherExpense.function";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { IncrementInput } from "@/components/web/increment-input";
import { useModeratorSession } from "@/hooks/use-moderator-session";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";

const otherExpenseFormSchema = z.object({
  refilled_bottles: z.number().int().min(0),
  amount: z.number().int().min(0),
  description: z.string().trim().min(1, "Description is required.").max(500),
});

type OtherExpenseFormProps = {
  onAdded?: () => void;
};

function toPositiveNumber(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

export const OtherExpenseForm = ({ onAdded }: OtherExpenseFormProps) => {
  const { isAuthenticated, sessionToken } = useModeratorSession();
  const dob = useDOBStore((state) => state.dob);

  const form = useForm({
    defaultValues: {
      refilled_bottles: 0,
      amount: 0,
      description: "",
    },
    validators: {
      onSubmit: otherExpenseFormSchema,
    },
    onSubmitInvalid: () => {
      toast.error("Please review the expense form fields.");
    },
    onSubmit: async ({ value }) => {
      if (!isAuthenticated || !sessionToken) {
        toast.error("Session not found. Please login again.");
        return;
      }

      if (!dob) {
        toast.error("Please select a date first.");
        return;
      }

      const result = await addOtherExpense({
        data: {
          sessionToken,
          date: dob,
          refilled_bottles: value.refilled_bottles,
          amount: value.amount,
          description: value.description.trim(),
        },
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message ?? "Other expense added successfully.");
      form.reset();
      onAdded?.();
    },
  });

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className="rounded-2xl border bg-muted/30 p-3 text-xs text-muted-foreground">
        {`Adding expense for ${format(dob ?? new Date(), "dd MMM yyyy")}`}
      </div>

      <FieldGroup className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <form.Field
          name="refilled_bottles"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Refilled Bottles</FieldLabel>
                <IncrementInput
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  isInvalid={isInvalid}
                  onBlur={field.handleBlur}
                  onChange={(nextValue) => {
                    field.handleChange(nextValue);
                  }}
                />
                {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
              </Field>
            );
          }}
        />

        <form.Field
          name="amount"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Amount</FieldLabel>
                <div className="rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
                  <Input
                    id={field.name}
                    type="number"
                    min={0}
                    value={field.state.value}
                    aria-invalid={isInvalid}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(toPositiveNumber(event.target.value));
                    }}
                    className="rounded-xl border border-border/70 bg-background shadow-[0_2px_5px_rgba(0,0,0,0.16)]"
                  />
                </div>
                {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
              </Field>
            );
          }}
        />
      </FieldGroup>

      <form.Field
        name="description"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
              <div className="rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  aria-invalid={isInvalid}
                  rows={4}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                  }}
                  placeholder="Enter expense description"
                  className="rounded-xl border border-border/70 bg-background shadow-[0_2px_5px_rgba(0,0,0,0.16)]"
                />
              </div>
              {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
            </Field>
          );
        }}
      />

      <Button
        type="submit"
        disabled={form.state.isSubmitting || !isAuthenticated || !sessionToken}
        className="shadow-sm"
      >
        {form.state.isSubmitting ? <Spinner className="size-4" /> : null}
        {form.state.isSubmitting ? "Saving Expense..." : "Add Other Expense"}
      </Button>
    </form>
  );
};