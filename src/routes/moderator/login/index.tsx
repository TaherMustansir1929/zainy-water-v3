import { UserDollarIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Navigate, createFileRoute } from '@tanstack/react-router'
import { ModLoginForm } from './-ui/mod-login-form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useModeratorSession } from '@/hooks/use-moderator-session';

export const Route = createFileRoute('/moderator/login/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { hasHydrated, isAuthenticated } = useModeratorSession();

  if (hasHydrated && isAuthenticated) {
    return <Navigate to="/moderator" replace />;
  }

  return (
    <section
      className="mt-4 flex flex-col gap-y-6 p-2 md:items-center md:justify-center"
      style={{ minHeight: "calc(100vh - 130px)" }}
    >
      <Card className="w-full max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-3 text-center">
            <HugeiconsIcon icon={UserDollarIcon} />
            Moderator Login Page
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ModLoginForm />
        </CardContent>
        <CardFooter>
          <p className="text-center text-sm text-muted-foreground">
            Sign-in with your assigned moderator username and password. For any
            queries contact the admin.
          </p>
        </CardFooter>
      </Card>
    </section>
  );
}
