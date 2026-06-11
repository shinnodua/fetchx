import type { StateCreator } from 'zustand';
import type { RequestItem } from '../../features/workspace/types';
import type { WorkspaceState } from './workspaceStoreTypes';
import {
  cloneRequest,
  createCopyName,
  createDefaultAbi,
  createId,
  createNewRequestId,
  createRequest,
} from './workspaceStoreUtils';

type WorkspaceSet = Parameters<StateCreator<WorkspaceState>>[0];
type WorkspaceGet = Parameters<StateCreator<WorkspaceState>>[1];

export const createRequestActions = (
  set: WorkspaceSet,
  _get: WorkspaceGet,
) => ({
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
});
