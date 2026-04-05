"use client";

import * as React from "react";
import { toast } from "sonner";

import { returnBottleUsage } from "../server/returnBottleUsage.function";
import type { BottleUsageDayRecord } from "@/types/moderator.types";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useModeratorSession } from "@/hooks/use-moderator-session";

type BottleReturnFormProps = {
  usage: BottleUsageDayRecord | null;
  date: Date | null;
  onReturned?: () => void;
};

function toPositiveNumber(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

export const BottleReturnForm = ({
  usage,
  date,
  onReturned,
}: BottleReturnFormProps) => {
  const { isAuthenticated, sessionToken } = useModeratorSession();

  const [values, setValues] = React.useState({
    empty_bottles: 0,
    remaining_bottles: 0,
    caps: 0,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const availableEmpty = Math.max(
    0,
    (usage?.empty_bottles ?? 0) - (usage?.empty_returned ?? 0),
  );
  const availableRemaining = Math.max(
    0,
    (usage?.remaining_bottles ?? 0) - (usage?.remaining_returned ?? 0),
  );
  const availableCaps = usage?.caps ?? 0;

  const disabled = !usage || usage.done;

  const handleChange = (key: keyof typeof values, nextValue: string) => {
    setValues((current) => ({
      ...current,
      [key]: toPositiveNumber(nextValue),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setFormError(null);

    if (!isAuthenticated || !sessionToken) {
      toast.error("Session not found. Please login again.");
      return;
    }

    if (!date) {
      toast.error("Please select a date first.");
      return;
    }

    if (!usage) {
      setFormError("Create bottle usage first before returning bottles.");
      return;
    }

    if (
      values.empty_bottles === 0 &&
      values.remaining_bottles === 0 &&
      values.caps === 0
    ) {
      setFormError("Enter at least one value to return.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await returnBottleUsage({
        data: {
          sessionToken,
          date,
          empty_bottles: values.empty_bottles,
          remaining_bottles: values.remaining_bottles,
          caps: values.caps,
        },
      });

      if (!result.success) {
        setFormError(result.error);
        toast.error(result.error);
        return;
      }

      setValues({ empty_bottles: 0, remaining_bottles: 0, caps: 0 });
      toast.success(result.message ?? "Bottle return saved.");
      onReturned?.();
    } catch (error) {
      console.error("Failed to return bottles", error);
      const message = "Failed to return bottles.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <FieldGroup className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="return-empty-bottles">Empty Bottles Return</FieldLabel>
          <div className="rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
            <Input
              id="return-empty-bottles"
              type="number"
              min={0}
              className="rounded-xl border border-border/70 bg-background shadow-[0_2px_5px_rgba(0,0,0,0.16)]"
              value={values.empty_bottles}
              onChange={(event) => {
                handleChange("empty_bottles", event.target.value);
              }}
              disabled={disabled || isSubmitting}
            />
          </div>
          <FieldDescription>{`Available for return: ${availableEmpty}`}</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="return-remaining-bottles">
            Remaining Bottles Return
          </FieldLabel>
          <div className="rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
            <Input
              id="return-remaining-bottles"
              type="number"
              min={0}
              className="rounded-xl border border-border/70 bg-background shadow-[0_2px_5px_rgba(0,0,0,0.16)]"
              value={values.remaining_bottles}
              onChange={(event) => {
                handleChange("remaining_bottles", event.target.value);
              }}
              disabled={disabled || isSubmitting}
            />
          </div>
          <FieldDescription>{`Available for return: ${availableRemaining}`}</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="return-caps">Caps Return</FieldLabel>
          <div className="rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]">
            <Input
              id="return-caps"
              type="number"
              min={0}
              className="rounded-xl border border-border/70 bg-background shadow-[0_2px_5px_rgba(0,0,0,0.16)]"
              value={values.caps}
              onChange={(event) => {
                handleChange("caps", event.target.value);
              }}
              disabled={disabled || isSubmitting}
            />
          </div>
          <FieldDescription>{`Available caps: ${availableCaps}`}</FieldDescription>
        </Field>
      </FieldGroup>

      {formError ? <FieldError errors={[{ message: formError }]} /> : null}

      <Button type="submit" disabled={disabled || isSubmitting} className="shadow-sm">
        {isSubmitting ? <Spinner className="size-4" /> : null}
        {isSubmitting ? "Saving Return..." : "Save Return"}
      </Button>
    </form>
  );
};