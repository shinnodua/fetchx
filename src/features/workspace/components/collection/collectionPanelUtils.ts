import type { CollectionItem } from '../../types';
import type { ContextMenuTarget } from './collectionPanelTypes';

export function filterCollections(
  collections: CollectionItem[],
  searchTerm: string,
): CollectionItem[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  if (!normalizedSearchTerm) return collections;

  return collections
    .map((collection) => {
      const requests = collection.requests.filter(
        (request) =>
          request.name.toLowerCase().includes(normalizedSearchTerm) ||
          request.target.toLowerCase().includes(normalizedSearchTerm) ||
          (request.savedResponses ?? []).some((savedResponse) =>
            savedResponse.name.toLowerCase().includes(normalizedSearchTerm),
          ),
      );
      return collection.name.toLowerCase().includes(normalizedSearchTerm) ||
        requests.length > 0
        ? { ...collection, requests }
        : null;
    })
    .filter((collection): collection is CollectionItem => collection !== null);
}

export function getContextMenuPosition({
  clientX,
  clientY,
  panelHeight,
  panelLeft,
  panelWidth,
}: {
  clientX: number;
  clientY: number;
  panelHeight?: number;
  panelLeft?: number;
  panelWidth: number;
}): Pick<ContextMenuTarget, 'x' | 'y'> {
  const x = panelLeft === undefined ? clientX : clientX - panelLeft;
  const y = panelHeight === undefined ? clientY : clientY;

  return {
    x: Math.max(8, Math.min(x, panelWidth - 168)),
    y:
      panelHeight === undefined
        ? y
        : Math.max(8, Math.min(y, panelHeight - 144)),
  };
}
