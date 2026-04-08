"use client";

import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen02Icon,
  ChartPie,
  Delete02Icon,
  Dollar,
  Dollar02Icon,
  InboxIcon,
  ShoppingCart01Icon,
  UserIcon,
  UserLock01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardAnalytics } from "../-server/getDashboardAnalytics.function";
import type { ChartConfig } from "@/components/ui/chart";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  data: Promise<DashboardAnalytics>;
};

type MetricFormat = "currency" | "number";

type DashboardCard = {
  id: string;
  title: string;
  value: number;
  href: string;
  description: string;
  footer: string;
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"];
  format: MetricFormat;
  tone?: "revenue" | "expense";
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return value.toLocaleString();
}

function formatMetricValue(value: number, format: MetricFormat) {
  return format === "currency" ? formatCurrency(value) : formatNumber(value);
}

function formatBottles(value: number) {
  return `${formatNumber(value)} bottles`;
}

function ScrambleValue({
  value,
  format,
}: {
  value: number;
  format: MetricFormat;
}) {
  const [display, setDisplay] = React.useState(() =>
    formatMetricValue(0, format)
  );

  React.useEffect(() => {
    let frame = 0;
    const totalFrames = 22;

    const timer = window.setInterval(() => {
      frame += 1;
      const progress = frame / totalFrames;

      if (progress >= 1) {
        setDisplay(formatMetricValue(value, format));
        window.clearInterval(timer);
        return;
      }

      const maxRange = Math.max(Math.abs(value), 10);
      const variation = 1.2 - progress * 0.7;
      const randomValue = Math.floor(Math.random() * maxRange * variation);
      setDisplay(formatMetricValue(randomValue, format));
    }, 42);

    return () => {
      window.clearInterval(timer);
    };
  }, [format, value]);

  return <span className="tabular-nums font-heading text-3xl">{display}</span>;
}

