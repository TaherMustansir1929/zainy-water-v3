"use client";

import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PlusSignCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { createCustomer } from "./-server/createCustomer.function";
import { deleteCustomer } from "./-server/deleteCustomer.function";
import { getAllCustomers } from "./-server/getAllCustomers.function";
import { updateCustomer } from "./-server/updateCustomer.function";
import { CustomerForm, toCustomerMutationInput } from "./-ui/customer-form";
import { CustomerTable } from "./-ui/customer-table";
import type { CustomerRecord } from "./-server/getAllCustomers.function";
import type { CustomerFormValues } from "./-ui/customer-form";
import { areas_list } from "@/db/areas";
import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "@/components/ui/button";

async function loadCustomers(): Promise<Array<CustomerRecord>> {
  return await getAllCustomers();
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

  return <span className="tabular-nums font-heading text-2xl sm:text-3xl text-emerald-500">{display}</span>;
}

export const Route = createFileRoute("/admin/customers/")({
  loader: () => {
    return {
      customers: loadCustomers(),
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { customers: customersPromise } = Route.useLoaderData();
  const initialCustomers = React.use(customersPromise);

  const [customers, setCustomers] = React.useState<Array<CustomerRecord>>(initialCustomers);
  const [isLoading, setIsLoading] = React.useState(false);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerRecord | null>(null);

  const [DeleteConfirmDialog, confirmDelete] = useConfirm(
    "Delete customer?",
    "This action is permanent and cannot be undone.",
    true,
  );

  const refreshCustomers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const updated = await loadCustomers();
      setCustomers(updated);
    } catch (error) {
      console.error("Failed to refresh customers", error);
      toast.error("Failed to refresh customer records.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateCustomer = React.useCallback(
    async (values: CustomerFormValues) => {
      const payload = toCustomerMutationInput(values);

      const mutationPromise = createCustomer({
        data: {
          data: payload,
        },
      });

      void toast.promise(mutationPromise, {
        loading: "Creating customer...",
        success: "Customer created successfully.",
        error: (error) => (error instanceof Error ? error.message : "Failed to create customer."),
      });

      await mutationPromise;
      setIsCreateOpen(false);
      await refreshCustomers();
    },
    [refreshCustomers],
  );

  const handleEditCustomer = React.useCallback(
    async (values: CustomerFormValues) => {
      if (!selectedCustomer) {
        return;
      }

      const payload = toCustomerMutationInput(values);

      const mutationPromise = updateCustomer({
        data: {
          id: selectedCustomer.id,
          data: payload,
        },
      });

      void toast.promise(mutationPromise, {
        loading: "Updating customer...",
        success: "Customer updated successfully.",
        error: (error) => (error instanceof Error ? error.message : "Failed to update customer."),
      });

      await mutationPromise;
      setIsEditOpen(false);
      setSelectedCustomer(null);
      await refreshCustomers();
    },
    [refreshCustomers, selectedCustomer],
  );

  const handleDeleteCustomer = React.useCallback(async () => {
    if (!selectedCustomer) {
      return;
    }

    const confirmed = (await confirmDelete()) as boolean;
    if (!confirmed) {
      return;
    }

    const mutationPromise = deleteCustomer({
      data: {
        id: selectedCustomer.id,
      },
    });

    void toast.promise(mutationPromise, {
      loading: "Deleting customer...",
      success: "Customer deleted successfully.",
      error: (error) => (error instanceof Error ? error.message : "Failed to delete customer."),
    });

    await mutationPromise;
    setIsEditOpen(false);
    setSelectedCustomer(null);
    await refreshCustomers();
  }, [confirmDelete, refreshCustomers, selectedCustomer]);

  const activeCustomers = React.useMemo(
    () => customers.filter((customer) => customer.isActive),
    [customers],
  );

  const inactiveCustomers = React.useMemo(
    () => customers.filter((customer) => !customer.isActive),
    [customers],
  );

  const summary = React.useMemo(
    () => ({
      activeCustomerCount: activeCustomers.length,
      depositBottles: activeCustomers.reduce((sum, customer) => sum + customer.deposit, 0),
    }),
    [activeCustomers],
  );

  const createDefaults = React.useMemo<CustomerFormValues>(
    () => ({
      customer_id: "",
      name: "",
      address: "",
      area: areas_list[0],
      phone: "+92",
      bottle_price: 0,
      bottles: 0,
      deposit: 0,
      deposit_price: 1000,
      balance: 0,
      isActive: true,
      customerSince: new Date(),
    }),
    [],
  );

  const editDefaults = React.useMemo<CustomerFormValues>(
    () => ({
      customer_id: selectedCustomer?.customer_id ?? "",
      name: selectedCustomer?.name ?? "",
      address: selectedCustomer?.address ?? "",
      area: selectedCustomer?.area ?? areas_list[0],
      phone: selectedCustomer?.phone ?? "+92",
      bottle_price: selectedCustomer?.bottle_price ?? 0,
      bottles: selectedCustomer?.bottles ?? 0,
      deposit: selectedCustomer?.deposit ?? 0,
      deposit_price: selectedCustomer?.deposit_price ?? 1000,
      balance: selectedCustomer?.balance ?? 0,
      isActive: selectedCustomer?.isActive ?? true,
      customerSince: selectedCustomer?.customerSince ?? new Date(),
    }),
    [selectedCustomer],
  );

  return (
    <main className="flex w-full flex-col items-center gap-4 overflow-x-hidden p-4">
      <DeleteConfirmDialog />

      <section className="w-full max-w-7xl px-4 py-6">
        <h1 className="text-xl leading-tight font-medium text-balance sm:text-2xl">
          You have a total of{" "}
          <ScrambleNumber value={summary.activeCustomerCount} /> active
          customers with <ScrambleNumber value={summary.depositBottles} />{" "}
          deposit bottles.
        </h1>
      </section>

      <CustomerTable
        title="Active Customers"
        description="Manage active customer records and update their details."
        data={activeCustomers}
        isLoading={isLoading}
        headerAction={
          <Button
            type="button"
            className="shadow-sm"
            onClick={() => {
              setIsCreateOpen(true);
            }}
          >
            <HugeiconsIcon
              icon={PlusSignCircleIcon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Add Customer
          </Button>
        }
        onEdit={(customer) => {
          setSelectedCustomer(customer);
          setIsEditOpen(true);
        }}
      />

      <CustomerTable
        title="Inactive Customers"
        description="Previously deactivated customers that can still be reviewed and edited."
        data={inactiveCustomers}
        isLoading={isLoading}
        onEdit={(customer) => {
          setSelectedCustomer(customer);
          setIsEditOpen(true);
        }}
      />

      <CustomerForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Add Customer"
        description="Create a customer profile and set account details."
        submitLabel="Create Customer"
        defaultValues={createDefaults}
        onSubmit={handleCreateCustomer}
      />

      <CustomerForm
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedCustomer(null);
          }
        }}
        title="Edit Customer"
        description="Update customer details, pricing, and account status."
        submitLabel="Update Customer"
        defaultValues={editDefaults}
        onSubmit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        deleteLabel="Delete Customer"
      />
    </main>
  );
}
