"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";

import type { CustomerMutationInput } from "../-server/customer.schemas";
import { areas_list } from "@/db/areas";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

const areaValues = areas_list as [string, ...Array<string>];
const phonePattern = /^\+92\s\d{3}\s\d{7}$/;

const customerFormSchema = z.object({
  customer_id: z.string().trim().min(1).max(255),
  name: z.string().trim().min(1).max(255),
  phone: z
    .string()
    .trim()
    .regex(phonePattern, "Phone number must follow +92 333 6669999 format."),
  balance: z.number().int(),
  bottles: z.number().int().min(0),
  deposit: z.number().int().min(0),
  deposit_price: z.number().int().min(0),
  bottle_price: z.number().int().min(0),
  area: z.enum(areaValues),
  address: z.string().trim().min(1),
  customerSince: z.date(),
  isActive: z.boolean(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

type CustomerFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  defaultValues: CustomerFormValues;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  deleteLabel?: string;
};

function toPositiveNumber(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.max(0, Math.trunc(parsed));
}

function toInteger(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.trunc(parsed);
}

function formatPakistanPhone(value: string): string {
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

export function toCustomerMutationInput(values: CustomerFormValues): CustomerMutationInput {
  return {
    customer_id: values.customer_id.trim(),
    name: values.name.trim(),
    phone: values.phone.trim(),
    balance: values.balance,
    bottles: values.bottles,
    deposit: values.deposit,
    deposit_price: values.deposit_price,
    bottle_price: values.bottle_price,
    area: values.area,
    address: values.address.trim(),
    customerSince: values.customerSince,
    isActive: values.isActive,
  };
}

export const CustomerForm = ({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  defaultValues,
  onSubmit,
  onDelete,
  deleteLabel,
}: CustomerFormProps) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: customerFormSchema,
    },
    onSubmitInvalid: () => {
      toast.error("Please review the customer form fields.");
    },
    onSubmit: async ({ value }) => {
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
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

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
              name="name"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
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
              name="customer_id"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Customer ID</FieldLabel>
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
              name="phone"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      aria-invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(formatPakistanPhone(event.target.value));
                      }}
                      placeholder="+92 333 6669999"
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="customerSince"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="customer-since-date">
                      Customer Since
                    </FieldLabel>
                    <Popover>
                      <PopoverTrigger
                        className="shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]"
                        render={
                          <Button
                            id="customer-since-date"
                            type="button"
                            variant="outline"
                            className="w-full justify-start font-normal"
                          >
                            {format(field.state.value, "PPP")}
                          </Button>
                        }
                      />
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.state.value}
                          onSelect={(date) => {
                            if (date) {
                              field.handleChange(date);
                            }
                          }}
                          defaultMonth={field.state.value}
                          disabled={(date) => date > new Date()}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="area"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Area</FieldLabel>
                    <div className="rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
                      <Combobox
                        value={field.state.value}
                        items={areas_list}
                        onValueChange={(nextValue) => {
                          field.handleChange(nextValue ?? areas_list[0]);
                        }}
                      >
                        <ComboboxInput
                          className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-[0_2px_5px_rgba(0,0,0,0.16)]"
                          placeholder="Select an area"
                        ></ComboboxInput>
                        <ComboboxContent>
                          <ComboboxEmpty>No area found.</ComboboxEmpty>
                          <ComboboxList>
                            <ComboboxCollection>
                              {(areaOption, areaIndex) => (
                                <ComboboxItem key={`${areaOption}-${areaIndex}`} value={areaOption}>
                                  {areaOption}
                                </ComboboxItem>
                              )}
                            </ComboboxCollection>
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </div>
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="address"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Address</FieldLabel>
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
              name="balance"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Balance</FieldLabel>
                    <Input
                      id={field.name}
                      type="number"
                      value={field.state.value}
                      aria-invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(toInteger(event.target.value));
                      }}
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="bottles"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Empty (bottles)</FieldLabel>
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
              name="deposit"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Deposit</FieldLabel>
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
              name="deposit_price"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Deposit Price</FieldLabel>
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
              name="bottle_price"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Bottle Price</FieldLabel>
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
              name="isActive"
              children={(field) => (
                <Field orientation="horizontal">
                  <Switch
                    id="customer-active-switch"
                    checked={field.state.value}
                    onCheckedChange={(checked) => {
                      field.handleChange(Boolean(checked));
                    }}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="customer-active-switch">Active customer</FieldLabel>
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>

          <form.Subscribe
            selector={(state) => ({
              isSubmitting: state.isSubmitting,
            })}
            children={({ isSubmitting }) => (
              <Button type="submit" className="shadow-sm" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="size-4" /> : null}
                {isSubmitting ? "Saving..." : submitLabel}
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
              disabled={isDeleting}
              onClick={() => {
                void handleDelete();
              }}
            >
              {isDeleting ? <Spinner className="size-4" /> : null}
              {isDeleting ? "Deleting..." : (deleteLabel ?? "Delete Customer")}
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};