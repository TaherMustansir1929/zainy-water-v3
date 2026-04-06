"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";

import type { MiscDeliveryRecord } from "../-server/getMiscDeliveries.function";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const miscDeliveryFormSchema = z
  .object({
    customer_name: z.string().trim().min(1).max(255),
    description: z.string().trim().min(1).max(1000),
    isPaid: z.boolean(),
    payment: z.number().int().min(0),
    filled_bottles: z.number().int().min(0),
    empty_bottles: z.number().int().min(0),
    damaged_bottles: z.number().int().min(0),
  })
  .refine((data) => data.damaged_bottles <= data.empty_bottles, {
    message: "Damaged bottles cannot exceed empty bottles.",
    path: ["damaged_bottles"],
  });

export type MiscDeliveryFormValues = z.infer<typeof miscDeliveryFormSchema>;

type MiscDeliveryFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: MiscDeliveryRecord | null;
  onSubmit: (values: MiscDeliveryFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
};

function toPositiveNumber(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.max(0, Math.trunc(parsed));
}

export const MiscDeliveryForm = ({
  open,
  onOpenChange,
  delivery,
  onSubmit,
  onDelete,
}: MiscDeliveryFormProps) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const defaultValues = React.useMemo<MiscDeliveryFormValues>(
    () => ({
      customer_name: delivery?.customerName ?? "",
      description: delivery?.description ?? "",
      isPaid: delivery?.isPaid ?? false,
      payment: delivery?.payment ?? 0,
      filled_bottles: delivery?.filledBottles ?? 0,
      empty_bottles: delivery?.emptyBottles ?? 0,
      damaged_bottles: delivery?.damagedBottles ?? 0,
    }),
    [delivery],
  );

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: miscDeliveryFormSchema,
    },
    onSubmitInvalid: () => {
      toast.error("Please review the miscellaneous delivery form fields.");
    },
    onSubmit: async ({ value }) => {
      if (!delivery) {
        return;
      }

      await onSubmit({
        ...value,
        payment: value.isPaid ? value.payment : 0,
      });
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
          <SheetTitle>Edit Miscellaneous Delivery</SheetTitle>
          <SheetDescription>
            Update miscellaneous delivery values for the selected record.
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
              name="customer_name"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Customer name</FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      aria-invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                      }}
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
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <Textarea
                      id={field.name}
                      value={field.state.value}
                      aria-invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                      }}
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="isPaid"
              children={(field) => (
                <Field orientation="horizontal">
                  <Switch
                    id="misc-paid-switch"
                    checked={field.state.value}
                    onCheckedChange={(checked) => {
                      const isPaid = Boolean(checked);
                      field.handleChange(isPaid);

                      if (!isPaid) {
                        form.setFieldValue("payment", 0);
                      }
                    }}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="misc-paid-switch">{field.state.value ? "Paid" : "FOC"}</FieldLabel>
                  </FieldContent>
                </Field>
              )}
            />

            <form.Field
              name="payment"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const isPaid = form.state.values.isPaid;

                return (
                  <Field data-invalid={isInvalid} data-disabled={!isPaid}>
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
                      disabled={!isPaid}
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
                {isSubmitting ? "Saving..." : "Update Miscellaneous Delivery"}
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
              {isDeleting ? "Deleting..." : "Delete Miscellaneous Delivery"}
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};