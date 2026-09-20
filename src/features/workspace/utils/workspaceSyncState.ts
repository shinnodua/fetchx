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

export interface WorkspaceSyncConflict {
  baseCommitSha?: string;
  remoteCommitSha?: string;
  entries: WorkspaceSyncConflictEntry[];
  mergedCollections: CollectionItem[];
  remoteCollections: CollectionItem[];
}

export interface WorkspaceSyncConflictEntry {
  id: string;
  kind: 'collection';
  label: string;
  local: CollectionItem | null;
  remote: CollectionItem | null;
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

const hasSameCollections = (
  first: CollectionItem[] | undefined,
  second: CollectionItem[] | undefined,
) => getCollectionsDigest(first ?? []) === getCollectionsDigest(second ?? []);

export const createWorkspaceSyncConflict = (
  baselineCollections: CollectionItem[],
  localCollections: CollectionItem[],
  remoteCollections: CollectionItem[],
  baseCommitSha?: string,
  remoteCommitSha?: string,
): WorkspaceSyncConflict => {
  const baseById = new Map(
    baselineCollections.map((collection) => [collection.id, collection]),
  );
  const localById = new Map(
    localCollections.map((collection) => [collection.id, collection]),
  );
  const remoteById = new Map(
    remoteCollections.map((collection) => [collection.id, collection]),
  );
  const collectionIds = new Set([
    ...baseById.keys(),
    ...localById.keys(),
    ...remoteById.keys(),
  ]);
  const entries: WorkspaceSyncConflictEntry[] = [];
  const mergedById = new Map<string, CollectionItem>();

  for (const id of collectionIds) {
    const base = baseById.get(id);
    const local = localById.get(id);
    const remote = remoteById.get(id);
    const localChanged = !hasSameCollections(
      base ? [base] : undefined,
      local ? [local] : undefined,
    );
    const remoteChanged = !hasSameCollections(
      base ? [base] : undefined,
      remote ? [remote] : undefined,
    );

    if (
      localChanged &&
      remoteChanged &&
      !hasSameCollections(
        local ? [local] : undefined,
        remote ? [remote] : undefined,
      )
    ) {
      entries.push({
        id,
        kind: 'collection',
        label:
          local?.name || remote?.name || base?.name || 'Deleted collection',
        local: local ?? null,
        remote: remote ?? null,
      });
      continue;
    }

    const chosen = localChanged ? local : remote;
    if (chosen) mergedById.set(id, chosen);
  }

  const mergedCollections = [
    ...remoteCollections.filter((collection) => mergedById.has(collection.id)),
    ...localCollections.filter(
      (collection) =>
        mergedById.has(collection.id) && !remoteById.has(collection.id),
    ),
  ].map((collection) => mergedById.get(collection.id) ?? collection);

  return {
    baseCommitSha,
    remoteCommitSha,
    entries,
    mergedCollections,
    remoteCollections,
  };
};

export const applyWorkspaceConflictResolutions = (
  conflict: WorkspaceSyncConflict,
  resolutions: Record<string, 'local' | 'remote'>,
) => {
  const mergedById = new Map(
    conflict.mergedCollections.map((collection) => [collection.id, collection]),
  );
  for (const entry of conflict.entries) {
    const chosen =
      resolutions[entry.id] === 'remote' ? entry.remote : entry.local;
    if (chosen) mergedById.set(entry.id, chosen);
    else mergedById.delete(entry.id);
  }

  const remoteCollectionIds = new Set(
    conflict.remoteCollections.map((collection) => collection.id),
  );
  return [
    ...conflict.remoteCollections.filter((collection) =>
      mergedById.has(collection.id),
    ),
    ...conflict.mergedCollections.filter(
      (collection) =>
        mergedById.has(collection.id) &&
        !remoteCollectionIds.has(collection.id),
    ),
    ...conflict.entries
      .filter(
        (entry) =>
          resolutions[entry.id] !== 'remote' &&
          entry.local &&
          !remoteCollectionIds.has(entry.id),
      )
      .map((entry) => entry.local as CollectionItem),
  ].map((collection) => mergedById.get(collection.id) ?? collection);
};
