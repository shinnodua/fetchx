import type { CollectionItem } from '../types';

export function findCollectionIdByName(
  collections: CollectionItem[],
  collectionName: string | undefined,
) {
  const normalizedName = collectionName?.trim().toLocaleLowerCase();
  if (!normalizedName) return undefined;

  return collections.find(
    (collection) =>
      collection.name.trim().toLocaleLowerCase() === normalizedName,
  )?.id;
}
