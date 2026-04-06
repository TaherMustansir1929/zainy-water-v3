"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";

import type { DailyDeliveryRecord } from "../-server/getDailyDeliveries.function";
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

const dailyDeliveryFormSchema = z
  .object({
    payment: z.number().int().min(0),
    filled_bottles: z.number().int().min(0),
    empty_bottles: z.number().int().min(0),
    foc: z.number().int().min(0),
    damaged_bottles: z.number().int().min(0),
  })
  .refine((data) => data.foc <= data.filled_bottles, {
    message: "FOC cannot exceed filled bottles.",
    path: ["foc"],
  })
  .refine((data) => data.damaged_bottles <= data.empty_bottles, {
    message: "Damaged bottles cannot exceed empty bottles.",
    path: ["damaged_bottles"],
  });

export type DailyDeliveryFormValues = z.infer<typeof dailyDeliveryFormSchema>;

type DailyDeliveryFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: DailyDeliveryRecord | null;
  onSubmit: (values: DailyDeliveryFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
};

function toPositiveNumber(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.max(0, Math.trunc(parsed));
}

export const DailyDeliveryForm = ({
  open,
  onOpenChange,
  delivery,
  onSubmit,
  onDelete,
}: DailyDeliveryFormProps) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const defaultValues = React.useMemo<DailyDeliveryFormValues>(
    () => ({
      payment: delivery?.payment ?? 0,
      filled_bottles: delivery?.filledBottles ?? 0,
      empty_bottles: delivery?.emptyBottles ?? 0,
      foc: delivery?.foc ?? 0,
      damaged_bottles: delivery?.damagedBottles ?? 0,
    }),
    [delivery],
  );

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: dailyDeliveryFormSchema,
    },
    onSubmitInvalid: () => {
      toast.error("Please review the daily delivery form fields.");
    },
    onSubmit: async ({ value }) => {
      if (!delivery) {
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
    if (!onDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edit Daily Delivery</SheetTitle>
          <SheetDescription>
            Update daily delivery values for the selected record.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-6 pb-4 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-2 rounded-2xl border bg-card p-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide">Customer</span>
              <span className="text-sm font-medium text-foreground">{delivery?.customerName ?? "-"}</span>
            </div>
            <Badge variant="secondary">Editable</Badge>
          </div>
          <p>{`Moderator: ${delivery?.moderatorName ?? "-"}`}</p>
          <p>{`Date: ${delivery ? format(delivery.deliveryDate, "PPPP") : "-"}`}</p>
        </div>

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
              name="payment"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Payment</FieldLabel>
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
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="filled_bottles"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Filled bottles</FieldLabel>
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
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="empty_bottles"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Empty bottles</FieldLabel>
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
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="foc"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>FOC</FieldLabel>
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
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="damaged_bottles"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Damaged bottles</FieldLabel>
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
              <Button type="submit" className="shadow-sm" disabled={isSubmitting || !delivery}>
                {isSubmitting ? <Spinner className="size-4" /> : null}
                {isSubmitting ? "Saving..." : "Update Daily Delivery"}
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
              disabled={isDeleting || !delivery}
              onClick={() => {
                void handleDelete();
              }}
            >
              {isDeleting ? <Spinner className="size-4" /> : null}
              {isDeleting ? "Deleting..." : "Delete Daily Delivery"}
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};