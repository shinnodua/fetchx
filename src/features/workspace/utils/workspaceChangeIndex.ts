import type { CollectionItem } from '../types';
import { getCollectionsDigest } from './workspaceRepositoryFormat';

export type WorkspaceChangeKind = 'added' | 'modified';

export interface WorkspaceChangeIndex {
  collections: Record<string, WorkspaceChangeKind>;
  requests: Record<string, WorkspaceChangeKind>;
  removedCollectionIds: string[];
  removedRequestIds: string[];
}

export interface WorkspaceRemoteState {
  aheadBy: number | null;
  headSha?: string;
  status: 'unknown' | 'synced' | 'updates-available' | 'conflict';
}

export interface GitHubWorkspaceSyncState {
  changeIndex: WorkspaceChangeIndex;
  remote: WorkspaceRemoteState;
}

export const createEmptyWorkspaceChangeIndex = (): WorkspaceChangeIndex => ({
  collections: {},
  requests: {},
  removedCollectionIds: [],
  removedRequestIds: [],
});

export const createWorkspaceChangeIndex = (
  baselineCollections: CollectionItem[],
  collections: CollectionItem[],
): WorkspaceChangeIndex => {
  const baselineById = new Map(
    baselineCollections.map((collection) => [collection.id, collection]),
  );
  const currentById = new Map(
    collections.map((collection) => [collection.id, collection]),
  );
  const changeIndex = createEmptyWorkspaceChangeIndex();

  for (const collection of collections) {
    const baseline = baselineById.get(collection.id);
    if (!baseline) {
      changeIndex.collections[collection.id] = 'added';
      for (const request of collection.requests) {
        changeIndex.requests[request.id] = 'added';
      }
      continue;
    }

    if (collection.name !== baseline.name) {
      changeIndex.collections[collection.id] = 'modified';
    }

    const baselineRequests = new Map(
      baseline.requests.map((request) => [request.id, request]),
    );
    const currentRequestIds = new Set(
      collection.requests.map((request) => request.id),
    );
    for (const request of collection.requests) {
      const baselineRequest = baselineRequests.get(request.id);
      if (!baselineRequest) {
        changeIndex.requests[request.id] = 'added';
        changeIndex.collections[collection.id] ??= 'modified';
      } else if (
        getCollectionsDigest([
          { id: collection.id, name: '', requests: [request] },
        ]) !==
        getCollectionsDigest([
          { id: collection.id, name: '', requests: [baselineRequest] },
        ])
      ) {
        changeIndex.requests[request.id] = 'modified';
        changeIndex.collections[collection.id] ??= 'modified';
      }
    }
    for (const request of baseline.requests) {
      if (!currentRequestIds.has(request.id)) {
        changeIndex.removedRequestIds.push(request.id);
        changeIndex.collections[collection.id] ??= 'modified';
      }
    }
  }

  for (const collection of baselineCollections) {
    if (!currentById.has(collection.id)) {
      changeIndex.removedCollectionIds.push(collection.id);
      changeIndex.removedRequestIds.push(
        ...collection.requests.map((request) => request.id),
      );
    }
  }

  return changeIndex;
};

export const getWorkspaceChangeCount = (changeIndex: WorkspaceChangeIndex) =>
  Object.keys(changeIndex.collections).length +
  changeIndex.removedCollectionIds.length;
