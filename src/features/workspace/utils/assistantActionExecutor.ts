import type { CollectionItem, RequestItem } from '../types';
import type { AssistantActionPlan } from './assistantActionPlan';
import { findCollectionIdByName } from './assistantCollection';

export interface AssistantActionWorkspaceState {
  activeTabId: string;
  collections: CollectionItem[];
  drafts: Record<string, RequestItem>;
}

export interface AssistantActionWorkspace {
  addCollection: (name: string) => void;
  addCustomRequest: (request: Partial<RequestItem>) => void;
  getState: () => AssistantActionWorkspaceState;
  openTab: (requestId: string) => void;
  saveDraft: (requestId: string, collectionId: string) => void;
  setCollectionsPanelCollapsed: (collapsed: boolean) => void;
  setSearchTerm: (term: string) => void;
  updateActiveRequest: (fields: Partial<RequestItem>) => void;
}

export interface AssistantActionResult {
  changed: boolean;
  requestNotFound?: boolean;
}

const unchanged: AssistantActionResult = { changed: false };

function ensureCollection(
  workspace: AssistantActionWorkspace,
  collectionName: string,
) {
  const existingCollectionId = findCollectionIdByName(
    workspace.getState().collections,
    collectionName,
  );
  if (existingCollectionId) return existingCollectionId;

  workspace.addCollection(collectionName);
  return findCollectionIdByName(
    workspace.getState().collections,
    collectionName,
  );
}

function showRequestSearch(
  workspace: AssistantActionWorkspace,
  keyword: string,
) {
  workspace.setSearchTerm(keyword);
  workspace.setCollectionsPanelCollapsed(false);
}

export function executeAssistantActionPlan(
  plan: AssistantActionPlan,
  workspace: AssistantActionWorkspace,
): AssistantActionResult {
  switch (plan.kind) {
    case 'create_request': {
      workspace.addCustomRequest(plan.request);
      if (plan.collectionName) {
        const collectionId = ensureCollection(workspace, plan.collectionName);
        if (collectionId) {
          workspace.saveDraft(workspace.getState().activeTabId, collectionId);
        }
      }
      return { changed: true };
    }
    case 'update_request':
      workspace.updateActiveRequest(plan.request);
      return { changed: true };
    case 'create_collection':
      return {
        changed: Boolean(ensureCollection(workspace, plan.collectionName)),
      };
    case 'save_request_to_collection': {
      const collectionId = ensureCollection(workspace, plan.collectionName);
      if (!collectionId) return unchanged;

      workspace.saveDraft(plan.requestId, collectionId);
      return { changed: true };
    }
    case 'filter_requests':
      showRequestSearch(workspace, plan.keyword);
      return { changed: true };
    case 'open_request':
      showRequestSearch(workspace, plan.keyword);
      workspace.openTab(plan.requestId);
      return { changed: true };
    case 'request_not_found':
      showRequestSearch(workspace, plan.keyword);
      return { changed: true, requestNotFound: true };
    default:
      return unchanged;
  }
}
