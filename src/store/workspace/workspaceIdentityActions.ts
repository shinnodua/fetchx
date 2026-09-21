import type { StateCreator } from 'zustand';
import type {
  CollectionItem,
  RequestItem,
} from '../../features/workspace/types';
import {
  createCollectionsSnapshot,
  getCollectionsDigest,
} from '../../features/workspace/utils/workspaceRepositoryFormat';
import { createEmptyWorkspaceChangeIndex } from '../../features/workspace/utils/workspaceSyncState';
import type {
  GitHubConnectionDescriptor,
  GitHubWorkspaceConnection,
  WorkspaceState,
} from './workspaceStoreTypes';
import { cloneRequest } from './workspaceStoreUtils';

type WorkspaceSet = Parameters<StateCreator<WorkspaceState>>[0];
type WorkspaceGet = Parameters<StateCreator<WorkspaceState>>[1];

export const LOCAL_WORKSPACE_ID = 'local';

export const createWorkspaceIdentityActions = (
  set: WorkspaceSet,
  get: WorkspaceGet,
) => ({
  createGitHubWorkspace: (
    name: string,
    github: GitHubWorkspaceConnection,
    collections: CollectionItem[] = [],
  ) => {
    const trimmedName = name.trim();
    if (!trimmedName || !github.repository || !github.branch) return undefined;
    const state = get();
    const nameExists = state.workspaces.some(
      (workspace) =>
        workspace.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );
    if (nameExists) return undefined;

    const id = `workspace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set({
      activeWorkspaceId: id,
      workspaceCollections: {
        ...state.workspaceCollections,
        [state.activeWorkspaceId]: state.collections,
        [id]: collections,
      },
      collections,
      workspaces: [
        ...state.workspaces,
        {
          id,
          name: trimmedName,
          kind: 'github',
          github: {
            ...github,
            lastSyncedCollectionsDigest:
              github.lastSyncedCollectionsDigest ??
              getCollectionsDigest(collections),
            lastSyncedCollections:
              github.lastSyncedCollections ??
              createCollectionsSnapshot(collections),
            syncState: github.syncState ?? {
              changeIndex: createEmptyWorkspaceChangeIndex(),
              remote: { aheadBy: 0, status: 'synced' },
            },
          },
          syncStatus: 'synced',
        },
      ],
      tabs: [],
      activeTabId: '',
      drafts: {},
      targetColId: '',
      searchTerm: '',
    });
    return id;
  },
  switchWorkspace: (workspaceId: string) => {
    const state = get();
    if (
      workspaceId === state.activeWorkspaceId ||
      !state.workspaces.some((workspace) => workspace.id === workspaceId)
    )
      return;
    const updatedWorkspaceCollections = {
      ...state.workspaceCollections,
      [state.activeWorkspaceId]: state.collections,
    };
    const nextCollections = updatedWorkspaceCollections[workspaceId] ?? [];
    set({
      activeWorkspaceId: workspaceId,
      workspaceCollections: updatedWorkspaceCollections,
      collections: nextCollections,
      tabs: [],
      activeTabId: '',
      drafts: {},
      targetColId: '',
      searchTerm: '',
    });
  },
  removeWorkspace: (workspaceId: string) => {
    if (workspaceId === LOCAL_WORKSPACE_ID) return false;
    const state = get();
    const targetWorkspace = state.workspaces.find((w) => w.id === workspaceId);
    if (!targetWorkspace) return false;

    const nextWorkspaces = state.workspaces.filter((w) => w.id !== workspaceId);
    const nextWorkspaceCollections = { ...state.workspaceCollections };
    delete nextWorkspaceCollections[workspaceId];

    if (state.activeWorkspaceId === workspaceId) {
      const localCollections =
        nextWorkspaceCollections[LOCAL_WORKSPACE_ID] ?? [];
      set({
        workspaces: nextWorkspaces,
        activeWorkspaceId: LOCAL_WORKSPACE_ID,
        workspaceCollections: nextWorkspaceCollections,
        collections: localCollections,
        tabs: [],
        activeTabId: '',
        drafts: {},
        targetColId: '',
        searchTerm: '',
      });
    } else {
      set({
        workspaces: nextWorkspaces,
        workspaceCollections: nextWorkspaceCollections,
      });
    }
    return true;
  },
  renameWorkspace: (workspaceId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    const state = get();
    const workspace = state.workspaces.find((w) => w.id === workspaceId);
    if (!workspace) return false;

    const nameExists = state.workspaces.some(
      (w) =>
        w.id !== workspaceId &&
        w.name.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (nameExists) return false;

    set({
      workspaces: state.workspaces.map((w) =>
        w.id === workspaceId ? { ...w, name: trimmed } : w,
      ),
    });
    return true;
  },
  moveCollectionToWorkspace: (
    collectionId: string,
    sourceWorkspaceId: string,
    targetWorkspaceId: string,
  ) => {
    if (sourceWorkspaceId === targetWorkspaceId) return false;
    const state = get();
    const sourceWorkspace = state.workspaces.find(
      (w) => w.id === sourceWorkspaceId,
    );
    const targetWorkspace = state.workspaces.find(
      (w) => w.id === targetWorkspaceId,
    );
    if (!sourceWorkspace || !targetWorkspace) return false;

    const sourceCols =
      sourceWorkspaceId === state.activeWorkspaceId
        ? state.collections
        : (state.workspaceCollections[sourceWorkspaceId] ?? []);
    const targetCols =
      targetWorkspaceId === state.activeWorkspaceId
        ? state.collections
        : (state.workspaceCollections[targetWorkspaceId] ?? []);

    const colToMove = sourceCols.find((c) => c.id === collectionId);
    if (!colToMove) return false;

    const nextSourceCols = sourceCols.filter((c) => c.id !== collectionId);
    let targetColName = colToMove.name;
    if (
      targetCols.some(
        (c) => c.name.toLowerCase() === targetColName.toLowerCase(),
      )
    ) {
      targetColName = `${targetColName} (copy)`;
    }
    const movedCollection = { ...colToMove, name: targetColName };
    const nextTargetCols = [...targetCols, movedCollection];

    const nextWorkspaceCollections = {
      ...state.workspaceCollections,
      [sourceWorkspaceId]: nextSourceCols,
      [targetWorkspaceId]: nextTargetCols,
    };

    let nextActiveCollections = state.collections;
    if (state.activeWorkspaceId === sourceWorkspaceId) {
      nextActiveCollections = nextSourceCols;
    } else if (state.activeWorkspaceId === targetWorkspaceId) {
      nextActiveCollections = nextTargetCols;
    }

    set({
      workspaceCollections: nextWorkspaceCollections,
      collections: nextActiveCollections,
    });
    return true;
  },
  setWorkspaceCollections: (
    workspaceId: string,
    collections: CollectionItem[],
    resetDraftsToCollections = false,
  ) =>
    set((state) => {
      const isActiveWorkspace = workspaceId === state.activeWorkspaceId;
      const nextState: Partial<WorkspaceState> = {
        workspaceCollections: {
          ...state.workspaceCollections,
          [workspaceId]: collections,
        },
        ...(isActiveWorkspace ? { collections } : {}),
      };
      if (!isActiveWorkspace || !resetDraftsToCollections) return nextState;

      const requestsById = new Map(
        collections.flatMap((collection) =>
          collection.requests.map((request) => [request.id, request] as const),
        ),
      );
      const tabs = state.tabs.filter((requestId) =>
        requestsById.has(requestId),
      );
      nextState.tabs = tabs;
      nextState.activeTabId = tabs.includes(state.activeTabId)
        ? state.activeTabId
        : (tabs[0] ?? '');
      nextState.drafts = Object.fromEntries(
        tabs.map((requestId) => [
          requestId,
          cloneRequest(requestsById.get(requestId) as RequestItem),
        ]),
      );
      return nextState;
    }),
  setWorkspaceSyncStatus: (
    workspaceId: string,
    syncStatus: 'synced' | 'dirty' | 'syncing' | 'conflict' | 'error',
  ) =>
    set((state) => ({
      workspaces: state.workspaces.map((workspace) =>
        workspace.id === workspaceId ? { ...workspace, syncStatus } : workspace,
      ),
    })),
  setWorkspaceGitHubSyncInfo: (
    workspaceId: string,
    info: Partial<GitHubWorkspaceConnection>,
  ) =>
    set((state) => ({
      workspaces: state.workspaces.map((workspace) =>
        workspace.id === workspaceId && workspace.github
          ? {
              ...workspace,
              github: {
                ...workspace.github,
                ...info,
              },
            }
          : workspace,
      ),
    })),
  upsertGitHubConnection: (connection: GitHubConnectionDescriptor) =>
    set((state) => ({
      githubConnections: [
        ...state.githubConnections.filter((item) => item.id !== connection.id),
        connection,
      ],
    })),
  removeGitHubConnection: (connectionId: string) =>
    set((state) => ({
      githubConnections: state.githubConnections.filter(
        (connection) => connection.id !== connectionId,
      ),
    })),
  migrateLegacyGitHubConnections: () => {
    const state = get();
    const workspacesNeedingConnections = state.workspaces.filter(
      (workspace) =>
        workspace.kind === 'github' &&
        workspace.github &&
        (!workspace.github.connectionId ||
          !state.githubConnections.some(
            (connection) => connection.id === workspace.github?.connectionId,
          )),
    );
    if (!workspacesNeedingConnections.length) return;

    const recoveredConnections = workspacesNeedingConnections.map(
      (workspace) => {
        const github = workspace.github as GitHubWorkspaceConnection;
        const mode = github.connectionMode ?? 'connect';
        const id = github.connectionId || `legacy-${workspace.id}`;
        return {
          id,
          accountId: 'legacy',
          accountLogin: 'GitHub connection',
          mode,
          authType: 'pat' as const,
          credentialKey:
            github.credentialKey ||
            (github.connectionId?.startsWith('github-')
              ? `connection.${github.connectionId}`
              : `connection.${mode}`),
        };
      },
    );
    set({
      githubConnections: [
        ...state.githubConnections,
        ...recoveredConnections.filter(
          (connection) =>
            !state.githubConnections.some((item) => item.id === connection.id),
        ),
      ],
      workspaces: state.workspaces.map((workspace) =>
        workspace.kind === 'github' &&
        workspace.github &&
        workspacesNeedingConnections.some((item) => item.id === workspace.id)
          ? {
              ...workspace,
              github: {
                ...workspace.github,
                connectionId:
                  workspace.github.connectionId || `legacy-${workspace.id}`,
                credentialKey:
                  workspace.github.credentialKey ||
                  (workspace.github.connectionId?.startsWith('github-')
                    ? `connection.${workspace.github.connectionId}`
                    : `connection.${workspace.github.connectionMode ?? 'connect'}`),
              },
            }
          : workspace,
      ),
    });
  },
});
