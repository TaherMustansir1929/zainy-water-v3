"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import {
  ChartBreakoutCircleIcon,
  ClockAddIcon,
  Delete02Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { deleteBottleUsage } from "./-server/deleteBottleUsage.function";
import { InventoryUsageForm } from "./-ui/inventory-usage-form";
import { getBottleUsageRecords } from "./-server/getBottleUsageRecords.function";
import { getTotalBottles } from "./-server/getTotalBottles.function";
import { updateTotalBottles } from "./-server/updateTotalBottles.function";
import { InventoryTable } from "./-ui/inventory-table";
import { updateBottleUsage } from "./-server/updateBottleUsage.function";
import type { InventoryBottleUsageRecord } from "./-server/getBottleUsageRecords.function";
import type {
  TotalBottlesDataInput,
  TotalBottlesRecord,
} from "./-server/inventory.schemas";
import type { InventoryUsageFormValues } from "./-ui/inventory-usage-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useConfirm } from "@/hooks/use-confirm";

type TotalBottleFieldKey =
  | "total_bottles"
  | "available_bottles"
  | "used_bottles"
  | "damaged_bottles";

type InventoryCardConfig = {
  id: TotalBottleFieldKey;
  title: string;
  footer: string;
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"];
};

const cardConfig: Array<InventoryCardConfig> = [
  {
    id: "total_bottles",
    title: "Total Bottles",
    footer: "Total bottles owned",
    icon: Wallet01Icon,
  },
  {
    id: "available_bottles",
    title: "Available Bottles",
    footer: "Bottles at main plant",
    icon: ChartBreakoutCircleIcon,
  },
  {
    id: "used_bottles",
    title: "Used Bottles",
    footer: "Bottles in circulation",
    icon: ClockAddIcon,
  },
  {
    id: "damaged_bottles",
    title: "Damaged Bottles",
    footer: "Damaged/Unavailable bottles",
    icon: Delete02Icon,
  },
];

async function loadTotalBottles(): Promise<TotalBottlesRecord | null> {
  return await getTotalBottles();
}

async function loadBottleUsageRecords(): Promise<
  Array<InventoryBottleUsageRecord>
> {
  return await getBottleUsageRecords();
}

function ScrambleNumber({ value }: { value: number }) {
  const [display, setDisplay] = React.useState("0");

  React.useEffect(() => {
    let frame = 0;
    const totalFrames = 22;

    const timer = window.setInterval(() => {
      frame += 1;
      const progress = frame / totalFrames;

      if (progress >= 1) {
        setDisplay(String(value));
        window.clearInterval(timer);
        return;
      }

      const maxRange = Math.max(Math.abs(value), 10);
      const variation = 1.2 - progress * 0.7;
      const randomValue = Math.floor(Math.random() * maxRange * variation);
      setDisplay(String(randomValue));
    }, 42);

    return () => {
      window.clearInterval(timer);
    };
  }, [value]);

  return <span className="font-heading text-3xl tabular-nums">{display}</span>;
}

