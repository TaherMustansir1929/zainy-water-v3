import { create } from "zustand";
import { persist } from "zustand/middleware";

type DOBState = {
  dob: Date | null;
  setDOB: (dob: Date | null) => void;
};

export const useDOBStore = create<DOBState>()(
  persist(
    (set) => ({
      dob: null,
      setDOB: (dob) => set({ dob }),
    }),
    {
      name: "dob-storage", // unique name for localStorage key
      partialize: (state) => ({ dob: state.dob }),
      // Fix Date serialization issue
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              // Convert string back to Date
              dob: state.dob ? new Date(state.dob) : null,
            },
          };
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
