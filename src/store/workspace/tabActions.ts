import type { StateCreator } from 'zustand';
import type { WorkspaceState } from './workspaceStoreTypes';
import {
  cloneRequest,
  createNewRequestId,
  createRequest,
  findRequestById,
  resetDraftForClosedTab,
} from './workspaceStoreUtils';

type WorkspaceSet = Parameters<StateCreator<WorkspaceState>>[0];
type WorkspaceGet = Parameters<StateCreator<WorkspaceState>>[1];

export const createTabActions = (set: WorkspaceSet, _get: WorkspaceGet) => ({
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
});
