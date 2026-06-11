import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CorsState {
  corsOrigins: string[];
  isOriginBlocked: (origin: string) => boolean;
  markOriginAsBlocked: (origin: string) => void;
}

export const useCorsStore = create<CorsState>()(
  persist(
    (set, get) => ({
      corsOrigins: [],

      isOriginBlocked: (origin) => {
        return get().corsOrigins.includes(origin);
      },

      markOriginAsBlocked: (origin) => {
        set((state) => {
          if (state.corsOrigins.includes(origin)) return {};
          return {
            corsOrigins: [...state.corsOrigins, origin],
          };
        });
      },
    }),
    {
      name: 'call3-cors-storage',
      // Since we want the storage to load synchronously for the non-React code,
      // Zustand's persist middleware by default handles localStorage synchronously.
    },
  ),
);
