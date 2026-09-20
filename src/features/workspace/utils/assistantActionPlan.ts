import type { CollectionItem, RequestItem } from '../types';
import type {
  AiAgentStructuredResponse,
  AiRequestDraft,
} from './aiAgentRequest';
import { findRequestByKeyword } from './assistantRequestSearch';

export interface AssistantWorkspaceSnapshot {
  activeRequest: RequestItem | null;
  collections: CollectionItem[];
}

export type AssistantActionPlan =
  | {
      kind: 'create_request';
      collectionName?: string;
      request: AiRequestDraft;
    }
  | { kind: 'update_request'; request: AiRequestDraft }
  | { kind: 'create_collection'; collectionName: string }
  | {
      kind: 'save_request_to_collection';
      collectionName: string;
      requestId: string;
    }
  | { kind: 'filter_requests'; keyword: string }
  | { kind: 'open_request'; keyword: string; requestId: string }
  | { kind: 'request_not_found'; keyword: string }
  | { kind: 'none' };

export interface AssistantActionPlanResult {
  plan: AssistantActionPlan;
  createdRequest: boolean;
}

const noAction: AssistantActionPlanResult = {
  plan: { kind: 'none' },
  createdRequest: false,
};

export function createAssistantActionPlan(
  response: AiAgentStructuredResponse,
  snapshot: AssistantWorkspaceSnapshot,
): AssistantActionPlanResult {
  const collectionName = response.collection?.name;

  switch (response.action) {
    case 'create_request':
      return response.request
        ? {
            plan: {
              kind: 'create_request',
              request: response.request,
              collectionName,
            },
            createdRequest: true,
          }
        : noAction;
    case 'update_request':
      return response.request && snapshot.activeRequest
        ? {
            plan: { kind: 'update_request', request: response.request },
            createdRequest: false,
          }
        : noAction;
    case 'create_collection':
      return collectionName
        ? {
            plan: { kind: 'create_collection', collectionName },
            createdRequest: false,
          }
        : noAction;
    case 'create_collection_with_request':
      return collectionName && response.request
        ? {
            plan: {
              kind: 'create_request',
              request: response.request,
              collectionName,
            },
            createdRequest: true,
          }
        : noAction;
    case 'save_request_to_collection':
      return collectionName && snapshot.activeRequest
        ? {
            plan: {
              kind: 'save_request_to_collection',
              collectionName,
              requestId: snapshot.activeRequest.id,
            },
            createdRequest: false,
          }
        : noAction;
    case 'search_requests': {
      const keyword = response.search?.keyword;
      return keyword
        ? {
            plan: { kind: 'filter_requests', keyword },
            createdRequest: false,
          }
        : noAction;
    }
    case 'open_request':
    case 'run_request': {
      const keyword = response.search?.keyword;
      if (!keyword) return noAction;

      const request = findRequestByKeyword(snapshot.collections, keyword);
      return request
        ? {
            plan: { kind: 'open_request', keyword, requestId: request.id },
            createdRequest: false,
          }
        : {
            plan: { kind: 'request_not_found', keyword },
            createdRequest: false,
          };
    }
    default:
      return noAction;
  }
}
