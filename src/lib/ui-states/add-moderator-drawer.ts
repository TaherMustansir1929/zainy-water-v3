import { create } from "zustand";
import type { ModeratorState } from "./moderator-state";

export type AddModDrawerState = {
  isEditOpen: boolean;
  isAddOpen: boolean;
  openEditDrawer: () => void;
  openAddDrawer: () => void;
  closeDrawer: () => void;
  mod_data: ModeratorState | null;
  setModData: (data: ModeratorState) => void;
};

export const useAddModDrawer = create<AddModDrawerState>((set) => ({
  isEditOpen: false,
  isAddOpen: false,
  openEditDrawer: () => set({ isEditOpen: true }),
  openAddDrawer: () => set({ isAddOpen: true }),
  closeDrawer: () => set({ isEditOpen: false, isAddOpen: false }),
  mod_data: null,
  setModData: (data: ModeratorState) => set({ mod_data: data }),
}));
