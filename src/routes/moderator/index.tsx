import * as React from "react";
import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  getModeratorSession,
  moderatorLogout,
} from "./login/-server/modMiddleware.function";
import { ModTabs } from "./-ui/mod-tabs";
import { useModeratorSession } from "@/hooks/use-moderator-session";

export const Route = createFileRoute('/moderator/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const {
    hasHydrated,
    isAuthenticated,
    moderator,
    sessionToken,
    clearModeratorSession,
  } = useModeratorSession();

  const [isServerSessionChecked, setIsServerSessionChecked] = React.useState(false);
  // const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  React.useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !sessionToken) {
      return;
    }

    let isMounted = true;
    setIsServerSessionChecked(false);

    void getModeratorSession({ data: { sessionToken } })
      .then(() => {
        if (!isMounted) {
          return;
        }

        setIsServerSessionChecked(true);
      })
      .catch(async () => {
        if (!isMounted) {
          return;
        }

        clearModeratorSession();
        toast.error("Session expired. Please sign in again.");
        await navigate({ to: "/moderator/login", replace: true });
      });

    return () => {
      isMounted = false;
    };
  }, [clearModeratorSession, hasHydrated, isAuthenticated, navigate, sessionToken]);

  // const handleLogout = React.useCallback(async () => {
  //   if (isLoggingOut) {
  //     return;
  //   }

  //   setIsLoggingOut(true);
  //   try {
  //     if (sessionToken) {
  //       await moderatorLogout({ data: { sessionToken } });
  //     }
  //     toast.success("Signed out successfully.");
  //   } catch {
  //     toast.error("Signed out locally. Could not confirm server logout.");
  //   } finally {
  //     clearModeratorSession();
  //     setIsLoggingOut(false);
  //     await navigate({ to: "/moderator/login", replace: true });
  //   }
  // }, [clearModeratorSession, isLoggingOut, navigate, sessionToken]);

  if (!hasHydrated) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-muted-foreground">
        Checking your moderator session...
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/moderator/login" replace />;
  }

  if (!isServerSessionChecked) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-muted-foreground">
        Verifying moderator session with server...
      </section>
    );
  }

  return (
    <section className="flex min-h-screen flex-col justify-start gap-y-10 md:mt-4 md:items-center md:px-4">
      <ModTabs />
    </section>
  );
}
