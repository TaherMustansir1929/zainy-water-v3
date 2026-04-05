import { createFileRoute, Outlet } from '@tanstack/react-router';
import { WelcomeSection } from '../-ui/welcome-section';

export const Route = createFileRoute('/admin/moderators')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main className="flex w-full flex-col items-center justify-start">
      <WelcomeSection
        text="Here you can manage moderators for your platform. You can add, edit, and
        remove moderators as needed."
      />
      <Outlet />
    </main>
  );
}
