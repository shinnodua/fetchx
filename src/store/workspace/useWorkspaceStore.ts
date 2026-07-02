import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_COLLECTIONS } from '../../features/workspace/constants';
import { createWorkspaceActions } from './workspaceStoreActions';
import type { WorkspaceState } from './workspaceStoreTypes';
import { clearWorkspaceResponseLogs } from './workspaceStoreUtils';

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      collections: DEFAULT_COLLECTIONS,
      tabs: [],
      activeTabId: '',
      searchTerm: '',

      newColOpen: false,
      newColName: '',
      newReqOpen: false,
      importReqOpen: false,
      importContractOpen: false,
      targetColId: '',
      newReqName: '',
      newReqType: 'READ',

      tabToClose: null,

      drafts: {},

      collapsedCollectionIds: [],
      collectionsPanelWidth: 320,
      collectionsPanelCollapsed: false,
      requestToRevealId: null,
      abiLoading: false,

      ...createWorkspaceActions(set, get),
    }),
    {
      name: 'call3-workspace-storage',
      onRehydrateStorage: () => () => {
        const { collections, drafts } = useWorkspaceStore.getState();
        const loglessWorkspace = clearWorkspaceResponseLogs(
          collections,
          drafts,
        );
        useWorkspaceStore.setState({
          ...loglessWorkspace,
          abiLoading: false,
        });
      },
    },
  ),
);
