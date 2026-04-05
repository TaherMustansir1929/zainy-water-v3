"use client";

import * as React from "react";
import type { Area } from "@/db/schema";
import { useModeratorStore } from "@/lib/ui-states/moderator-state";

type ModeratorArea = (typeof Area.enumValues)[number];

export function useModeratorSession() {
  const session = useModeratorStore((state) => state.session);
  const clearSession = useModeratorStore((state) => state.clearSession);
  const [hasHydrated, setHasHydrated] = React.useState(
    useModeratorStore.persist.hasHydrated(),
  );

  React.useEffect(() => {
    if (useModeratorStore.persist.hasHydrated()) {
      setHasHydrated(true);
      return;
    }

    const unsubscribe = useModeratorStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    void useModeratorStore.persist.rehydrate();

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (!hasHydrated || !session) {
      return;
    }

    if (session.expiresAt <= Date.now() || !session.sessionToken) {
      clearSession();
    }
  }, [clearSession, hasHydrated, session]);

  const hasSessionToken = Boolean(session?.sessionToken?.trim());
  const isAuthenticated =
    hasHydrated && Boolean(session && session.expiresAt > Date.now() && hasSessionToken);

  const hasAreaAccess = React.useCallback(
    (area: ModeratorArea) => {
      if (!isAuthenticated || !session) {
        return false;
      }

      return session.moderator.areas.includes(area);
    },
    [isAuthenticated, session],
  );

  return {
    hasHydrated,
    isAuthenticated,
    session: isAuthenticated ? session : null,
    sessionToken: isAuthenticated ? session?.sessionToken ?? null : null,
    moderator: isAuthenticated ? session?.moderator ?? null : null,
    clearModeratorSession: clearSession,
    hasAreaAccess,
  };
}
