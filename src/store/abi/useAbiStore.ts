import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavedContractAbi } from '../../features/workspace/types';

interface AbiState {
  savedAbis: SavedContractAbi[];
  manageAbiOpen: boolean;
  setManageAbiOpen: (open: boolean) => void;
  saveAbi: (name: string, abi: string) => void;
  deleteAbi: (id: string) => void;
}

const createAbiId = () =>
  `abi-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useAbiStore = create<AbiState>()(
  persist(
    (set) => ({
      savedAbis: [],
      manageAbiOpen: false,
      setManageAbiOpen: (manageAbiOpen) => set({ manageAbiOpen }),
      saveAbi: (name, abi) =>
        set((state) => {
          const trimmedName = name.trim();
          const existingAbi = state.savedAbis.find(
            (savedAbi) =>
              savedAbi.name.toLowerCase() === trimmedName.toLowerCase(),
          );

          if (existingAbi) {
            return {
              savedAbis: state.savedAbis.map((savedAbi) =>
                savedAbi.id === existingAbi.id
                  ? { ...savedAbi, name: trimmedName, abi }
                  : savedAbi,
              ),
            };
          }

          return {
            savedAbis: [
              ...state.savedAbis,
              {
                id: createAbiId(),
                name: trimmedName,
                abi,
              },
            ],
          };
        }),
      deleteAbi: (id) =>
        set((state) => ({
          savedAbis: state.savedAbis.filter((savedAbi) => savedAbi.id !== id),
        })),
    }),
    {
      name: 'fetchx-abi-storage',
    },
  ),
);
