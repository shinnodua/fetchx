import type { CollectionItem } from '../types';

export const getRequestSaveTargetCollectionId = (
  requestId: string,
  selectedCollectionId: string,
  collections: CollectionItem[],
) =>
  collections.find((collection) =>
    collection.requests.some((request) => request.id === requestId),
  )?.id || selectedCollectionId;
