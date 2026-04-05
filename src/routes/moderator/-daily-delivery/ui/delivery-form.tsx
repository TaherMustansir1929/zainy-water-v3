"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { addDailyDelivery } from "../server/add-daily-delivery.function";
import { getCustomersByArea } from "../server/get-daily-delivery.function";
import type { CustomerDelivery, ModeratorArea } from "@/types/moderator.types";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { IncrementInput } from "@/components/web/increment-input";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useModeratorSession } from "@/hooks/use-moderator-session";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";
import {
  calculateBalanceSummary,
  deliveryFormSchema,
  getDeliveryBusinessRuleErrors,
} from "@/types/moderator.types";
import { Separator } from "@/components/ui/separator";

type DeliveryFormProps = {
  onAdded?: () => void;
};

function toPositiveNumber(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function formatAmount(value: number): string {
  return `${value.toLocaleString()} /-`;
}

export const DeliveryForm = ({ onAdded }: DeliveryFormProps) => {
  const { moderator, sessionToken, isAuthenticated } = useModeratorSession();
  const dob = useDOBStore((state) => state.dob);

  const [selectedArea, setSelectedArea] = React.useState<ModeratorArea | "">("");
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerDelivery | null>(
    null,
  );
  const [customers, setCustomers] = React.useState<Array<CustomerDelivery>>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = React.useState(false);

  const form = useForm({
    defaultValues: {
      customer_id: "",
      filled_bottles: 0,
      empty_bottles: 0,
      deposit_bottles_given: 0,
      deposit_bottles_taken: 0,
      foc: 0,
      damaged_bottles: 0,
      payment: 0,
    },
    validators: {
      onSubmit: deliveryFormSchema,
    },
    onSubmitInvalid: () => {
      toast.error("Please review the form fields.");
    },
    onSubmit: async ({ value }) => {
      if (!isAuthenticated || !moderator || !sessionToken) {
        toast.error("Moderator session not found. Please login again.");
        return;
      }

      if (!selectedCustomer) {
        toast.error("Please select a customer before submitting.");
        return;
      }

      if (!dob) {
        toast.error("Please select a date of bottle usage first.");
        return;
      }

      const businessRuleErrors = getDeliveryBusinessRuleErrors({
        customer: selectedCustomer,
        values: {
          filled_bottles: value.filled_bottles,
          empty_bottles: value.empty_bottles,
          deposit_bottles_taken: value.deposit_bottles_taken,
        },
      });

      if (businessRuleErrors.length > 0) {
        toast.error(businessRuleErrors[0]?.message ?? "Invalid delivery values.");
        return;
      }

      const result = await addDailyDelivery({
        data: {
          sessionToken,
          delivery_date: dob,
          customer_id: selectedCustomer.customer_id,
          filled_bottles: value.filled_bottles,
          empty_bottles: value.empty_bottles,
          deposit_bottles_given: value.deposit_bottles_given,
          deposit_bottles_taken: value.deposit_bottles_taken,
          foc: value.foc,
          damaged_bottles: value.damaged_bottles,
          payment: value.payment,
        },
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message ?? "Delivery record added successfully.");
      form.reset();
      form.setFieldValue("customer_id", "");
      setSelectedCustomer(null);
      onAdded?.();
    },
  });

  React.useEffect(() => {
    if (!selectedArea || !sessionToken) {
      setCustomers([]);
      setSelectedCustomer(null);
      form.setFieldValue("customer_id", "");
      return;
    }

    let isMounted = true;
    setIsLoadingCustomers(true);

    void getCustomersByArea({ data: { sessionToken, area: selectedArea } })
      .then((fetchedCustomers) => {
        if (!isMounted) {
          return;
        }

        setCustomers(fetchedCustomers);
        if (
          selectedCustomer &&
          !fetchedCustomers.some(
            (customer) => customer.customer_id === selectedCustomer.customer_id,
          )
        ) {
          setSelectedCustomer(null);
          form.setFieldValue("customer_id", "");
        }
      })
      .catch((error) => {
        console.error("Error fetching customers by area", error);
        if (isMounted) {
          setCustomers([]);
          toast.error("Failed to fetch customers for the selected area.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCustomers(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [form, selectedArea, selectedCustomer, sessionToken]);

  const moderatorAreas = React.useMemo(
    () => moderator?.areas ?? [],
    [moderator?.areas],
  );

  return (
    <form
      id="daily-delivery-form"
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel>Area</FieldLabel>
          <div className="rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
            <Combobox
              value={selectedArea || null}
              onValueChange={(nextValue) => {
                const area = nextValue ?? "";
                setSelectedArea(area);
                setSelectedCustomer(null);
                form.setFieldValue("customer_id", "");
              }}
            >
              <ComboboxInput
                className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-[0_2px_5px_rgba(0,0,0,0.16)]"
                placeholder={
                  moderatorAreas.length > 0
                    ? "Select an area"
                    : "No areas assigned to this moderator"
                }
                disabled={moderatorAreas.length === 0}
              ></ComboboxInput>
              <ComboboxContent>
                <ComboboxEmpty>No area found.</ComboboxEmpty>
                <ComboboxList>
                  {moderatorAreas.map((area) => (
                    <ComboboxItem key={area} value={area}>
                      {area}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </Field>

        <Field>
          <FieldLabel>Customer</FieldLabel>
          <div className="rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
            <Combobox
              value={selectedCustomer?.customer_id ?? null}
              onValueChange={(nextValue) => {
                const customer =
                  customers.find((entry) => entry.customer_id === nextValue) ??
                  null;
                setSelectedCustomer(customer);
                form.setFieldValue("customer_id", customer?.customer_id ?? "");
              }}
            >
              <ComboboxInput
                className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-[0_2px_5px_rgba(0,0,0,0.16)]"
                placeholder={
                  selectedArea
                    ? isLoadingCustomers
                      ? "Loading customers..."
                      : "Select a customer"
                    : "Select area first"
                }
                disabled={!selectedArea || isLoadingCustomers}
              ></ComboboxInput>
              <ComboboxContent>
                <ComboboxEmpty>No customer found.</ComboboxEmpty>
                <ComboboxList>
                  {customers.map((customer) => (
                    <ComboboxItem
                      key={customer.customer_id}
                      value={customer.customer_id}
                    >
                      {customer.name} ({customer.customer_id})
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </Field>

        {selectedCustomer ? (
          <section className="rounded-3xl border bg-muted/30 p-4 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
            <h3 className="text-sm font-medium">Customer Verification</h3>
            <div className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Name:</span>{" "}
                {selectedCustomer.name}
              </p>
              <p>
                <span className="text-muted-foreground">Customer ID:</span>{" "}
                {selectedCustomer.customer_id}
              </p>
              <p>
                <span className="text-muted-foreground">Area:</span>{" "}
                {selectedCustomer.area}
              </p>
              <p>
                <span className="text-muted-foreground">Phone:</span>{" "}
                {selectedCustomer.phone}
              </p>
              <p>
                <span className="text-muted-foreground">Bottle Price:</span>{" "}
                {formatAmount(selectedCustomer.bottle_price)}
              </p>
              <p>
                <span className="text-muted-foreground">Current Bottles:</span>{" "}
                {selectedCustomer.bottles}
              </p>
              <p>
                <span className="text-muted-foreground">Deposit Bottles:</span>{" "}
                {selectedCustomer.deposit}
              </p>
              <p>
                <span className="text-muted-foreground">Address:</span>{" "}
                {selectedCustomer.address}
              </p>
            </div>
          </section>
        ) : null}

        <FieldGroup className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <form.Field
            name="filled_bottles"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Filled Bottles</FieldLabel>
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
                  {isInvalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null}
                </Field>
              );
            }}
          />

          <form.Field
            name="empty_bottles"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Empty Bottles</FieldLabel>
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
                  {isInvalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null}
                </Field>
              );
            }}
          />

          <form.Field
            name="deposit_bottles_given"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Deposit Bottles Given
                  </FieldLabel>
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
                  {isInvalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null}
                </Field>
              );
            }}
          />

          <form.Field
            name="deposit_bottles_taken"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Deposit Bottles Taken
                  </FieldLabel>
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
                  {isInvalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null}
                </Field>
              );
            }}
          />

          <form.Field
            name="foc"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>FOC Bottles</FieldLabel>
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
                  {isInvalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null}
                </Field>
              );
            }}
          />

          <form.Field
            name="damaged_bottles"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Damaged Bottles</FieldLabel>
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
                  {isInvalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null}
                </Field>
              );
            }}
          />
        </FieldGroup>

        <form.Field
          name="payment"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Payment</FieldLabel>
                <div className="rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min={0}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(toPositiveNumber(event.target.value))
                    }
                    aria-invalid={isInvalid}
                    className="rounded-xl border border-border/70 bg-background shadow-[0_2px_5px_rgba(0,0,0,0.16)]"
                  />
                </div>
                {isInvalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </Field>
            );
          }}
        />

        <form.Subscribe
          selector={(state) => state.values}
          children={(values) => {
            const balanceSummary = calculateBalanceSummary({
              customer: selectedCustomer,
              filledBottles: values.filled_bottles,
              foc: values.foc,
              payment: values.payment,
            });

            const previousBalanceLabel =
              balanceSummary.previousBalanceFromDatabase === 0
                ? "0/- (Clear)"
                : formatAmount(balanceSummary.previousBalanceFromDatabase);

            return (
              <section className="rounded-3xl border bg-muted/30 p-4 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
                <h3 className="text-sm font-medium">Balance Summary</h3>
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Today's Bill:</span>{" "}
                    {formatAmount(balanceSummary.todaysBill)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Total Remaining Balance:
                    </span>{" "}
                    {formatAmount(balanceSummary.totalRemainingBalance)}
                  </p>
                  <Separator className={"block lg:hidden"} />
                  <p>
                    <span className="text-muted-foreground">
                      Today's Bill (Before FOC):
                    </span>{" "}
                    {formatAmount(balanceSummary.todaysBillBeforeFoc)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Previous Balance:
                    </span>{" "}
                    {previousBalanceLabel}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Remaining Current Balance:
                    </span>{" "}
                    {formatAmount(balanceSummary.remainingCurrentBalance)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Advance Amount:
                    </span>{" "}
                    {formatAmount(balanceSummary.advanceAmount)}
                  </p>
                </div>
              </section>
            );
          }}
        />
      </FieldGroup>

      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
        })}
        children={({ canSubmit, isSubmitting }) => (
          <Field orientation="horizontal">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              className={"shadow-sm"}
              onClick={() => {
                form.reset();
                form.setFieldValue("customer_id", "");
                setSelectedCustomer(null);
              }}
            >
              Reset
            </Button>
            <Button
              type="submit"
              form="daily-delivery-form"
              disabled={!canSubmit || isSubmitting}
              className={"shadow-sm"}
            >
              {isSubmitting ? <Spinner className="size-4" /> : null}
              {isSubmitting ? "Saving..." : "Add Delivery"}
            </Button>
          </Field>
        )}
      />
    </form>
  );
};