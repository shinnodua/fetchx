import type { CollectionItem, RequestItem } from '../types';

const normalized = (value: string) => value.trim().toLocaleLowerCase();

export function findRequestByKeyword(
  collections: CollectionItem[],
  keyword: string | undefined,
): RequestItem | undefined {
  const query = normalized(keyword || '');
  if (!query) return undefined;

  const requests = collections.flatMap((collection) => collection.requests);
  return (
    requests.find((request) => normalized(request.name) === query) ||
    requests.find((request) => normalized(request.target) === query) ||
    requests.find((request) => normalized(request.name).includes(query)) ||
    requests.find((request) => normalized(request.target).includes(query))
  );
}
