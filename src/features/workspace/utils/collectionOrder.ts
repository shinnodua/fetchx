import type { CollectionItem } from '../types';

export type ReorderPlacement = 'before' | 'after';

const getInsertionIndex = (
  sourceIndex: number,
  targetIndex: number,
  placement: ReorderPlacement,
) => {
  if (placement === 'before') {
    return sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  }

  return sourceIndex < targetIndex ? targetIndex : targetIndex + 1;
};

export const reorderCollections = (
  collections: CollectionItem[],
  sourceCollectionId: string,
  targetCollectionId: string,
  placement: ReorderPlacement = 'before',
) => {
  const sourceIndex = collections.findIndex(
    (collection) => collection.id === sourceCollectionId,
  );
  const targetIndex = collections.findIndex(
    (collection) => collection.id === targetCollectionId,
  );

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return collections;
  }

  const reorderedCollections = [...collections];
  const [sourceCollection] = reorderedCollections.splice(sourceIndex, 1);
  reorderedCollections.splice(
    getInsertionIndex(sourceIndex, targetIndex, placement),
    0,
    sourceCollection,
  );

  return reorderedCollections;
};

export const reorderRequests = (
  collections: CollectionItem[],
  collectionId: string,
  sourceRequestId: string,
  targetRequestId: string,
  placement: ReorderPlacement = 'before',
) => {
  const collection = collections.find((item) => item.id === collectionId);
  if (!collection || sourceRequestId === targetRequestId) return collections;

  const sourceIndex = collection.requests.findIndex(
    (request) => request.id === sourceRequestId,
  );
  const targetIndex = collection.requests.findIndex(
    (request) => request.id === targetRequestId,
  );

  if (sourceIndex === -1 || targetIndex === -1) return collections;

  const reorderedRequests = [...collection.requests];
  const [sourceRequest] = reorderedRequests.splice(sourceIndex, 1);
  reorderedRequests.splice(
    getInsertionIndex(sourceIndex, targetIndex, placement),
    0,
    sourceRequest,
  );

  return collections.map((item) =>
    item.id === collectionId ? { ...item, requests: reorderedRequests } : item,
  );
};
