"use client";

import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { deleteDailyDelivery } from "./-server/deleteDailyDelivery.function";
import { deleteMiscDelivery } from "./-server/deleteMiscDelivery.function";
import { getDailyDeliveries } from "./-server/getDailyDeliveries.function";
import { getMiscDeliveries } from "./-server/getMiscDeliveries.function";
import { updateDailyDelivery } from "./-server/updateDailyDelivery.function";
import { updateMiscDelivery } from "./-server/updateMiscDelivery.function";
import { DailyDeliveryForm } from "./-ui/daily-delivery-form";
import { DailyDeliveryTable } from "./-ui/daily-delivery-table";
import { MiscDeliveryForm } from "./-ui/misc-delivery-form";
import { MiscDeliveryTable } from "./-ui/misc-delivery-table";
import type { DailyDeliveryRecord } from "./-server/getDailyDeliveries.function";
import type { MiscDeliveryRecord } from "./-server/getMiscDeliveries.function";
import type { DailyDeliveryFormValues } from "./-ui/daily-delivery-form";
import type { MiscDeliveryFormValues } from "./-ui/misc-delivery-form";
import { useConfirm } from "@/hooks/use-confirm";

const LAST_30_DAYS_TIMEZONE = "UTC";
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

async function loadDailyDeliveries(): Promise<Array<DailyDeliveryRecord>> {
  return await getDailyDeliveries();
}

async function loadMiscDeliveries(): Promise<Array<MiscDeliveryRecord>> {
  return await getMiscDeliveries();
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

  return (
    <span className="tabular-nums font-heading text-2xl text-emerald-500 sm:text-3xl">
      {display}
    </span>
  );
}

function getUtcDayBoundary(date: Date, boundary: "start" | "end"): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      boundary === "start" ? 0 : 23,
      boundary === "start" ? 0 : 59,
      boundary === "start" ? 0 : 59,
      boundary === "start" ? 0 : 999,
    ),
  );
}

function getLast30DaysUtcWindow(now: Date): { rangeStart: Date; rangeEnd: Date } {
  const rangeEnd = getUtcDayBoundary(now, "end");
  const todayUtcStart = getUtcDayBoundary(now, "start");
  const rangeStart = new Date(todayUtcStart.getTime() - 29 * ONE_DAY_IN_MS);

  return {
    rangeStart,
    rangeEnd,
  };
}

