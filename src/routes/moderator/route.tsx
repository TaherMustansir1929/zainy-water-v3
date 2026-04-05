import { Outlet, createFileRoute } from "@tanstack/react-router";
import { ModHeader } from "./-ui/mod-header";
import { MainFooter } from "./-ui/mod-footer";

export const Route = createFileRoute("/moderator")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <ModHeader />
      <Outlet />
      <MainFooter className="w-full bg-primary py-2 text-center text-[10px] text-white md:text-sm" />
    </div>
  );
}
