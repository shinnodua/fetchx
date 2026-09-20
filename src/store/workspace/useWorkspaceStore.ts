import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_COLLECTIONS } from '../../features/workspace/constants';
import {
  createWorkspaceChangeIndex,
  getWorkspaceChangeCount,
} from '../../features/workspace/utils/workspaceSyncState';
import { LOCAL_WORKSPACE_ID } from './workspaceIdentityActions';
import { createWorkspaceActions } from './workspaceStoreActions';
import type { WorkspaceState } from './workspaceStoreTypes';
import { clearWorkspaceResponseLogs } from './workspaceStoreUtils';

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [
        { id: LOCAL_WORKSPACE_ID, name: 'Local Workspace', kind: 'local' },
      ],
      githubConnections: [],
      activeWorkspaceId: LOCAL_WORKSPACE_ID,
      workspaceCollections: {
        [LOCAL_WORKSPACE_ID]: DEFAULT_COLLECTIONS,
      },
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
      name: 'fetchx-workspace-storage',
      onRehydrateStorage: () => () => {
        const { activeWorkspaceId, collections, drafts, workspaceCollections } =
          useWorkspaceStore.getState();
        const loglessWorkspace = clearWorkspaceResponseLogs(
          collections,
          drafts,
        );
        useWorkspaceStore.setState({
          ...loglessWorkspace,
          workspaceCollections: {
            ...workspaceCollections,
            [activeWorkspaceId]: collections,
          },
          abiLoading: false,
        });
      },
    },
  ),
);

let isUpdatingSyncIndex = false;

useWorkspaceStore.subscribe((state, previousState) => {
  if (
    isUpdatingSyncIndex ||
    (state.collections === previousState.collections &&
      state.activeWorkspaceId === previousState.activeWorkspaceId)
  ) {
    return;
  }

  const activeWorkspace = state.workspaces.find(
    (workspace) => workspace.id === state.activeWorkspaceId,
  );
  const baselineCollections = activeWorkspace?.github?.lastSyncedCollections;
  if (!activeWorkspace?.github || !baselineCollections) return;

  const changeIndex = createWorkspaceChangeIndex(
    baselineCollections,
    state.collections,
  );
  const previousIndex = activeWorkspace.github.syncState?.changeIndex;
  if (JSON.stringify(changeIndex) === JSON.stringify(previousIndex)) return;

  isUpdatingSyncIndex = true;
  useWorkspaceStore.setState((currentState) => ({
    workspaces: currentState.workspaces.map((workspace) =>
      workspace.id === state.activeWorkspaceId && workspace.github
        ? {
            ...workspace,
            github: {
              ...workspace.github,
              syncState: {
                changeIndex,
                remote: workspace.github.syncState?.remote ?? {
                  aheadBy: null,
                  status: 'unknown',
                },
              },
            },
            syncStatus:
              workspace.syncStatus === 'syncing' ||
              workspace.syncStatus === 'conflict' ||
              workspace.syncStatus === 'error'
                ? workspace.syncStatus
                : getWorkspaceChangeCount(changeIndex) > 0
                  ? 'dirty'
                  : 'synced',
          }
        : workspace,
    ),
  }));
  isUpdatingSyncIndex = false;
});
