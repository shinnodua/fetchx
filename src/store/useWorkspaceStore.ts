import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_COLLECTIONS } from '../features/workspace/constants';
import { createWorkspaceActions } from './workspaceStoreActions';
import type { WorkspaceState } from './workspaceStoreTypes';

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      collections: DEFAULT_COLLECTIONS,
      tabs: [],
      activeTabId: '',
      searchTerm: '',

      newColOpen: false,
      newColName: '',
      newReqOpen: false,
      importReqOpen: false,
      targetColId: '',
      newReqName: '',
      newReqType: 'READ',

      tabToClose: null,

      drafts: {},

      collapsedCollectionIds: [],
      collectionsPanelWidth: 320,
      collectionsPanelCollapsed: false,
      requestToRevealId: null,

      ...createWorkspaceActions(set),
    }),
    {
      name: 'call3-workspace-storage',
    },
  ),
);
