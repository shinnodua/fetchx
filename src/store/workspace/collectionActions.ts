import type { StateCreator } from 'zustand';
import type { CollectionItem } from '../../features/workspace/types';
import type { WorkspaceState } from './workspaceStoreTypes';
import {
  cloneRequest,
  createAvailableName,
  createCopyName,
  createId,
} from './workspaceStoreUtils';

type WorkspaceSet = Parameters<StateCreator<WorkspaceState>>[0];
type WorkspaceGet = Parameters<StateCreator<WorkspaceState>>[1];

export const createCollectionActions = (
  set: WorkspaceSet,
  _get: WorkspaceGet,
) => ({
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
});
