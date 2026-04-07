import { Suspense } from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { WelcomeSection } from "../utils/-ui/welcome-section";
import { LoadingState } from "@/components/web/loading-state";

export const Route = createFileRoute("/admin/inventory")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="flex w-full flex-col items-center justify-start overflow-x-hidden">
      <WelcomeSection text="Here you can manage bottle inventory and daily usage records." />
      <Suspense fallback={<LoadingState message="Loading inventory..." />}>
        <Outlet />
      </Suspense>
    </main>
  );
}
