import { Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { WelcomeSection } from "../utils/-ui/welcome-section";
import { getDashboardAnalytics } from "./-server/getDashboardAnalytics.function";
import { DashboardAnalyticsSection } from "./-ui/dashboard-analytics";
import { LoadingState } from "@/components/web/loading-state";

export const Route = createFileRoute("/admin/dashboard/")({
  loader: async () => {
    const analytics = await getDashboardAnalytics();
    return { analytics };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { analytics } = Route.useLoaderData();

  return (
    <main className="flex w-full flex-col items-center justify-start">
      <WelcomeSection
        text={
          "Welcome to Zainy Water Admin panel. A modern and user-friendly platform for managing your business."
        }
        greeting="Welcome"
      />
      <Suspense fallback={<LoadingState message="Loading dashboard analytics..." />}>
        <DashboardAnalyticsSection analytics={analytics} />
      </Suspense>
    </main>
  );
}
