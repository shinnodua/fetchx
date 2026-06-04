import type { StateCreator } from 'zustand';
import type {
  CollectionItem,
  RequestItem,
  SavedResponse,
} from '../../features/workspace/types';
import type { WorkspaceState } from './workspaceStoreTypes';
import {
  cloneRequest,
  createAvailableName,
  createCopyName,
  createDefaultAbi,
  createId,
  createNewRequestId,
  createRequest,
  findRequestById,
  resetDraftForClosedTab,
} from './workspaceStoreUtils';

type WorkspaceSet = Parameters<StateCreator<WorkspaceState>>[0];
type WorkspaceGet = Parameters<StateCreator<WorkspaceState>>[1];

const clampCollectionsPanelWidth = (width: number) =>
  Math.max(200, Math.min(500, width));

export const createWorkspaceActions = (
  set: WorkspaceSet,
  get: WorkspaceGet,
) => ({
  setSearchTerm: (searchTerm: string) => set({ searchTerm }),
  setCollections: (collections: CollectionItem[]) => set({ collections }),
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

  toggleCollectionCollapsed: (colId: string) =>
    set((state) => ({
      collapsedCollectionIds: state.collapsedCollectionIds.includes(colId)
        ? state.collapsedCollectionIds.filter((id) => id !== colId)
        : [...state.collapsedCollectionIds, colId],
    })),

  addCollection: (name: string) =>
    set((state) => {
      const trimmedName = name.trim();
      if (!trimmedName) return {};

      const exists = state.collections.some(
        (collection) =>
          collection.name.toLowerCase() === trimmedName.toLowerCase(),
      );
      if (exists) {
        return { newColName: '', newColOpen: false };
      }

      return {
        collections: [
          ...state.collections,
          { id: createId('c'), name: trimmedName, requests: [] },
        ],
        newColName: '',
        newColOpen: false,
      };
    }),

  renameCollection: (colId: string, name: string) =>
    set((state) => {
      const trimmedName = name.trim();
      if (!trimmedName) return {};

      const exists = state.collections.some(
        (collection) =>
          collection.id !== colId &&
          collection.name.toLowerCase() === trimmedName.toLowerCase(),
      );
      if (exists) return {};

      return {
        collections: state.collections.map((collection) =>
          collection.id === colId
            ? { ...collection, name: trimmedName }
            : collection,
        ),
      };
    }),

  duplicateCollection: (colId: string) =>
    set((state) => {
      const collection = state.collections.find((item) => item.id === colId);
      if (!collection) return {};

      const duplicatedCollection: CollectionItem = {
        ...collection,
        id: createId('c'),
        name: createCopyName(
          collection.name,
          state.collections.map((item) => item.name),
        ),
        requests: collection.requests.map((request) => ({
          ...cloneRequest(request),
          id: createId('r'),
          response: null,
        })),
      };

      return {
        collections: [...state.collections, duplicatedCollection],
      };
    }),

  deleteCollection: (colId: string) =>
    set((state) => {
      const colToDelete = state.collections.find((item) => item.id === colId);
      const filteredCollections = state.collections.filter(
        (item) => item.id !== colId,
      );
      let remainingTabs = [...state.tabs];
      let activeTabId = state.activeTabId;
      const updatedDrafts = { ...state.drafts };

      if (colToDelete) {
        const colReqIds = colToDelete.requests.map((request) => request.id);
        remainingTabs = state.tabs.filter(
          (tabId) => !colReqIds.includes(tabId),
        );
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

  importCollections: (collections: CollectionItem[]) =>
    set((state) => {
      if (collections.length === 0) return {};

      const collectionNames = state.collections.map(
        (collection) => collection.name,
      );
      const importedCollections = collections.map((collection) => {
        const collectionName = createAvailableName(
          collection.name,
          collectionNames,
        );
        collectionNames.push(collectionName);

        return {
          id: createId('c'),
          name: collectionName,
          requests: collection.requests.map((request) => ({
            ...cloneRequest(request),
            id: createId('r'),
            response: null,
          })),
        };
      });

      return {
        collections: [...state.collections, ...importedCollections],
      };
    }),

  addRequest: (colId: string, name: string, type: string) =>
    set((state) => {
      const trimmedName = name.trim();
      if (!trimmedName) return {};

      const collection = state.collections.find((item) => item.id === colId);
      const exists = collection?.requests.some(
        (request) => request.name.toLowerCase() === trimmedName.toLowerCase(),
      );
      if (exists) {
        return { newReqName: '', newReqOpen: false };
      }

      const newReq = createRequest(createId('r'), trimmedName, type);

      return {
        collections: state.collections.map((item) =>
          item.id === colId
            ? { ...item, requests: [...item.requests, newReq] }
            : item,
        ),
        tabs: [...state.tabs, newReq.id],
        activeTabId: newReq.id,
        newReqName: '',
        newReqOpen: false,
        drafts: {
          ...state.drafts,
          [newReq.id]: cloneRequest(newReq),
        },
      };
    }),

  addCustomRequest: (reqDetails: Partial<RequestItem>) =>
    set((state) => {
      const trimmedName = (reqDetails.name || 'Imported Request').trim();
      const newId = createNewRequestId();
      const type = reqDetails.type || 'GET';
      const newReq = createRequest(newId, trimmedName, type, {
        ...reqDetails,
        name: trimmedName,
        type,
        abi: reqDetails.abi || createDefaultAbi(type),
        response: null,
      });

      return {
        tabs: [...state.tabs, newId],
        activeTabId: newId,
        drafts: {
          ...state.drafts,
          [newId]: newReq,
        },
      };
    }),

  renameRequest: (reqId: string, name: string) =>
    set((state) => {
      const trimmedName = name.trim();
      if (!trimmedName) return {};

      const targetCollection = state.collections.find((collection) =>
        collection.requests.some((request) => request.id === reqId),
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
        drafts[reqId] = { ...drafts[reqId], name: trimmedName };
      }

      return {
        collections: state.collections.map((collection) => ({
          ...collection,
          requests: collection.requests.map((request) =>
            request.id === reqId ? { ...request, name: trimmedName } : request,
          ),
        })),
        drafts,
      };
    }),

  duplicateRequest: (reqId: string) =>
    set((state) => {
      const targetCollection = state.collections.find((collection) =>
        collection.requests.some((request) => request.id === reqId),
      );
      const request = targetCollection?.requests.find(
        (item) => item.id === reqId,
      );
      if (!targetCollection || !request) return {};

      const duplicatedRequest: RequestItem = {
        ...cloneRequest(request),
        id: createId('r'),
        name: createCopyName(
          request.name,
          targetCollection.requests.map((item) => item.name),
        ),
        response: null,
      };

      return {
        collections: state.collections.map((collection) =>
          collection.id === targetCollection.id
            ? {
                ...collection,
                requests: [...collection.requests, duplicatedRequest],
              }
            : collection,
        ),
        tabs: [...state.tabs, duplicatedRequest.id],
        activeTabId: duplicatedRequest.id,
        drafts: {
          ...state.drafts,
          [duplicatedRequest.id]: cloneRequest(duplicatedRequest),
        },
      };
    }),

  deleteRequest: (reqId: string) =>
    set((state) => {
      const updatedCollections = state.collections.map((collection) => ({
        ...collection,
        requests: collection.requests.filter((request) => request.id !== reqId),
      }));

      const remainingTabs = state.tabs.filter((tabId) => tabId !== reqId);
      const activeTabId =
        state.activeTabId === reqId
          ? remainingTabs[0] || ''
          : state.activeTabId;
      const updatedDrafts = { ...state.drafts };
      delete updatedDrafts[reqId];

      return {
        collections: updatedCollections,
        tabs: remainingTabs,
        activeTabId,
        drafts: updatedDrafts,
      };
    }),

  openTab: (reqId: string) =>
    set((state) => {
      const updatedTabs = state.tabs.includes(reqId)
        ? state.tabs
        : [...state.tabs, reqId];
      const drafts = { ...state.drafts };
      const original = findRequestById(state.collections, reqId);

      if (!drafts[reqId] && original) {
        drafts[reqId] = cloneRequest(original);
      }

      return {
        tabs: updatedTabs,
        activeTabId: reqId,
        drafts,
      };
    }),

  closeTab: (reqId: string) =>
    set((state) => {
      const remainingTabs = state.tabs.filter((tabId) => tabId !== reqId);
      const updatedDrafts = { ...state.drafts };
      resetDraftForClosedTab(reqId, state.collections, updatedDrafts);

      return {
        tabs: remainingTabs,
        activeTabId:
          state.activeTabId === reqId
            ? remainingTabs[0] || ''
            : state.activeTabId,
        drafts: updatedDrafts,
      };
    }),

  closeTabs: (reqIds: string[]) =>
    set((state) => {
      const reqIdSet = new Set(reqIds);
      const remainingTabs = state.tabs.filter((tabId) => !reqIdSet.has(tabId));
      const updatedDrafts = { ...state.drafts };
      for (const reqId of reqIdSet) {
        resetDraftForClosedTab(reqId, state.collections, updatedDrafts);
      }

      return {
        tabs: remainingTabs,
        activeTabId: reqIdSet.has(state.activeTabId)
          ? remainingTabs[0] || ''
          : state.activeTabId,
        drafts: updatedDrafts,
      };
    }),

  reorderTabs: (draggedTabId: string, targetTabId: string) =>
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

  revealRequestInSidebar: (reqId: string) =>
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

  setActiveTabId: (activeTabId: string) => set({ activeTabId }),

  updateActiveRequest: (fields: Partial<RequestItem>) =>
    set((state) => {
      const reqId = state.activeTabId;
      const currentDraft = state.drafts[reqId];
      if (!currentDraft) return {};

      return {
        drafts: {
          ...state.drafts,
          [reqId]: {
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
          },
        },
      };
    }),

  addLog: (reqId: string, log: string) =>
    set((state) => {
      const newLog = `[${new Date().toLocaleTimeString()}] ${log}`;
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

      return {
        drafts,
        collections: state.collections.map((collection) => ({
          ...collection,
          requests: collection.requests.map((request) => {
            if (request.id !== reqId) return request;
            const currentResponse = request.response || {
              status: '',
              data: null,
              duration: 0,
              logs: [],
            };

            return {
              ...request,
              response: {
                ...currentResponse,
                logs: [...(currentResponse.logs || []), newLog],
              },
            };
          }),
        })),
      };
    }),

  saveActiveResponse: (name: string) => {
    const state = get();
    const reqId = state.activeTabId;
    const draft = state.drafts[reqId];
    const response = draft?.response;
    const trimmedName = name.trim();

    if (
      !draft ||
      !response ||
      response.data === undefined ||
      response.data === null ||
      !trimmedName
    ) {
      return false;
    }

    const savedResponse: SavedResponse = {
      id: createId('res'),
      name: trimmedName,
      createdAt: new Date().toISOString(),
      response: JSON.parse(
        JSON.stringify(response),
      ) as SavedResponse['response'],
    };

    set((currentState) => {
      const currentDraft = currentState.drafts[reqId];
      if (!currentDraft) return {};

      const updatedDraft: RequestItem = {
        ...currentDraft,
        savedResponses: [...(currentDraft.savedResponses ?? []), savedResponse],
        savedResponsesCollapsed: false,
      };

      return {
        drafts: {
          ...currentState.drafts,
          [reqId]: updatedDraft,
        },
        collections: currentState.collections.map((collection) => ({
          ...collection,
          requests: collection.requests.map((request) =>
            request.id === reqId
              ? {
                  ...request,
                  savedResponses: [
                    ...(request.savedResponses ?? []),
                    savedResponse,
                  ],
                  savedResponsesCollapsed: false,
                }
              : request,
          ),
        })),
      };
    });

    return true;
  },

  toggleSavedResponsesCollapsed: (reqId: string) =>
    set((state) => {
      const drafts = { ...state.drafts };
      const draft = drafts[reqId];
      if (draft) {
        drafts[reqId] = {
          ...draft,
          savedResponsesCollapsed: !draft.savedResponsesCollapsed,
        };
      }

      return {
        drafts,
        collections: state.collections.map((collection) => ({
          ...collection,
          requests: collection.requests.map((request) =>
            request.id === reqId
              ? {
                  ...request,
                  savedResponsesCollapsed: !request.savedResponsesCollapsed,
                }
              : request,
          ),
        })),
      };
    }),

  deleteSavedResponse: (reqId: string, responseId: string) =>
    set((state) => {
      const drafts = { ...state.drafts };
      const draft = drafts[reqId];
      if (draft) {
        drafts[reqId] = {
          ...draft,
          savedResponses: (draft.savedResponses ?? []).filter(
            (savedResponse) => savedResponse.id !== responseId,
          ),
        };
      }

      return {
        drafts,
        collections: state.collections.map((collection) => ({
          ...collection,
          requests: collection.requests.map((request) =>
            request.id === reqId
              ? {
                  ...request,
                  savedResponses: (request.savedResponses ?? []).filter(
                    (savedResponse) => savedResponse.id !== responseId,
                  ),
                }
              : request,
          ),
        })),
      };
    }),

  saveDraft: (reqId: string, colId: string) =>
    set((state) => {
      const draft = state.drafts[reqId];
      if (!draft) return {};

      const isNew = reqId.startsWith('r-new-');
      const savedId = isNew ? createId('r') : reqId;
      const savedReq: RequestItem = { ...draft, id: savedId };
      const updatedCollections = isNew
        ? state.collections.map((collection) =>
            collection.id === colId
              ? { ...collection, requests: [...collection.requests, savedReq] }
              : collection,
          )
        : state.collections.map((collection) => ({
            ...collection,
            requests: collection.requests.map((request) =>
              request.id === reqId ? savedReq : request,
            ),
          }));

      const updatedDrafts = { ...state.drafts };
      const updatedTabs = isNew
        ? state.tabs.map((tabId) => (tabId === reqId ? savedId : tabId))
        : [...state.tabs];
      const activeTabId =
        isNew && state.activeTabId === reqId ? savedId : state.activeTabId;

      if (isNew) {
        delete updatedDrafts[reqId];
      }
      updatedDrafts[savedId] = savedReq;

      return {
        collections: updatedCollections,
        tabs: updatedTabs,
        activeTabId,
        drafts: updatedDrafts,
      };
    }),

  discardDraft: (reqId: string) =>
    set((state) => {
      const isNew = reqId.startsWith('r-new-');
      const updatedDrafts = { ...state.drafts };

      if (isNew) {
        delete updatedDrafts[reqId];
        const remainingTabs = state.tabs.filter((tabId) => tabId !== reqId);

        return {
          tabs: remainingTabs,
          activeTabId:
            state.activeTabId === reqId
              ? remainingTabs[0] || ''
              : state.activeTabId,
          drafts: updatedDrafts,
        };
      }

      const original = findRequestById(state.collections, reqId);
      if (original) {
        updatedDrafts[reqId] = cloneRequest(original);
      }

      return { drafts: updatedDrafts };
    }),

  addNewTab: () =>
    set((state) => {
      const newId = createNewRequestId();
      const newReq = createRequest(newId, 'Untitled Request', 'GET', {
        abi: '',
      });

      return {
        tabs: [...state.tabs, newId],
        activeTabId: newId,
        drafts: {
          ...state.drafts,
          [newId]: newReq,
        },
      };
    }),

  initializeDraft: (reqId: string) =>
    set((state) => {
      if (state.drafts[reqId]) return {};

      const original = findRequestById(state.collections, reqId);
      if (!original) return {};

      return {
        drafts: {
          ...state.drafts,
          [reqId]: cloneRequest(original),
        },
      };
    }),
});
