import { Area } from "@/db/schema";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ModeratorState = {
  id: string;
  name: string;
  areas: (typeof Area.enumValues)[number][];
};

type ModeratorStore = {
  moderator: ModeratorState | null;
  setModerator: (moderator: ModeratorState | null) => void;
};

export const useModeratorStore = create<ModeratorStore>()(
  persist(
    (set) => ({
      moderator: null,
      setModerator: (moderator) => set({ moderator }),
    }),
    {
      name: "moderator-storage", // unique name for localStorage key
      partialize: (state) => ({ moderator: state.moderator }),
    }
  )
);
