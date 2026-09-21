import type {
  CollectionItem,
  RequestItem,
} from '../../features/workspace/types';
import type { GitHubWorkspaceSyncState } from '../../features/workspace/utils/workspaceSyncState';
import type { TabReorderPlacement } from './tabOrder';

export interface GitHubWorkspaceConnection {
  repository: string;
  branch: string;
  connectionId?: string;
  connectionMode?: 'connect' | 'create';
  credentialKey?: string;
  lastSyncedCommitSha?: string;
  lastSyncedCollectionsDigest?: string;
  lastSyncedCollections?: CollectionItem[];
  syncState?: GitHubWorkspaceSyncState;
}

export interface GitHubConnectionDescriptor {
  id: string;
  accountId: string;
  accountLogin: string;
  mode: 'connect' | 'create';
  authType: 'oauth' | 'pat';
  credentialKey: string;
  expiresAt?: number;
}

export interface WorkspaceDescriptor {
  id: string;
  name: string;
  kind: 'local' | 'github';
  github?: GitHubWorkspaceConnection;
  syncStatus?: 'synced' | 'dirty' | 'syncing' | 'conflict' | 'error';
}

export interface WorkspaceState {
  workspaces: WorkspaceDescriptor[];
  githubConnections: GitHubConnectionDescriptor[];
  activeWorkspaceId: string;
  workspaceCollections: Record<string, CollectionItem[]>;
  collections: CollectionItem[];
  tabs: string[];
  activeTabId: string;
  searchTerm: string;

  newColOpen: boolean;
  newColName: string;
  newReqOpen: boolean;
  importReqOpen: boolean;
  importContractOpen: boolean;
  targetColId: string;
  newReqName: string;
  newReqType: string;

  tabToClose: string | null;

  drafts: Record<string, RequestItem>;

  collapsedCollectionIds: string[];
  collectionsPanelWidth: number;
  collectionsPanelCollapsed: boolean;
  requestToRevealId: string | null;
  abiLoading: boolean;

  setSearchTerm: (term: string) => void;
  setCollections: (collections: CollectionItem[]) => void;
  setNewColOpen: (open: boolean) => void;
  setNewColName: (name: string) => void;
  setNewReqOpen: (open: boolean) => void;
  setImportReqOpen: (open: boolean) => void;
  setImportContractOpen: (open: boolean) => void;
  setTargetColId: (id: string) => void;
  setNewReqName: (name: string) => void;
  setNewReqType: (type: string) => void;

  toggleCollectionCollapsed: (colId: string) => void;
  setCollectionsPanelWidth: (width: number) => void;
  setCollectionsPanelCollapsed: (collapsed: boolean) => void;
  setRequestToRevealId: (reqId: string | null) => void;

  addCollection: (name: string) => void;
  renameCollection: (id: string, name: string) => void;
  duplicateCollection: (id: string) => void;
  deleteCollection: (id: string) => void;
  importCollections: (collections: CollectionItem[]) => void;
  addRequest: (colId: string, name: string, type: string) => void;
  addCustomRequest: (request: Partial<RequestItem>) => void;
  renameRequest: (reqId: string, name: string) => void;
  duplicateRequest: (reqId: string) => void;
  deleteRequest: (reqId: string) => void;

  openTab: (reqId: string) => void;
  closeTab: (reqId: string) => void;
  closeTabs: (reqIds: string[]) => void;
  reorderTabs: (
    draggedTabId: string,
    targetTabId: string,
    placement?: TabReorderPlacement,
  ) => void;
  revealRequestInSidebar: (reqId: string) => void;
  setActiveTabId: (id: string) => void;
  updateActiveRequest: (fields: Partial<RequestItem>) => void;
  addLog: (reqId: string, log: string) => void;
  saveActiveResponse: (name: string) => boolean;
  toggleSavedResponsesCollapsed: (reqId: string) => void;
  deleteSavedResponse: (reqId: string, responseId: string) => void;

  saveDraft: (reqId: string, colId: string) => void;
  discardDraft: (reqId: string) => void;
  discardDraftChanges: (reqId: string) => void;
  addNewTab: () => void;
  initializeDraft: (reqId: string) => void;
  setTabToClose: (id: string | null) => void;
  setAbiLoading: (loading: boolean) => void;
  createGitHubWorkspace: (
    name: string,
    github: GitHubWorkspaceConnection,
    collections?: CollectionItem[],
  ) => string | undefined;
  switchWorkspace: (workspaceId: string) => void;
  removeWorkspace: (workspaceId: string) => boolean;
  renameWorkspace: (workspaceId: string, newName: string) => boolean;
  moveCollectionToWorkspace: (
    collectionId: string,
    sourceWorkspaceId: string,
    targetWorkspaceId: string,
  ) => boolean;
  setWorkspaceCollections: (
    workspaceId: string,
    collections: CollectionItem[],
    resetDraftsToCollections?: boolean,
  ) => void;
  setWorkspaceSyncStatus: (
    workspaceId: string,
    syncStatus: 'synced' | 'dirty' | 'syncing' | 'conflict' | 'error',
  ) => void;
  setWorkspaceGitHubSyncInfo: (
    workspaceId: string,
    info: Partial<GitHubWorkspaceConnection>,
  ) => void;
  upsertGitHubConnection: (connection: GitHubConnectionDescriptor) => void;
  removeGitHubConnection: (connectionId: string) => void;
  migrateLegacyGitHubConnections: () => void;
}
