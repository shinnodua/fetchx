import type { StateCreator } from 'zustand';
import type { RequestItem } from '../../features/workspace/types';
import type { WorkspaceState } from './workspaceStoreTypes';
import {
  cloneRequest,
  createId,
  createRequest,
  findRequestById,
} from './workspaceStoreUtils';

type WorkspaceSet = Parameters<StateCreator<WorkspaceState>>[0];
type WorkspaceGet = Parameters<StateCreator<WorkspaceState>>[1];

export const createDraftActions = (set: WorkspaceSet, _get: WorkspaceGet) => ({
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

  discardDraftChanges: (reqId: string) =>
    set((state) => {
      const isNew = reqId.startsWith('r-new-');
      const original = isNew
        ? createRequest(reqId, 'Untitled Request', 'GET', { abi: '' })
        : findRequestById(state.collections, reqId);

      if (!original) return {};

      return {
        drafts: {
          ...state.drafts,
          [reqId]: cloneRequest(original),
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
