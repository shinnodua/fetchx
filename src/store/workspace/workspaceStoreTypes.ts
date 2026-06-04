import type {
  CollectionItem,
  RequestItem,
} from '../../features/workspace/types';

export interface WorkspaceState {
  collections: CollectionItem[];
  tabs: string[];
  activeTabId: string;
  searchTerm: string;

  newColOpen: boolean;
  newColName: string;
  newReqOpen: boolean;
  importReqOpen: boolean;
  targetColId: string;
  newReqName: string;
  newReqType: string;

  tabToClose: string | null;

  drafts: Record<string, RequestItem>;

  collapsedCollectionIds: string[];
  collectionsPanelWidth: number;
  collectionsPanelCollapsed: boolean;
  requestToRevealId: string | null;

  setSearchTerm: (term: string) => void;
  setCollections: (collections: CollectionItem[]) => void;
  setNewColOpen: (open: boolean) => void;
  setNewColName: (name: string) => void;
  setNewReqOpen: (open: boolean) => void;
  setImportReqOpen: (open: boolean) => void;
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
  reorderTabs: (draggedTabId: string, targetTabId: string) => void;
  revealRequestInSidebar: (reqId: string) => void;
  setActiveTabId: (id: string) => void;
  updateActiveRequest: (fields: Partial<RequestItem>) => void;
  addLog: (reqId: string, log: string) => void;
  saveActiveResponse: (name: string) => boolean;
  toggleSavedResponsesCollapsed: (reqId: string) => void;
  deleteSavedResponse: (reqId: string, responseId: string) => void;

  saveDraft: (reqId: string, colId: string) => void;
  discardDraft: (reqId: string) => void;
  addNewTab: () => void;
  initializeDraft: (reqId: string) => void;
  setTabToClose: (id: string | null) => void;
}
