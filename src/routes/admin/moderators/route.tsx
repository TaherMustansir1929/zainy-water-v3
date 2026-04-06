import { Suspense } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";

import { WelcomeSection } from "../utils/-ui/welcome-section";
import { LoadingState } from "@/components/web/loading-state";

export const Route = createFileRoute("/admin/moderators")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="flex w-full flex-col items-center justify-start">
      <WelcomeSection
        text="Here you can manage moderators for your platform. You can add, edit, and
        remove moderators as needed."
      />
      <Suspense fallback={<LoadingState message="Loading moderators..." />}>
        <Outlet />
      </Suspense>
    </main>
  );
}
