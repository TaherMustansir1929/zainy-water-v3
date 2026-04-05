import { Outlet, createFileRoute } from "@tanstack/react-router";

import { requireAdminAuthorization } from "./-server/admin-auth.function";

export const Route = createFileRoute("/admin")({
  loader: async () => await requireAdminAuthorization(),
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
