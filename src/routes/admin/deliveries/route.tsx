import { Suspense } from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { WelcomeSection } from "../utils/-ui/welcome-section";
import { LoadingState } from "@/components/web/loading-state";

export const Route = createFileRoute("/admin/deliveries")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="flex w-full flex-col items-center justify-start overflow-x-hidden">
      <WelcomeSection text="Here you can review and manage daily and miscellaneous deliveries." />
      <Suspense fallback={<LoadingState message="Loading deliveries..." />}>
        <Outlet />
      </Suspense>
    </main>
  );
}
