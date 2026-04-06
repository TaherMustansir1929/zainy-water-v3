import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Suspense } from "react";
import { WelcomeSection } from "../utils/-ui/welcome-section";
import { LoadingState } from "@/components/web/loading-state";

export const Route = createFileRoute("/admin/expenses")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="flex w-full flex-col items-center justify-start">
      <WelcomeSection
        text={"Here you can manage extra expenses for your business."}
        greeting="Hi there"
      />
      <Suspense fallback={<LoadingState message="Loading moderators..." />}>
        <Outlet />
      </Suspense>
    </main>
  );
}