export function DashboardAnalyticsSection({ data }: Props) {
  const analytics = React.use(data);
  const cardContent: Array<DashboardCard> = [
    {
      id: "total_revenue",
      title: "Total Revenue (PKR)",
      value: analytics.totalRevenue,
      href: "/admin/deliveries",
      description: "Revenue for the last 30 days",
      footer: "Account for this month",
      icon: ChartPie,
      format: "currency",
      tone: "revenue",
    },
    {
      id: "expenses",
      title: "Expenses (PKR)",
      value: analytics.expenses,
      href: "/admin/other-expenses",
      description: "Expenses for the last 30 days",
      footer: "Account for this month",
      icon: Dollar02Icon,
      format: "currency",
      tone: "expense",
    },
    {
      id: "customers",
      title: "Active Customers",
      value: analytics.customerCount,
      href: "/admin/customer-information",
      description: "Total customers receiving deliveries",
      footer: "All time record",
      icon: UserIcon,
      format: "number",
    },
    {
      id: "moderators",
      title: "Moderators",
      value: analytics.moderatorCount,
      href: "/admin/add-moderator",
      description: "Total moderators working",
      footer: "All time record",
      icon: UserLock01Icon,
      format: "number",
    },
    {
      id: "total_bottles",
      title: "Total Bottles",
      value: analytics.totalBottles,
      href: "/admin/bottle-inventory",
      description: "Total bottles in inventory",
      footer: "Updated regularly",
      icon: InboxIcon,
      format: "number",
    },
    {
      id: "deposit",
      title: "Deposit Bottles",
      value: analytics.depositCount,
      href: "/admin/customer-information",
      description: "Total bottles given as deposit",
      footer: "All time record",
      icon: BookOpen02Icon,
      format: "number",
    },
    {
      id: "available_bottles",
      title: "Available Bottles",
      value: analytics.availableBottles,
      href: "/admin/bottle-inventory",
      description: "Bottles available in inventory",
      footer: "Updated regularly",
      icon: Dollar,
      format: "number",
    },
    {
      id: "used_bottles",
      title: "Used Bottles",
      value: analytics.usedBottles,
      href: "/admin/deliveries",
      description: "Bottles in circulation",
      footer: "Updated regularly",
      icon: ShoppingCart01Icon,
      format: "number",
    },
    {
      id: "damaged_bottles",
      title: "Damaged Bottles",
      value: analytics.damagedBottles,
      href: "/admin/bottle-inventory",
      description: "Bottles damaged in inventory",
      footer: "Updated regularly",
      icon: Delete02Icon,
      format: "number",
    },
  ];

  const financeComparisonData = [
    {
      period: "Last 30 Days",
      revenue: analytics.totalRevenue,
      expenses: analytics.expenses,
      deposits: analytics.depositCount,
    },
  ];

  const financeComparisonConfig = {
    revenue: {
      label: "Revenue",
      color: "#10b981",
    },
    expenses: {
      label: "Expenses",
      color: "hsl(var(--destructive))",
    },
    deposits: {
      label: "Deposits",
      color: "#0ea5e9",
    },
  } satisfies ChartConfig;

  const bottleDistributionData = [
    {
      status: "available",
      label: "Available",
      value: analytics.availableBottles,
      fill: "var(--color-available)",
    },
    {
      status: "used",
      label: "Used",
      value: analytics.usedBottles,
      fill: "var(--color-used)",
    },
    {
      status: "damaged",
      label: "Damaged",
      value: analytics.damagedBottles,
      fill: "var(--color-damaged)",
    },
  ];

  const bottleDistributionConfig = {
    available: {
      label: "Available",
      color: "#22c55e",
    },
    used: {
      label: "Used",
      color: "#3b82f6",
    },
    damaged: {
      label: "Damaged",
      color: "#ef4444",
    },
  } satisfies ChartConfig;

  return (
    <section className="flex w-full max-w-7xl flex-col gap-4 p-4">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cardContent.map((card) => (
          <Card
            key={card.id}
            className={cn(
              "relative overflow-hidden border-border/60 bg-white/75 ",
              "shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]"
            )}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-white/75 to-transparent" />
            <CardHeader className="relative pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardDescription className="truncate">
                    {card.description}
                  </CardDescription>
                  <CardTitle className="mt-1 text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                </div>
                <Link
                  to={card.href}
                  aria-label={`Open ${card.title}`}
                  className={cn(
                    "inline-flex rounded-xl border bg-background/85 p-2.5 backdrop-blur",
                    "shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:shadow-md",
                    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    card.tone === "revenue" &&
                      "border-emerald-500/40 text-emerald-500",
                    card.tone === "expense" &&
                      "border-destructive/40 text-destructive",
                    !card.tone && "border-border/60 text-foreground"
                  )}
                >
                  <HugeiconsIcon
                    icon={card.icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="relative pb-2">
              <p
                className={cn(
                  "text-2xl font-semibold tracking-tight",
                  card.tone === "revenue" && "text-emerald-500",
                  card.tone === "expense" && "text-destructive"
                )}
              >
                <ScrambleValue value={card.value} format={card.format} />
              </p>
            </CardContent>
            <CardFooter className="relative pt-0 text-xs text-muted-foreground">
              {card.footer}
            </CardFooter>
          </Card>
        ))}
      </section>
      {/* CHARTS */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card
          className={cn(
            "border-white/40 bg-white/70",
            "shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]"
          )}
        >
          <CardHeader>
            <CardTitle>Finance Overview</CardTitle>
            <CardDescription>
              Revenue, expenses and deposits over the last 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={financeComparisonConfig}
              className="h-72 w-full [&_.recharts-cartesian-axis-tick_text]:fill-sky-600"
            >
              <BarChart data={financeComparisonData} barCategoryGap={30}>
                <defs>
                  <linearGradient
                    id="financeRevenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#34d399" stopOpacity={1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.82} />
                  </linearGradient>
                  <linearGradient
                    id="financeExpenseGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={1} />
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0.84} />
                  </linearGradient>
                  <linearGradient
                    id="financeDepositGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={1} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.84} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#7dd3fc"
                  strokeDasharray="5 5"
                />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: "#0284c7" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: "#0d9488" }}
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="border bg-popover text-popover-foreground"
                      formatter={(value, name) => {
                        const typedName = String(name);
                        const configEntry =
                          typedName in financeComparisonConfig
                            ? financeComparisonConfig[
                                typedName as keyof typeof financeComparisonConfig
                              ]
                            : undefined;
                        const label =
                          configEntry !== undefined
                            ? configEntry.label
                            : typedName;

                        return (
                          <div className="flex w-full min-w-36 items-center justify-between gap-3">
                            <span className="font-medium">{label}</span>
                            <span className="font-semibold">
                              {formatCurrency(Number(value))}
                            </span>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <ChartLegend
                  content={<ChartLegendContent className="text-cyan-700" />}
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#financeRevenueGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  fill="url(#financeExpenseGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="deposits"
                  fill="url(#financeDepositGradient)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "border-white/40 bg-white/70 backdrop-blur-md",
            "shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]"
          )}
        >
          <CardHeader>
            <CardTitle>Bottle Distribution</CardTitle>
            <CardDescription>
              Current split of available, used and damaged bottles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={bottleDistributionConfig}
              className="h-72 w-full [&_.recharts-pie-label-text]:fill-indigo-600"
            >
              <PieChart>
                <defs>
                  <linearGradient
                    id="bottleAvailableGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#4ade80" stopOpacity={1} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.9} />
                  </linearGradient>
                  <linearGradient
                    id="bottleUsedGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.9} />
                  </linearGradient>
                  <linearGradient
                    id="bottleDamagedGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#fb923c" stopOpacity={1} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="status"
                      className="border bg-popover text-popover-foreground"
                      formatter={(value, name) => (
                        <div className="flex w-full min-w-36 items-center justify-between gap-3">
                          <span className="font-medium">{String(name)}</span>
                          <span className="font-semibold">
                            {formatBottles(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend
                  content={
                    <ChartLegendContent
                      nameKey="status"
                      className="text-emerald-700"
                    />
                  }
                />
                <Pie
                  data={bottleDistributionData}
                  dataKey="value"
                  nameKey="status"
                  innerRadius={54}
                  outerRadius={94}
                  strokeWidth={4}
                >
                  <Cell fill="url(#bottleAvailableGradient)" />
                  <Cell fill="url(#bottleUsedGradient)" />
                  <Cell fill="url(#bottleDamagedGradient)" />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>
    </section>
  );
}
