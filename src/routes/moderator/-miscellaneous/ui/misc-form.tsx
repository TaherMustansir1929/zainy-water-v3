"use client";

import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { z } from "zod";
import { toast } from "sonner";

import { addMiscDelivery } from "../server/addMiscDelivery.function";
import { IncrementInput } from "@/components/web/increment-input";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useModeratorSession } from "@/hooks/use-moderator-session";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";

const miscFormSchema = z.object({
	isPaid: z.boolean(),
	customer_name: z.string().trim().min(1, "Customer name is required.").max(255),
	description: z.string().trim().min(1, "Description is required.").max(1000),
	filled_bottles: z.number().int().min(0),
	empty_bottles: z.number().int().min(0),
	damaged_bottles: z.number().int().min(0),
	payment: z.number().int().min(0),
});

type MiscFormProps = {
	onAdded?: () => void;
};

function toPositiveNumber(value: string): number {
	const parsed = Number(value);
	if (Number.isNaN(parsed) || parsed < 0) {
		return 0;
	}

	return parsed;
}

export const MiscForm = ({ onAdded }: MiscFormProps) => {
	const { isAuthenticated, sessionToken } = useModeratorSession();
	const dob = useDOBStore((state) => state.dob);

	const form = useForm({
		defaultValues: {
			isPaid: false,
			customer_name: "",
			description: "",
			filled_bottles: 0,
			empty_bottles: 0,
			damaged_bottles: 0,
			payment: 0,
		},
		validators: {
			onSubmit: miscFormSchema,
		},
		onSubmitInvalid: () => {
			toast.error("Please review the miscellaneous delivery fields.");
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

      try {
        await toast.promise(
          addMiscDelivery({
            data: {
              sessionToken,
              customer_name: value.customer_name.trim(),
              description: value.description.trim(),
              filled_bottles: value.filled_bottles,
              empty_bottles: value.empty_bottles,
              damaged_bottles: value.damaged_bottles,
              isPaid: value.isPaid,
              payment: value.isPaid ? value.payment : 0,
              delivery_date: dob,
            },
          }).then((mutationResult) => {
            if (!mutationResult.success) {
              throw new Error(mutationResult.error);
            }

            return mutationResult;
          }),
          {
            loading: "Saving miscellaneous delivery...",
            success: (mutationResult) =>
              mutationResult.message ??
              "Miscellaneous delivery added successfully.",
            error: (error) =>
              error instanceof Error
                ? error.message
                : "Failed to add miscellaneous delivery.",
          },
        );

        form.reset();
        onAdded?.();
      } catch (error) {
        console.error("Failed to add miscellaneous delivery", error);
      }
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
        {`Adding miscellaneous delivery for ${format(dob ?? new Date(), "dd MMM yyyy")}`}
      </div>

      <form.Field
        name="isPaid"
        children={(field) => (
          <Field>
            <div className="flex items-center justify-between gap-3 rounded-2xl border bg-background p-3 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
                <FieldLabel htmlFor="misc-paid-switch">
                  {field.state.value ? "Paid delivery" : "FOC delivery"}
                </FieldLabel>
              <Switch
                id="misc-paid-switch"
                checked={field.state.value}
                onCheckedChange={(checked) => {
                  field.handleChange(Boolean(checked));
                  if (!checked) {
                    form.setFieldValue("payment", 0);
                  }
                }}
              />
            </div>
          </Field>
        )}
      />

      <FieldGroup className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <form.Field
          name="customer_name"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Customer Name</FieldLabel>
                <div className="rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
                  <Input
                    id={field.name}
                    value={field.state.value}
                    aria-invalid={isInvalid}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    placeholder="Enter customer name"
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

        <form.Subscribe
          selector={(state) => state.values.isPaid}
          children={(isPaid) =>
            isPaid ? (
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
                          type="number"
                          min={0}
                          value={field.state.value}
                          aria-invalid={isInvalid}
                          onBlur={field.handleBlur}
                          onChange={(event) => {
                            field.handleChange(
                              toPositiveNumber(event.target.value)
                            );
                          }}
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
            ) : null
          }
        />
      </FieldGroup>

      <form.Field
        name="description"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
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
                  placeholder="Enter delivery description"
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

      <Button
        type="submit"
        disabled={form.state.isSubmitting || !isAuthenticated || !sessionToken}
        className="shadow-sm"
      >
        {form.state.isSubmitting ? <Spinner className="size-4" /> : null}
        {form.state.isSubmitting
          ? "Saving Miscellaneous Delivery..."
          : "Add Miscellaneous Delivery"}
      </Button>
    </form>
  );
};
