import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className={"flex min-h-screen w-full items-center justify-center"}>
      <Outlet />
    </div>
  );
}
