import type { StateCreator } from 'zustand';
import type {
  RequestItem,
  SavedResponse,
} from '../../features/workspace/types';
import type { WorkspaceState } from './workspaceStoreTypes';
import { createId } from './workspaceStoreUtils';

type WorkspaceSet = Parameters<StateCreator<WorkspaceState>>[0];
type WorkspaceGet = Parameters<StateCreator<WorkspaceState>>[1];

export const createResponseActions = (
  set: WorkspaceSet,
  get: WorkspaceGet,
) => ({
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
});
