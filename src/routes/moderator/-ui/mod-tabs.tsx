import * as React from "react";
import { Calendar01Icon, ChartPie, DiceFaces05Icon, Dollar02Icon, ShoppingCart02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DeliveryForm } from "../-daily-delivery/ui/delivery-form";
import { DeliveryTable } from "../-daily-delivery/ui/delivery-table";
import { BottleUsageForm } from "../-bottle-usage/ui/bottle-usage-form";
import { OtherExpenseForm } from "../-other-expenses/ui/other-expense-form";
import { OtherExpenseTable } from "../-other-expenses/ui/other-expense-table";
import { MiscForm } from "../-miscellaneous/ui/misc-form";
import { MiscTable } from "../-miscellaneous/ui/misc-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mod_tabs = [
  {
    value: "daily_deliveries",
    label: "Deliveries",
    icon: (
      <HugeiconsIcon
      icon={ShoppingCart02Icon}
        className="-ms-0.5 me-1.5 opacity-60"
        size={16}
        aria-hidden="true"
      />
    ),
  },
  {
    value: "bottle_usage",
    label: "Bottle Usage",
    icon: (
      <HugeiconsIcon
        icon={ChartPie}
        className="-ms-0.5 me-1.5 opacity-60"
        size={16}
        aria-hidden="true"
      />
    ),
  },
  {
    value: "expenses",
    label: "Expenses",
    icon: (
      <HugeiconsIcon
        icon={Dollar02Icon}
        className="-ms-0.5 me-1.5 opacity-60"
        size={16}
        aria-hidden="true"
      />
    ),
  },
  {
    value: "miscellaneous",
    label: "Miscellaneous",
    icon: (
      <HugeiconsIcon
        icon={DiceFaces05Icon}
        className="-ms-0.5 me-1.5 opacity-60"
        size={16}
        aria-hidden="true"
      />
    ),
  },
];

export function ModTabs() {
  const [deliveryRefreshKey, setDeliveryRefreshKey] = React.useState(0);
  const [expenseRefreshKey, setExpenseRefreshKey] = React.useState(0);
  const [miscRefreshKey, setMiscRefreshKey] = React.useState(0);

  return (
    <section className="w-full">
      <Tabs defaultValue="daily_deliveries">
        <ScrollArea>
          <TabsList className="mb-3 flex h-auto mx-auto">
            {mod_tabs.map((tab, index) => (
              <TabsTrigger
                key={index}
                value={tab.value}
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <TabsContent value="daily_deliveries">
          <section className="my-4 flex min-h-screen w-full flex-col gap-y-4 p-2 md:items-center md:justify-center">
            <Card className="w-full max-w-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex flex-col items-center justify-center gap-2 text-center text-xl font-bold text-primary">
                  <div className="flex flex-row items-center justify-center gap-2">
                    <HugeiconsIcon icon={Calendar01Icon} />
                    Daily Delivery Entry
                  </div>
                  {/* <DobSelector /> */}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DeliveryForm
                  onAdded={() => {
                    setDeliveryRefreshKey((current) => current + 1);
                  }}
                />
              </CardContent>
            </Card>

            <DeliveryTable refreshKey={deliveryRefreshKey} />
          </section>
        </TabsContent>
        <TabsContent value="expenses">
          <section className="flex w-full flex-col gap-y-6 p-2 md:items-center md:justify-center">
            <Card className="w-full max-w-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex flex-col items-center justify-center gap-2 text-center text-xl font-bold text-primary">
                  <div className="flex flex-row items-center justify-center gap-2">
                    <HugeiconsIcon icon={Dollar02Icon} />
                    Other /Bottle Expenses
                  </div>
                  {/* <DobSelector /> */}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OtherExpenseForm
                  onAdded={() => {
                    setExpenseRefreshKey((current) => current + 1);
                  }}
                />
              </CardContent>
            </Card>

            <OtherExpenseTable refreshKey={expenseRefreshKey} />
          </section>
        </TabsContent>
        <TabsContent value="bottle_usage">
          <section className="my-4 flex min-h-screen w-full flex-col gap-y-4 p-2 md:items-center md:justify-center">
            <Card className="w-full max-w-6xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex flex-col items-center justify-center gap-2 text-center text-xl font-bold text-primary">
                  <div className="flex flex-row items-center justify-center gap-2">
                    <HugeiconsIcon icon={ChartPie} />
                    Bottle Usage
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BottleUsageForm />
              </CardContent>
            </Card>
          </section>
        </TabsContent>
        <TabsContent value="miscellaneous">
          <section className="flex w-full flex-col gap-y-6 p-2 md:items-center md:justify-center">
            <Card className="w-full max-w-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex flex-col items-center justify-center gap-2 text-center text-xl font-bold text-primary">
                  <div className="flex flex-row items-center justify-center gap-2">
                    <HugeiconsIcon icon={DiceFaces05Icon} />
                    Miscellaneous Delivery
                  </div>
                  {/* <DobSelector /> */}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MiscForm
                  onAdded={() => {
                    setMiscRefreshKey((current) => current + 1);
                  }}
                />
              </CardContent>
            </Card>

            <MiscTable refreshKey={miscRefreshKey} />
          </section>
        </TabsContent>
      </Tabs>
    </section>
  );
}
