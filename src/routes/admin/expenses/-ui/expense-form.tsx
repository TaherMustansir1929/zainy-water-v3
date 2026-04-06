"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";

import type { AdminExpenseRecord } from "../-server/getExpenses.function";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

const expenseFormSchema = z.object({
  amount: z.number().int().min(0),
  description: z.string().trim().min(1).max(500),
  refilled_bottles: z.number().int().min(0),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

type ExpenseFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: AdminExpenseRecord | null;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export const ExpenseForm = ({
  open,
  onOpenChange,
  expense,
  onSubmit,
  onDelete,
}: ExpenseFormProps) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const defaultValues = React.useMemo<ExpenseFormValues>(
    () => ({
      amount: expense?.amount ?? 0,
      description: expense?.description ?? "",
      refilled_bottles: expense?.refilledBottles ?? 0,
    }),
    [expense],
  );

  const isImmutable = React.useMemo(() => {
    if (!expense) {
      return true;
    }

    return !isSameDay(expense.createdAt, new Date());
  }, [expense]);

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: expenseFormSchema,
    },
    onSubmitInvalid: () => {
      toast.error("Please review the expense form fields.");
    },
    onSubmit: async ({ value }) => {
      if (isImmutable || !expense) {
        return;
      }

      await onSubmit(value);
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  const handleDelete = React.useCallback(async () => {
    if (!onDelete || isImmutable) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  }, [isImmutable, onDelete]);

  const statusLabel = isImmutable ? "Done" : "Today's expense";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edit Expense</SheetTitle>
          <SheetDescription>
            Update expense details for the selected record.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-6 pb-4 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-2 rounded-2xl border bg-card p-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide">Moderator</span>
              <span className="text-sm font-medium text-foreground">{expense?.moderatorName ?? "-"}</span>
            </div>
            <Badge variant={isImmutable ? "outline" : "secondary"}>{statusLabel}</Badge>
          </div>
          <p>{`Date: ${expense ? format(expense.date, "PPP") : "-"}`}</p>
        </div>

        {isImmutable ? (
          <div className="px-6 pb-4">
            <Alert variant="destructive">
              <AlertTitle>Record is immutable</AlertTitle>
              <AlertDescription>
                This expense has status Done, hence cannot be edited.
              </AlertDescription>
            </Alert>
          </div>
        ) : null}

        <form
          className="flex flex-col gap-6 px-6 pb-6"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="amount"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid} data-disabled={isImmutable}>
                    <FieldLabel htmlFor={field.name}>Amount</FieldLabel>
                    <Input
                      id={field.name}
                      type="number"
                      min={0}
                      step={1}
                      value={field.state.value}
                      aria-invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        field.handleChange(Number.isNaN(nextValue) ? 0 : nextValue);
                      }}
                      disabled={isImmutable}
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="description"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid} data-disabled={isImmutable}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <Textarea
                      id={field.name}
                      value={field.state.value}
                      aria-invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                      }}
                      disabled={isImmutable}
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="refilled_bottles"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid} data-disabled={isImmutable}>
                    <FieldLabel htmlFor={field.name}>Refilled bottles</FieldLabel>
                    <Input
                      id={field.name}
                      type="number"
                      min={0}
                      step={1}
                      value={field.state.value}
                      aria-invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        field.handleChange(Number.isNaN(nextValue) ? 0 : nextValue);
                      }}
                      disabled={isImmutable}
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />
          </FieldGroup>

          <form.Subscribe
            selector={(state) => ({
              isSubmitting: state.isSubmitting,
            })}
            children={({ isSubmitting }) => (
              <Button type="submit" className="shadow-sm" disabled={isSubmitting || isImmutable || !expense}>
                {isSubmitting ? <Spinner className="size-4" /> : null}
                {isSubmitting ? "Saving..." : "Update Expense"}
              </Button>
            )}
          />
        </form>

        {onDelete ? (
          <div className="px-6 pb-6">
            <Button
              type="button"
              variant="destructive"
              className="w-full shadow-sm"
              disabled={isDeleting || isImmutable || !expense}
              onClick={() => {
                void handleDelete();
              }}
            >
              {isDeleting ? <Spinner className="size-4" /> : null}
              {isDeleting ? "Deleting..." : "Delete Expense"}
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};