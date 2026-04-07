"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";

import type { InventoryBottleUsageRecord } from "../-server/getBottleUsageRecords.function";
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

const inventoryUsageFormSchema = z
  .object({
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
  })
  .refine((value) => value.empty <= value.sales, {
    message: "Empty bottles cannot exceed sales",
    path: ["empty"],
  })
  .refine((value) => value.sales <= value.filled + value.refilled, {
    message: "Sales cannot exceed filled + refilled bottles",
    path: ["sales"],
  })
  .refine((value) => value.remaining <= value.filled - value.empty_returned - value.remaining_returned, {
    message: "Remaining bottles cannot exceed filled - returned bottles",
    path: ["remaining"],
  })
  .refine((value) => value.empty_returned <= value.sales - value.remaining_returned, {
    message: "Empty returned bottles cannot exceed sales",
    path: ["empty_returned"],
  })
  .refine((value) => value.remaining_returned <= value.filled + value.refilled - value.sales, {
    message: "Remaining returned bottles cannot exceed filled + refilled bottles - sales",
    path: ["remaining_returned"],
  })
  .refine((value) => value.refilled <= value.sales, {
    message: "Refilled bottles cannot exceed sales",
    path: ["refilled"],
  })
  .refine((value) => value.caps >= value.refilled, {
    message: "Caps (taken) cannot be less than refilled bottles",
    path: ["caps"],
  });

export type InventoryUsageFormValues = z.infer<typeof inventoryUsageFormSchema>;

type InventoryUsageFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usage: InventoryBottleUsageRecord | null;
  onSubmit: (values: InventoryUsageFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
};

function toPositiveNumber(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.max(0, Math.trunc(parsed));
}

export const InventoryUsageForm = ({
  open,
  onOpenChange,
  usage,
  onSubmit,
  onDelete,
}: InventoryUsageFormProps) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const defaultValues = React.useMemo<InventoryUsageFormValues>(
    () => ({
      status: usage?.done ?? false,
      revenue: usage?.revenue ?? 0,
      expense: usage?.expense ?? 0,
      filled: usage?.filled ?? 0,
      sales: usage?.sales ?? 0,
      empty: usage?.empty ?? 0,
      remaining: usage?.remaining ?? 0,
      empty_returned: usage?.emptyReturned ?? 0,
      remaining_returned: usage?.remainingReturned ?? 0,
      damaged: usage?.damaged ?? 0,
      refilled: usage?.refilled ?? 0,
      caps: usage?.capsTaken ?? 0,
    }),
    [usage],
  );

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: inventoryUsageFormSchema,
    },
    onSubmitInvalid: () => {
      toast.error("Please review the bottle usage form fields.");
    },
    onSubmit: async ({ value }) => {
      if (!usage) {
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
          <SheetTitle>Edit Bottle Usage</SheetTitle>
          <SheetDescription>
            Update bottle usage values for the selected moderator record.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-6 pb-4 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-2 rounded-2xl border bg-card p-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide">Moderator</span>
              <span className="text-sm font-medium text-foreground">{usage?.moderatorName ?? "-"}</span>
            </div>
            <Badge variant={usage?.done ? "outline" : "secondary"}>
              {usage?.done ? "Done" : "Today's usage"}
            </Badge>
          </div>
          <p>{`Date: ${usage ? format(usage.createdAt, "PPPP") : "-"}`}</p>
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
              name="status"
              children={(field) => (
                <Field orientation="horizontal">
                  <Switch
                    id="usage-status-switch"
                    checked={field.state.value}
                    onCheckedChange={(checked) => {
                      field.handleChange(Boolean(checked));
                    }}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="usage-status-switch">
                      {field.state.value ? "Done" : "Today's usage"}
                    </FieldLabel>
                  </FieldContent>
                </Field>
              )}
            />

            {(
              [
                ["revenue", "Revenue"],
                ["expense", "Expense"],
                ["filled", "Filled bottles"],
                ["sales", "Sales"],
                ["empty", "Empty bottles"],
                ["remaining", "Remaining bottles"],
                ["empty_returned", "Empty returned"],
                ["remaining_returned", "Remaining returned"],
                ["damaged", "Damaged bottles"],
                ["refilled", "Refilled bottles"],
                ["caps", "Caps (taken)"],
              ] as const
            ).map(([fieldName, label]) => (
              <form.Field
                key={fieldName}
                name={fieldName}
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
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
            ))}
          </FieldGroup>

          <form.Subscribe
            selector={(state) => ({
              isSubmitting: state.isSubmitting,
            })}
            children={({ isSubmitting }) => (
              <Button type="submit" className="shadow-sm" disabled={isSubmitting || !usage}>
                {isSubmitting ? <Spinner className="size-4" /> : null}
                {isSubmitting ? "Saving..." : "Update Bottle Usage"}
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
              disabled={isDeleting || !usage}
              onClick={() => {
                void handleDelete();
              }}
            >
              {isDeleting ? <Spinner className="size-4" /> : null}
              {isDeleting ? "Deleting..." : "Delete Bottle Usage"}
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};