export const Route = createFileRoute("/admin/inventory/")({
  loader: async () => {
    const [totalBottles, usageRecords] = await Promise.all([
      loadTotalBottles(),
      loadBottleUsageRecords(),
    ]);

    return {
      totalBottles,
      usageRecords,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const {
    totalBottles: initialTotalBottles,
    usageRecords: initialUsageRecords,
  } = Route.useLoaderData();

  const [totalBottles, setTotalBottles] =
    React.useState<TotalBottlesRecord | null>(initialTotalBottles);
  const [usageRecords, setUsageRecords] =
    React.useState<Array<InventoryBottleUsageRecord>>(initialUsageRecords);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isUsageEditOpen, setIsUsageEditOpen] = React.useState(false);
  const [selectedUsage, setSelectedUsage] =
    React.useState<InventoryBottleUsageRecord | null>(null);

  const [editingField, setEditingField] =
    React.useState<TotalBottleFieldKey | null>(null);
  const [fieldValue, setFieldValue] = React.useState("0");
  const [isFieldSubmitting, setIsFieldSubmitting] = React.useState(false);

  const [DeleteConfirmDialog, confirmDelete] = useConfirm(
    "Delete bottle usage record?",
    "This action is permanent and cannot be undone.",
    true
  );

  const cards = React.useMemo(() => {
    return cardConfig.map((card) => ({
      ...card,
      value: totalBottles ? totalBottles[card.id] : null,
    }));
  }, [totalBottles]);

  const activeCard = React.useMemo(() => {
    if (!editingField) {
      return null;
    }

    return cards.find((card) => card.id === editingField) ?? null;
  }, [cards, editingField]);

  React.useEffect(() => {
    if (!editingField || !totalBottles) {
      return;
    }

    setFieldValue(String(totalBottles[editingField]));
  }, [editingField, totalBottles]);

  const refreshInventory = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [updatedTotalBottles, updatedUsageRecords] = await Promise.all([
        loadTotalBottles(),
        loadBottleUsageRecords(),
      ]);

      setTotalBottles(updatedTotalBottles);
      setUsageRecords(updatedUsageRecords);
    } catch (error) {
      console.error("Failed to refresh inventory", error);
      toast.error("Failed to refresh inventory records.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUpdateCardField = React.useCallback(async () => {
    if (!editingField) {
      return;
    }

    const parsedValue = Number(fieldValue);
    const nextValue = Number.isNaN(parsedValue)
      ? 0
      : Math.max(0, Math.trunc(parsedValue));

    const payload: TotalBottlesDataInput = {
      [editingField]: nextValue,
    };

    const mutationPromise = updateTotalBottles({ data: payload }).then(
      (result) => {
        if (!result.success) {
          throw new Error(result.message);
        }

        return result;
      }
    );

    setIsFieldSubmitting(true);
    try {
      void toast.promise(mutationPromise, {
        loading: "Updating bottle inventory...",
        success: "Bottle inventory updated successfully.",
        error: (error) =>
          error instanceof Error
            ? error.message
            : "Failed to update bottle inventory.",
      });

      await mutationPromise;
      setEditingField(null);
      await refreshInventory();
    } finally {
      setIsFieldSubmitting(false);
    }
  }, [editingField, fieldValue, refreshInventory]);

  const handleUpdateUsage = React.useCallback(
    async (values: InventoryUsageFormValues) => {
      if (!selectedUsage) {
        return;
      }

      const mutationPromise = updateBottleUsage({
        data: {
          id: selectedUsage.id,
          ...values,
        },
      });

      void toast.promise(mutationPromise, {
        loading: "Updating bottle usage...",
        success: "Bottle usage updated successfully.",
        error: (error) =>
          error instanceof Error
            ? error.message
            : "Failed to update bottle usage.",
      });

      await mutationPromise;
      setIsUsageEditOpen(false);
      setSelectedUsage(null);
      await refreshInventory();
    },
    [refreshInventory, selectedUsage]
  );

  const handleDeleteUsage = React.useCallback(async () => {
    if (!selectedUsage) {
      return;
    }

    const confirmed = (await confirmDelete()) as boolean;
    if (!confirmed) {
      return;
    }

    const mutationPromise = deleteBottleUsage({
      data: {
        id: selectedUsage.id,
      },
    });

    void toast.promise(mutationPromise, {
      loading: "Deleting bottle usage...",
      success: "Bottle usage deleted successfully.",
      error: (error) =>
        error instanceof Error
          ? error.message
          : "Failed to delete bottle usage.",
    });

    await mutationPromise;
    setIsUsageEditOpen(false);
    setSelectedUsage(null);
    await refreshInventory();
  }, [confirmDelete, refreshInventory, selectedUsage]);

  return (
    <main className="flex w-full flex-col items-center gap-4 overflow-x-hidden p-4">
      <DeleteConfirmDialog />
      
      <section className="grid w-full max-w-7xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.id}
            className="relative overflow-hidden border-border/60 bg-white/75 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-white/75 to-transparent" />

            <CardHeader className="relative pb-2">
              <CardDescription className="text-xs">
                {card.footer}
              </CardDescription>
              <CardTitle className="mt-1 text-lg font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <CardAction>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="cursor-pointer shadow-sm"
                  aria-label={`Edit ${card.title}`}
                  onClick={() => {
                    setEditingField(card.id);
                  }}
                >
                  <HugeiconsIcon icon={card.icon} strokeWidth={2} />
                </Button>
              </CardAction>
            </CardHeader>

            <CardContent className="relative pb-2">
              {card.value === null ? (
                <Spinner className="size-6" />
              ) : (
                <ScrambleNumber value={card.value} />
              )}
            </CardContent>

            <CardFooter className="relative pt-0 text-xs">
              <Badge
                variant={"outline"}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <span>Click</span>
                <HugeiconsIcon
                  icon={card.icon}
                  strokeWidth={2}
                  className="size-4"
                />
                <span>to edit value</span>
              </Badge>
            </CardFooter>
          </Card>
        ))}
      </section>

      <InventoryTable
        title="Bottle Usage (Last 30 Days)"
        description="Review moderator-wise bottle usage and edit records as needed."
        data={usageRecords}
        isLoading={isLoading}
        onEdit={(usage) => {
          setSelectedUsage(usage);
          setIsUsageEditOpen(true);
        }}
      />

      <InventoryUsageForm
        open={isUsageEditOpen}
        onOpenChange={(open) => {
          setIsUsageEditOpen(open);
          if (!open) {
            setSelectedUsage(null);
          }
        }}
        usage={selectedUsage}
        onSubmit={handleUpdateUsage}
        onDelete={handleDeleteUsage}
      />

      <Dialog
        open={Boolean(editingField)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingField(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{`Edit ${activeCard?.title ?? "Inventory Field"}`}</DialogTitle>
            <DialogDescription>
              Enter the updated value and save changes.
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void handleUpdateCardField();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="inventory-field-input">Value</FieldLabel>
                <Input
                  id="inventory-field-input"
                  type="number"
                  min={0}
                  value={fieldValue}
                  onChange={(event) => {
                    setFieldValue(event.target.value);
                  }}
                />
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingField(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isFieldSubmitting || !editingField}
              >
                {isFieldSubmitting ? <Spinner className="size-4" /> : null}
                {isFieldSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