function formatCountLabel(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function countDeliveriesForLast30Days<T extends { deliveryDate: Date }>(
  deliveries: Array<T>,
): number {
  const { rangeStart, rangeEnd } = getLast30DaysUtcWindow(new Date());

  return deliveries.filter((delivery) => {
    return (
      delivery.deliveryDate >= rangeStart &&
      delivery.deliveryDate <= rangeEnd
    );
  }).length;
}

export const Route = createFileRoute("/admin/deliveries/")({
  loader: async () => {
    const [dailyDeliveries, miscDeliveries] = await Promise.all([
      loadDailyDeliveries(),
      loadMiscDeliveries(),
    ]);

    return {
      dailyDeliveries,
      miscDeliveries,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const {
    dailyDeliveries: initialDailyDeliveries,
    miscDeliveries: initialMiscDeliveries,
  } = Route.useLoaderData();

  const [dailyDeliveries, setDailyDeliveries] = React.useState<Array<DailyDeliveryRecord>>(
    initialDailyDeliveries,
  );
  const [miscDeliveries, setMiscDeliveries] = React.useState<Array<MiscDeliveryRecord>>(
    initialMiscDeliveries,
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const [isDailyEditOpen, setIsDailyEditOpen] = React.useState(false);
  const [isMiscEditOpen, setIsMiscEditOpen] = React.useState(false);
  const [selectedDailyDelivery, setSelectedDailyDelivery] = React.useState<DailyDeliveryRecord | null>(null);
  const [selectedMiscDelivery, setSelectedMiscDelivery] = React.useState<MiscDeliveryRecord | null>(null);

  const dailyDeliveriesLast30Days = React.useMemo(() => {
    return countDeliveriesForLast30Days(dailyDeliveries);
  }, [dailyDeliveries]);

  const miscDeliveriesLast30Days = React.useMemo(() => {
    return countDeliveriesForLast30Days(miscDeliveries);
  }, [miscDeliveries]);

  const dailyHeading = React.useMemo(() => {
    return formatCountLabel(dailyDeliveriesLast30Days, "delivery", "deliveries");
  }, [dailyDeliveriesLast30Days]);

  const miscHeading = React.useMemo(() => {
    return formatCountLabel(
      miscDeliveriesLast30Days,
      "miscellaneous delivery",
      "miscellaneous deliveries",
    );
  }, [miscDeliveriesLast30Days]);

  const [DeleteDailyConfirmDialog, confirmDeleteDaily] = useConfirm(
    "Delete daily delivery?",
    "This action is permanent and cannot be undone.",
    true,
  );
  const [DeleteMiscConfirmDialog, confirmDeleteMisc] = useConfirm(
    "Delete miscellaneous delivery?",
    "This action is permanent and cannot be undone.",
    true,
  );

  const refreshDeliveries = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [updatedDaily, updatedMisc] = await Promise.all([
        loadDailyDeliveries(),
        loadMiscDeliveries(),
      ]);

      setDailyDeliveries(updatedDaily);
      setMiscDeliveries(updatedMisc);
    } catch (error) {
      console.error("Failed to refresh deliveries", error);
      toast.error("Failed to refresh delivery records.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUpdateDailyDelivery = React.useCallback(
    async (values: DailyDeliveryFormValues) => {
      if (!selectedDailyDelivery) {
        return;
      }

      const mutationPromise = updateDailyDelivery({
        data: {
          deliveryId: selectedDailyDelivery.id,
          data: values,
        },
      });

      void toast.promise(mutationPromise, {
        loading: "Updating daily delivery...",
        success: "Daily delivery updated successfully.",
        error: (error) =>
          error instanceof Error
            ? error.message
            : "Failed to update daily delivery.",
      });

      await mutationPromise;
      setIsDailyEditOpen(false);
      setSelectedDailyDelivery(null);
      await refreshDeliveries();
    },
    [refreshDeliveries, selectedDailyDelivery],
  );

  const handleUpdateMiscDelivery = React.useCallback(
    async (values: MiscDeliveryFormValues) => {
      if (!selectedMiscDelivery) {
        return;
      }

      const mutationPromise = updateMiscDelivery({
        data: {
          deliveryId: selectedMiscDelivery.id,
          data: values,
        },
      });

      void toast.promise(mutationPromise, {
        loading: "Updating miscellaneous delivery...",
        success: "Miscellaneous delivery updated successfully.",
        error: (error) =>
          error instanceof Error
            ? error.message
            : "Failed to update miscellaneous delivery.",
      });

      await mutationPromise;
      setIsMiscEditOpen(false);
      setSelectedMiscDelivery(null);
      await refreshDeliveries();
    },
    [refreshDeliveries, selectedMiscDelivery],
  );

  const handleDeleteDailyDelivery = React.useCallback(async () => {
    if (!selectedDailyDelivery) {
      return;
    }

    const confirmed = (await confirmDeleteDaily()) as boolean;
    if (!confirmed) {
      return;
    }

    const mutationPromise = deleteDailyDelivery({
      data: {
        deliveryId: selectedDailyDelivery.id,
      },
    });

    void toast.promise(mutationPromise, {
      loading: "Deleting daily delivery...",
      success: "Daily delivery deleted successfully.",
      error: (error) =>
        error instanceof Error
          ? error.message
          : "Failed to delete daily delivery.",
    });

    await mutationPromise;
    setIsDailyEditOpen(false);
    setSelectedDailyDelivery(null);
    await refreshDeliveries();
  }, [confirmDeleteDaily, refreshDeliveries, selectedDailyDelivery]);

  const handleDeleteMiscDelivery = React.useCallback(async () => {
    if (!selectedMiscDelivery) {
      return;
    }

    const confirmed = (await confirmDeleteMisc()) as boolean;
    if (!confirmed) {
      return;
    }

    const mutationPromise = deleteMiscDelivery({
      data: {
        deliveryId: selectedMiscDelivery.id,
      },
    });

    void toast.promise(mutationPromise, {
      loading: "Deleting miscellaneous delivery...",
      success: "Miscellaneous delivery deleted successfully.",
      error: (error) =>
        error instanceof Error
          ? error.message
          : "Failed to delete miscellaneous delivery.",
    });

    await mutationPromise;
    setIsMiscEditOpen(false);
    setSelectedMiscDelivery(null);
    await refreshDeliveries();
  }, [confirmDeleteMisc, refreshDeliveries, selectedMiscDelivery]);

  return (
    <main className="flex w-full flex-col items-center gap-4 overflow-x-hidden p-4">
      <DeleteDailyConfirmDialog />
      <DeleteMiscConfirmDialog />

      <section className="w-full max-w-7xl px-4 py-6">
        <h1 className="text-balance text-xl leading-tight font-medium sm:text-2xl">
          You have <ScrambleNumber value={dailyDeliveriesLast30Days} /> {dailyHeading} in
          the last 30 days ({LAST_30_DAYS_TIMEZONE}).
        </h1>
      </section>

      <DailyDeliveryTable
        title="Daily Deliveries"
        description="Review and edit daily delivery entries."
        data={dailyDeliveries}
        isLoading={isLoading}
        onEdit={(delivery) => {
          setSelectedDailyDelivery(delivery);
          setIsDailyEditOpen(true);
        }}
      />

      <section className="w-full max-w-7xl px-4 py-2">
        <h2 className="text-balance text-lg leading-tight font-medium sm:text-xl">
          You have <ScrambleNumber value={miscDeliveriesLast30Days} /> {miscHeading} in
          the last 30 days ({LAST_30_DAYS_TIMEZONE}).
        </h2>
      </section>

      <MiscDeliveryTable
        title="Miscellaneous Deliveries"
        description="Review and edit miscellaneous delivery entries."
        data={miscDeliveries}
        isLoading={isLoading}
        onEdit={(delivery) => {
          setSelectedMiscDelivery(delivery);
          setIsMiscEditOpen(true);
        }}
      />

      <DailyDeliveryForm
        open={isDailyEditOpen}
        onOpenChange={(open) => {
          setIsDailyEditOpen(open);
          if (!open) {
            setSelectedDailyDelivery(null);
          }
        }}
        delivery={selectedDailyDelivery}
        onSubmit={handleUpdateDailyDelivery}
        onDelete={handleDeleteDailyDelivery}
      />

      <MiscDeliveryForm
        open={isMiscEditOpen}
        onOpenChange={(open) => {
          setIsMiscEditOpen(open);
          if (!open) {
            setSelectedMiscDelivery(null);
          }
        }}
        delivery={selectedMiscDelivery}
        onSubmit={handleUpdateMiscDelivery}
        onDelete={handleDeleteMiscDelivery}
      />
    </main>
  );
}
