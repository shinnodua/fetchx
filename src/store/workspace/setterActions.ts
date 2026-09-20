import type { StateCreator } from 'zustand';
import type { CollectionItem } from '../../features/workspace/types';
import type { WorkspaceState } from './workspaceStoreTypes';

type WorkspaceSet = Parameters<StateCreator<WorkspaceState>>[0];
type WorkspaceGet = Parameters<StateCreator<WorkspaceState>>[1];

const clampCollectionsPanelWidth = (width: number) =>
  Math.max(200, Math.min(500, width));

export const createSetterActions = (set: WorkspaceSet, _get: WorkspaceGet) => ({
  setSearchTerm: (searchTerm: string) => set({ searchTerm }),
  setCollections: (collections: CollectionItem[]) =>
    set((state) => ({
      collections,
      workspaceCollections: {
        ...state.workspaceCollections,
        [state.activeWorkspaceId]: collections,
      },
    })),
  setNewColOpen: (newColOpen: boolean) => set({ newColOpen }),
  setNewColName: (newColName: string) => set({ newColName }),
  setNewReqOpen: (newReqOpen: boolean) => set({ newReqOpen }),
  setImportReqOpen: (importReqOpen: boolean) => set({ importReqOpen }),
  setImportContractOpen: (importContractOpen: boolean) =>
    set({ importContractOpen }),
  setTabToClose: (tabToClose: string | null) => set({ tabToClose }),
  setTargetColId: (targetColId: string) => set({ targetColId }),
  setNewReqName: (newReqName: string) => set({ newReqName }),
  setNewReqType: (newReqType: string) => set({ newReqType }),
  setCollectionsPanelWidth: (collectionsPanelWidth: number) =>
    set({
      collectionsPanelWidth:
        Number.isFinite(collectionsPanelWidth) && collectionsPanelWidth > 0
          ? clampCollectionsPanelWidth(collectionsPanelWidth)
          : 320,
    }),
  setCollectionsPanelCollapsed: (collectionsPanelCollapsed: boolean) =>
    set({ collectionsPanelCollapsed }),
  setRequestToRevealId: (requestToRevealId: string | null) =>
    set({ requestToRevealId }),
  setAbiLoading: (abiLoading: boolean) => set({ abiLoading }),
});
