import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomRpc } from '../../features/workspace/types';

interface RpcState {
  customRpcs: CustomRpc[];
  manageRpcOpen: boolean;
  setManageRpcOpen: (open: boolean) => void;
  addCustomRpc: (rpc: Omit<CustomRpc, 'id'>) => void;
  deleteCustomRpc: (id: string) => void;
}

const createRpcId = () =>
  `rpc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useRpcStore = create<RpcState>()(
  persist(
    (set) => ({
      customRpcs: [],
      manageRpcOpen: false,

      setManageRpcOpen: (manageRpcOpen) => set({ manageRpcOpen }),

      addCustomRpc: (rpc) =>
        set((state) => {
          const trimmedName = rpc.name.trim();
          return {
            customRpcs: [
              ...state.customRpcs,
              {
                id: createRpcId(),
                name: trimmedName || 'Custom RPC',
                chainId: rpc.chainId.trim(),
                url: rpc.url.trim(),
                explorerUrl: rpc.explorerUrl?.trim() || undefined,
              },
            ],
          };
        }),

      deleteCustomRpc: (id) =>
        set((state) => ({
          customRpcs: state.customRpcs.filter((rpc) => rpc.id !== id),
        })),
    }),
    {
      name: 'fetchx-rpc-storage',
    },
  ),
);
