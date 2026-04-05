import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireAdminAuthorization } from "./-server/admin-auth.function";
import { AdminHeader } from "./-ui/admin-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";


export const Route = createFileRoute("/admin")({
  loader: async () => await requireAdminAuthorization(),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <SidebarProvider>
      <main className="flex min-h-screen w-full justify-between">
        <AppSidebar />
        <div className="flex w-full flex-1 flex-col gap-2">
          <AdminHeader />
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}


