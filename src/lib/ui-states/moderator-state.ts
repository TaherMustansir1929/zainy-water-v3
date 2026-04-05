import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Area } from "@/db/schema";

export type ModeratorState = {
  id: string;
  name: string;
  areas: Array<(typeof Area.enumValues)[number]>;
};

export type ModeratorSession = {
  moderator: ModeratorState;
  issuedAt: number;
  expiresAt: number;
  sessionToken: string;
};

export const DEFAULT_MODERATOR_SESSION_TTL_MS = 1000 * 60 * 60 * 12;

type ModeratorStore = {
  session: ModeratorSession | null;
  moderator: ModeratorState | null;
  issuedAt: number | null;
  expiresAt: number | null;
  setSession: (session: ModeratorSession | null) => void;
  setModeratorSession: (
    moderator: ModeratorState | null,
    options?: {
      ttlMs?: number;
      issuedAt?: number;
      sessionToken?: string;
    }
  ) => void;
  clearSession: () => void;
  isSessionValid: () => boolean;
  setModerator: (moderator: ModeratorState | null) => void;
};

export const useModeratorStore = create<ModeratorStore>()(
  persist<ModeratorStore>(
    (set, get) => ({
      session: null,
      moderator: null,
      issuedAt: null,
      expiresAt: null,
      setSession: (session) =>
        set({
          session,
          moderator: session?.moderator ?? null,
          issuedAt: session?.issuedAt ?? null,
          expiresAt: session?.expiresAt ?? null,
        }),
      setModeratorSession: (moderator, options) => {
        if (!moderator) {
          set({ session: null, moderator: null, issuedAt: null, expiresAt: null });
          return;
        }

        const issuedAt = options?.issuedAt ?? Date.now();
        const ttlMs = options?.ttlMs ?? DEFAULT_MODERATOR_SESSION_TTL_MS;
        const expiresAt = issuedAt + ttlMs;

        set({
          session: {
            moderator,
            issuedAt,
            expiresAt,
            sessionToken: options?.sessionToken ?? "",
          },
          moderator,
          issuedAt,
          expiresAt,
        });
      },
      clearSession: () =>
        set({
          session: null,
          moderator: null,
          issuedAt: null,
          expiresAt: null,
        }),
      isSessionValid: () => {
        const session = get().session;
        return Boolean(session && session.sessionToken && session.expiresAt > Date.now());
      },
      setModerator: (moderator) =>
        set((state) => ({
          moderator,
          session:
            moderator && state.issuedAt && state.expiresAt
              ? {
                  moderator,
                  issuedAt: state.issuedAt,
                  expiresAt: state.expiresAt,
                  sessionToken: state.session?.sessionToken ?? "",
                }
              : null,
        })),
    }),
    {
      name: "moderator-storage", // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
