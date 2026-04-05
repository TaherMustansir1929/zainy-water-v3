import { createFileRoute } from "@tanstack/react-router";

import { requireAdminAuthorization } from "./-server/admin-auth.function";

export const Route = createFileRoute("/admin/dashboard")({
  loader: async () => await requireAdminAuthorization(),
  component: DashboardPage,
});

function DashboardPage() {
  const { userId } = Route.useLoaderData();

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You are signed in as {userId}.
        </p>
      </section>
    </main>
  );
}
