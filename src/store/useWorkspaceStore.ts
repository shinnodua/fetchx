import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_COLLECTIONS,
  ERC20_ABI,
} from '../features/workspace/constants';
import type { CollectionItem, RequestItem } from '../features/workspace/types';

const createId = (prefix: 'c' | 'r') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const createCopyName = (name: string, existingNames: string[]) => {
  const normalizedExistingNames = new Set(
    existingNames.map((existingName) => existingName.toLowerCase()),
  );
  const baseName = `${name} Copy`;

  if (!normalizedExistingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let copyIndex = 2;
  let nextName = `${baseName} ${copyIndex}`;
  while (normalizedExistingNames.has(nextName.toLowerCase())) {
    copyIndex += 1;
    nextName = `${baseName} ${copyIndex}`;
  }

  return nextName;
};

const resetDraftForClosedTab = (
  reqId: string,
  collections: CollectionItem[],
  drafts: Record<string, RequestItem>,
) => {
  if (reqId.startsWith('r-new-')) {
    delete drafts[reqId];
    return;
  }

  let original: RequestItem | null = null;
  for (const col of collections) {
    const found = col.requests.find((r) => r.id === reqId);
    if (found) {
      original = found;
      break;
    }
  }

  if (original) {
    drafts[reqId] = JSON.parse(JSON.stringify(original));
  } else {
    delete drafts[reqId];
  }
};

interface WorkspaceState {
  collections: CollectionItem[];
  tabs: string[];
  activeTabId: string;
  searchTerm: string;

  // Dialog UI state
  newColOpen: boolean;
  newColName: string;
  newReqOpen: boolean;
  importReqOpen: boolean;
  targetColId: string;
  newReqName: string;
  newReqType: string;

  tabToClose: string | null;

  drafts: Record<string, RequestItem>;

  // Sidebar collapse, folding & resizing states
  collapsedCollectionIds: string[];
  collectionsPanelWidth: number;
  collectionsPanelCollapsed: boolean;
  requestToRevealId: string | null;

  // Actions
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

  saveDraft: (reqId: string, colId: string) => void;
  discardDraft: (reqId: string) => void;
  addNewTab: () => void;
  initializeDraft: (reqId: string) => void;
  setTabToClose: (id: string | null) => void;
}

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

      // Sidebar default values
      collapsedCollectionIds: [],
      collectionsPanelWidth: 320,
      collectionsPanelCollapsed: false,
      requestToRevealId: null,

      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setCollections: (collections) => set({ collections }),
      setNewColOpen: (newColOpen) => set({ newColOpen }),
      setNewColName: (newColName) => set({ newColName }),
      setNewReqOpen: (newReqOpen) => set({ newReqOpen }),
      setImportReqOpen: (importReqOpen) => set({ importReqOpen }),
      setTabToClose: (tabToClose) => set({ tabToClose }),
      setTargetColId: (targetColId) => set({ targetColId }),
      setNewReqName: (newReqName) => set({ newReqName }),
      setNewReqType: (newReqType) => set({ newReqType }),

      toggleCollectionCollapsed: (colId) =>
        set((state) => ({
          collapsedCollectionIds: state.collapsedCollectionIds.includes(colId)
            ? state.collapsedCollectionIds.filter((id) => id !== colId)
            : [...state.collapsedCollectionIds, colId],
        })),

      setCollectionsPanelWidth: (collectionsPanelWidth) =>
        set({ collectionsPanelWidth }),

      setCollectionsPanelCollapsed: (collectionsPanelCollapsed) =>
        set({ collectionsPanelCollapsed }),

      setRequestToRevealId: (requestToRevealId) => set({ requestToRevealId }),

      addCollection: (name) =>
        set((state) => {
          const trimmedName = name.trim();
          if (!trimmedName) return {};

          const exists = state.collections.some(
            (c) => c.name.toLowerCase() === trimmedName.toLowerCase(),
          );
          if (exists) {
            return {
              newColName: '',
              newColOpen: false,
            };
          }

          const newCol: CollectionItem = {
            id: createId('c'),
            name: trimmedName,
            requests: [],
          };
          return {
            collections: [...state.collections, newCol],
            newColName: '',
            newColOpen: false,
          };
        }),

      renameCollection: (colId, name) =>
        set((state) => {
          const trimmedName = name.trim();
          if (!trimmedName) return {};

          const exists = state.collections.some(
            (col) =>
              col.id !== colId &&
              col.name.toLowerCase() === trimmedName.toLowerCase(),
          );
          if (exists) return {};

          return {
            collections: state.collections.map((col) =>
              col.id === colId ? { ...col, name: trimmedName } : col,
            ),
          };
        }),

      duplicateCollection: (colId) =>
        set((state) => {
          const collection = state.collections.find((col) => col.id === colId);
          if (!collection) return {};

          const duplicatedCollection: CollectionItem = {
            ...collection,
            id: createId('c'),
            name: createCopyName(
              collection.name,
              state.collections.map((col) => col.name),
            ),
            requests: collection.requests.map((request) => ({
              ...JSON.parse(JSON.stringify(request)),
              id: createId('r'),
              response: null,
            })),
          };

          return {
            collections: [...state.collections, duplicatedCollection],
          };
        }),

      deleteCollection: (colId) =>
        set((state) => {
          const colToDelete = state.collections.find((c) => c.id === colId);
          const filteredCollections = state.collections.filter(
            (c) => c.id !== colId,
          );
          let remainingTabs = [...state.tabs];
          let activeTabId = state.activeTabId;

          const updatedDrafts = { ...state.drafts };

          if (colToDelete) {
            const colReqIds = colToDelete.requests.map((r) => r.id);
            remainingTabs = state.tabs.filter((t) => !colReqIds.includes(t));
            if (colReqIds.includes(state.activeTabId)) {
              activeTabId = remainingTabs[0] || '';
            }
            for (const reqId of colReqIds) {
              delete updatedDrafts[reqId];
            }
          }
          return {
            collections: filteredCollections,
            tabs: remainingTabs,
            activeTabId,
            drafts: updatedDrafts,
          };
        }),

      addRequest: (colId, name, type) =>
        set((state) => {
          const trimmedName = name.trim();
          if (!trimmedName) return {};

          const collection = state.collections.find((c) => c.id === colId);
          if (collection) {
            const exists = collection.requests.some(
              (r) => r.name.toLowerCase() === trimmedName.toLowerCase(),
            );
            if (exists) {
              return {
                newReqName: '',
                newReqOpen: false,
              };
            }
          }

          const newReq: RequestItem = {
            id: createId('r'),
            name: trimmedName,
            type,
            target: '',
            abi:
              type === 'READ' || type === 'WRITE'
                ? JSON.stringify(ERC20_ABI, null, 2)
                : '',
            functionName: '',
            network: '1',
            args: {},
            headers: [],
            queryParams: [],
            body: '',
            response: null,
          };

          const updatedCollections = state.collections.map((col) => {
            if (col.id === colId) {
              return { ...col, requests: [...col.requests, newReq] };
            }
            return col;
          });

          return {
            collections: updatedCollections,
            tabs: [...state.tabs, newReq.id],
            activeTabId: newReq.id,
            newReqName: '',
            newReqOpen: false,
            drafts: {
              ...state.drafts,
              [newReq.id]: JSON.parse(JSON.stringify(newReq)),
            },
          };
        }),

      addCustomRequest: (reqDetails) =>
        set((state) => {
          const trimmedName = (reqDetails.name || 'Imported Request').trim();
          const newId = `r-new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          const newReq: RequestItem = {
            id: newId,
            name: trimmedName,
            type: reqDetails.type || 'GET',
            target: reqDetails.target || '',
            abi:
              reqDetails.abi ||
              (reqDetails.type === 'READ' || reqDetails.type === 'WRITE'
                ? JSON.stringify(ERC20_ABI, null, 2)
                : ''),
            functionName: reqDetails.functionName || '',
            network: reqDetails.network || '1',
            args: reqDetails.args || {},
            headers: reqDetails.headers || [],
            queryParams: reqDetails.queryParams || [],
            body: reqDetails.body || '',
            response: null,
          };

          return {
            tabs: [...state.tabs, newId],
            activeTabId: newId,
            drafts: {
              ...state.drafts,
              [newId]: newReq,
            },
          };
        }),

      renameRequest: (reqId, name) =>
        set((state) => {
          const trimmedName = name.trim();
          if (!trimmedName) return {};

          const targetCollection = state.collections.find((col) =>
            col.requests.some((request) => request.id === reqId),
          );
          if (!targetCollection) return {};

          const exists = targetCollection.requests.some(
            (request) =>
              request.id !== reqId &&
              request.name.toLowerCase() === trimmedName.toLowerCase(),
          );
          if (exists) return {};

          const drafts = { ...state.drafts };
          if (drafts[reqId]) {
            drafts[reqId] = {
              ...drafts[reqId],
              name: trimmedName,
            };
          }

          return {
            collections: state.collections.map((col) => ({
              ...col,
              requests: col.requests.map((request) =>
                request.id === reqId
                  ? { ...request, name: trimmedName }
                  : request,
              ),
            })),
            drafts,
          };
        }),

      duplicateRequest: (reqId) =>
        set((state) => {
          const targetCollection = state.collections.find((col) =>
            col.requests.some((request) => request.id === reqId),
          );
          const request = targetCollection?.requests.find(
            (item) => item.id === reqId,
          );
          if (!targetCollection || !request) return {};

          const duplicatedRequest: RequestItem = {
            ...JSON.parse(JSON.stringify(request)),
            id: createId('r'),
            name: createCopyName(
              request.name,
              targetCollection.requests.map((item) => item.name),
            ),
            response: null,
          };

          return {
            collections: state.collections.map((col) =>
              col.id === targetCollection.id
                ? {
                    ...col,
                    requests: [...col.requests, duplicatedRequest],
                  }
                : col,
            ),
            tabs: [...state.tabs, duplicatedRequest.id],
            activeTabId: duplicatedRequest.id,
            drafts: {
              ...state.drafts,
              [duplicatedRequest.id]: JSON.parse(
                JSON.stringify(duplicatedRequest),
              ),
            },
          };
        }),

      deleteRequest: (reqId) =>
        set((state) => {
          const updatedCollections = state.collections.map((col) => ({
            ...col,
            requests: col.requests.filter((r) => r.id !== reqId),
          }));

          const remainingTabs = state.tabs.filter((t) => t !== reqId);
          let activeTabId = state.activeTabId;
          if (state.activeTabId === reqId) {
            activeTabId = remainingTabs[0] || '';
          }

          const updatedDrafts = { ...state.drafts };
          delete updatedDrafts[reqId];

          return {
            collections: updatedCollections,
            tabs: remainingTabs,
            activeTabId,
            drafts: updatedDrafts,
          };
        }),

      openTab: (reqId) =>
        set((state) => {
          const updatedTabs = state.tabs.includes(reqId)
            ? state.tabs
            : [...state.tabs, reqId];

          const drafts = { ...state.drafts };
          if (!drafts[reqId]) {
            let original: RequestItem | null = null;
            for (const col of state.collections) {
              const found = col.requests.find((r) => r.id === reqId);
              if (found) {
                original = found;
                break;
              }
            }
            if (original) {
              drafts[reqId] = JSON.parse(JSON.stringify(original));
            }
          }

          return {
            tabs: updatedTabs,
            activeTabId: reqId,
            drafts,
          };
        }),

      closeTab: (reqId) =>
        set((state) => {
          const remainingTabs = state.tabs.filter((t) => t !== reqId);
          let activeTabId = state.activeTabId;
          if (state.activeTabId === reqId) {
            activeTabId = remainingTabs[0] || '';
          }

          const updatedDrafts = { ...state.drafts };
          resetDraftForClosedTab(reqId, state.collections, updatedDrafts);

          return {
            tabs: remainingTabs,
            activeTabId,
            drafts: updatedDrafts,
          };
        }),

      closeTabs: (reqIds) =>
        set((state) => {
          const reqIdSet = new Set(reqIds);
          const remainingTabs = state.tabs.filter(
            (tabId) => !reqIdSet.has(tabId),
          );
          let activeTabId = state.activeTabId;
          if (reqIdSet.has(state.activeTabId)) {
            activeTabId = remainingTabs[0] || '';
          }

          const updatedDrafts = { ...state.drafts };
          for (const reqId of reqIdSet) {
            resetDraftForClosedTab(reqId, state.collections, updatedDrafts);
          }

          return {
            tabs: remainingTabs,
            activeTabId,
            drafts: updatedDrafts,
          };
        }),

      reorderTabs: (draggedTabId, targetTabId) =>
        set((state) => {
          if (draggedTabId === targetTabId) return {};

          const fromIndex = state.tabs.indexOf(draggedTabId);
          const toIndex = state.tabs.indexOf(targetTabId);
          if (fromIndex === -1 || toIndex === -1) return {};

          const updatedTabs = [...state.tabs];
          const [draggedTab] = updatedTabs.splice(fromIndex, 1);
          const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
          updatedTabs.splice(insertIndex, 0, draggedTab);

          return { tabs: updatedTabs };
        }),

      revealRequestInSidebar: (reqId) =>
        set((state) => {
          const owningCollection = state.collections.find((collection) =>
            collection.requests.some((request) => request.id === reqId),
          );
          if (!owningCollection) return {};

          return {
            collectionsPanelCollapsed: false,
            searchTerm: '',
            collapsedCollectionIds: state.collapsedCollectionIds.filter(
              (collectionId) => collectionId !== owningCollection.id,
            ),
            requestToRevealId: reqId,
            activeTabId: reqId,
          };
        }),

      setActiveTabId: (activeTabId) => set({ activeTabId }),

      updateActiveRequest: (fields) =>
        set((state) => {
          const reqId = state.activeTabId;
          const currentDraft = state.drafts[reqId];
          if (!currentDraft) return {};

          const updatedDraft = {
            ...currentDraft,
            ...fields,
            headers:
              fields.headers !== undefined
                ? fields.headers
                : currentDraft.headers,
            queryParams:
              fields.queryParams !== undefined
                ? fields.queryParams
                : currentDraft.queryParams,
            args: fields.args !== undefined ? fields.args : currentDraft.args,
          };

          return {
            drafts: {
              ...state.drafts,
              [reqId]: updatedDraft,
            },
          };
        }),

      addLog: (reqId, log) =>
        set((state) => {
          const time = new Date().toLocaleTimeString();
          const newLog = `[${time}] ${log}`;

          const drafts = { ...state.drafts };
          const draft = drafts[reqId];
          if (draft) {
            const currentResponse = draft.response || {
              status: '',
              data: null,
              duration: 0,
              logs: [],
            };
            drafts[reqId] = {
              ...draft,
              response: {
                ...currentResponse,
                logs: [...(currentResponse.logs || []), newLog],
              },
            };
          }

          const updatedCollections = state.collections.map((col) => ({
            ...col,
            requests: col.requests.map((req) => {
              if (req.id !== reqId) return req;
              const currentResponse = req.response || {
                status: '',
                data: null,
                duration: 0,
                logs: [],
              };
              return {
                ...req,
                response: {
                  ...currentResponse,
                  logs: [...(currentResponse.logs || []), newLog],
                },
              };
            }),
          }));

          return {
            drafts,
            collections: updatedCollections,
          };
        }),

      saveDraft: (reqId, colId) =>
        set((state) => {
          const draft = state.drafts[reqId];
          if (!draft) return {};

          const isNew = reqId.startsWith('r-new-');
          const savedId = isNew
            ? `r-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            : reqId;

          const savedReq: RequestItem = {
            ...draft,
            id: savedId,
          };

          let updatedCollections = [...state.collections];
          if (isNew) {
            updatedCollections = state.collections.map((col) => {
              if (col.id === colId) {
                return {
                  ...col,
                  requests: [...col.requests, savedReq],
                };
              }
              return col;
            });
          } else {
            updatedCollections = state.collections.map((col) => ({
              ...col,
              requests: col.requests.map((r) =>
                r.id === reqId ? savedReq : r,
              ),
            }));
          }

          let updatedTabs = [...state.tabs];
          let updatedActiveTabId = state.activeTabId;
          const updatedDrafts = { ...state.drafts };

          if (isNew) {
            updatedTabs = state.tabs.map((t) => (t === reqId ? savedId : t));
            if (state.activeTabId === reqId) {
              updatedActiveTabId = savedId;
            }
            delete updatedDrafts[reqId];
            updatedDrafts[savedId] = savedReq;
          } else {
            updatedDrafts[savedId] = savedReq;
          }

          return {
            collections: updatedCollections,
            tabs: updatedTabs,
            activeTabId: updatedActiveTabId,
            drafts: updatedDrafts,
          };
        }),

      discardDraft: (reqId) =>
        set((state) => {
          const isNew = reqId.startsWith('r-new-');
          const updatedDrafts = { ...state.drafts };

          if (isNew) {
            delete updatedDrafts[reqId];
            const remainingTabs = state.tabs.filter((t) => t !== reqId);
            let activeTabId = state.activeTabId;
            if (state.activeTabId === reqId) {
              activeTabId = remainingTabs[0] || '';
            }
            return {
              tabs: remainingTabs,
              activeTabId,
              drafts: updatedDrafts,
            };
          }

          let original: RequestItem | null = null;
          for (const col of state.collections) {
            const found = col.requests.find((r) => r.id === reqId);
            if (found) {
              original = found;
              break;
            }
          }
          if (original) {
            updatedDrafts[reqId] = JSON.parse(JSON.stringify(original));
          }
          return {
            drafts: updatedDrafts,
          };
        }),

      addNewTab: () =>
        set((state) => {
          const newId = `r-new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const newReq: RequestItem = {
            id: newId,
            name: 'Untitled Request',
            type: 'GET',
            target: '',
            abi: '',
            functionName: '',
            network: '1',
            args: {},
            headers: [],
            queryParams: [],
            body: '',
            response: null,
          };

          const newDrafts = {
            ...state.drafts,
            [newId]: newReq,
          };

          return {
            tabs: [...state.tabs, newId],
            activeTabId: newId,
            drafts: newDrafts,
          };
        }),

      initializeDraft: (reqId) =>
        set((state) => {
          if (state.drafts[reqId]) return {};

          let original: RequestItem | null = null;
          for (const col of state.collections) {
            const found = col.requests.find((r) => r.id === reqId);
            if (found) {
              original = found;
              break;
            }
          }
          if (original) {
            return {
              drafts: {
                ...state.drafts,
                [reqId]: JSON.parse(JSON.stringify(original)),
              },
            };
          }
          return {};
        }),
    }),
    {
      name: 'call3-workspace-storage',
    },
  ),
);

export const getRequestIsDirty = (
  draft: RequestItem | undefined,
  original: RequestItem | undefined,
): boolean => {
  if (!draft) return false;
  if (!original) return true;

  return (
    draft.name !== original.name ||
    draft.type !== original.type ||
    draft.target !== original.target ||
    draft.body !== original.body ||
    draft.functionName !== original.functionName ||
    draft.network !== original.network ||
    JSON.stringify(draft.headers) !== JSON.stringify(original.headers) ||
    JSON.stringify(draft.queryParams) !==
      JSON.stringify(original.queryParams) ||
    JSON.stringify(draft.args) !== JSON.stringify(original.args) ||
    draft.abi !== original.abi
  );
};
