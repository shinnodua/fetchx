import type { CollectionItem, RequestItem } from '../types';
import { createCollectionsSnapshot } from './workspaceRepositoryFormat';

export type WorkspaceChangeStatus = 'added' | 'modified' | 'unchanged';

const sortObjectKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (typeof value !== 'object' || value === null) return value;

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortObjectKeys(entry)]),
  );
};

const hasSameContent = <T>(current: T, baseline: T) =>
  JSON.stringify(sortObjectKeys(current)) ===
  JSON.stringify(sortObjectKeys(baseline));

export const getCollectionChangeStatus = (
  collection: CollectionItem,
  baselineCollections?: CollectionItem[],
): WorkspaceChangeStatus => {
  if (!baselineCollections) return 'unchanged';

  const baseline = baselineCollections.find(
    (item) => item.id === collection.id,
  );
  if (!baseline) return 'added';

  const [currentSnapshot] = createCollectionsSnapshot([collection]);
  const [baselineSnapshot] = createCollectionsSnapshot([baseline]);
  return hasSameContent(currentSnapshot, baselineSnapshot)
    ? 'unchanged'
    : 'modified';
};

export const getRequestChangeStatus = (
  request: RequestItem,
  collectionId: string,
  baselineCollections?: CollectionItem[],
): WorkspaceChangeStatus => {
  if (!baselineCollections) return 'unchanged';

  const baselineCollection = baselineCollections.find(
    (collection) => collection.id === collectionId,
  );
  if (!baselineCollection) return 'added';

  const baselineRequest = baselineCollection.requests.find(
    (item) => item.id === request.id,
  );
  if (!baselineRequest) return 'added';

  const [currentSnapshot] = createCollectionsSnapshot([
    { id: collectionId, name: '', requests: [request] },
  ]);
  const [baselineSnapshot] = createCollectionsSnapshot([
    { id: collectionId, name: '', requests: [baselineRequest] },
  ]);
  return hasSameContent(
    currentSnapshot?.requests[0],
    baselineSnapshot?.requests[0],
  )
    ? 'unchanged'
    : 'modified';
};
