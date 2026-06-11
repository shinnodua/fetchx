import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CorsState {
  blockedOrigins: string[];
  isOriginBlocked: (origin: string) => boolean;
  markOriginAsBlocked: (origin: string) => void;
}

export const useCorsStore = create<CorsState>()(
  persist(
    (set, get) => ({
      blockedOrigins: [],

      isOriginBlocked: (origin) => {
        return get().blockedOrigins.includes(origin);
      },

      markOriginAsBlocked: (origin) => {
        set((state) => {
          if (state.blockedOrigins.includes(origin)) return {};
          return {
            blockedOrigins: [...state.blockedOrigins, origin],
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
