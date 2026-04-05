"use client";

import { MinusSignIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

type IncrementInputProps = {
  id?: string;
  name?: string;
  value: number;
  isInvalid?: boolean;
  min?: number;
  step?: number;
  disabled?: boolean;
  onBlur?: () => void;
  onChange: (nextValue: number) => void;
};

export function IncrementInput({
  id,
  name,
  value,
  isInvalid = false,
  min = 0,
  step = 1,
  disabled = false,
  onBlur,
  onChange,
}: IncrementInputProps) {
  const safeValue = Number.isFinite(value) ? value : 0;

  const decrement = () => {
    const nextValue = Math.max(min, safeValue - step);
    onChange(nextValue);
    onBlur?.();
  };

  const increment = () => {
    const nextValue = Math.max(min, safeValue + step);
    onChange(nextValue);
    onBlur?.();
  };

  return (
    <div
      className="flex items-center justify-between rounded-2xl border bg-background p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]"
      data-invalid={isInvalid}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Decrease value"
        disabled={disabled || safeValue <= min}
        className="rounded-xl border border-border/70 bg-background shadow-[0_2px_5px_rgba(0,0,0,0.18)] transition-shadow hover:shadow-[0_3px_8px_rgba(0,0,0,0.22)]"
        onClick={decrement}
      >
        <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} data-icon="inline-start" />
      </Button>
      <div
        id={id}
        aria-label={name}
        role="status"
        aria-invalid={isInvalid}
        className="mx-1 min-w-10 rounded-lg border border-border/80 bg-muted/40 px-2 py-1 text-center text-sm font-medium tabular-nums"
      >
        {safeValue}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Increase value"
        disabled={disabled}
        className="rounded-xl border border-border/70 bg-background shadow-[0_2px_5px_rgba(0,0,0,0.18)] transition-shadow hover:shadow-[0_3px_8px_rgba(0,0,0,0.22)]"
        onClick={increment}
      >
        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
      </Button>
    </div>
  );
}