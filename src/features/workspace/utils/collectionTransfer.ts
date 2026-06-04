import type { CollectionItem, RequestItem } from '../types';

export interface CollectionsExportPayload {
  version: 1;
  exportedAt: string;
  collections: CollectionItem[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isKeyValueArray = (
  value: unknown,
): value is { key: string; value: string }[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      isRecord(item) &&
      typeof item.key === 'string' &&
      typeof item.value === 'string',
  );

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) &&
  Object.values(value).every((item) => typeof item === 'string');

const normalizeRequest = (request: RequestItem): RequestItem => ({
  ...request,
  args: request.args ?? {},
  headers: request.headers ?? [],
  queryParams: request.queryParams ?? [],
  body: request.body ?? '',
  response: null,
});

const parseRequest = (value: unknown): RequestItem | null => {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.type !== 'string' ||
    typeof value.target !== 'string'
  ) {
    return null;
  }

  if (value.args !== undefined && !isStringRecord(value.args)) return null;
  if (value.headers !== undefined && !isKeyValueArray(value.headers)) {
    return null;
  }
  if (value.queryParams !== undefined && !isKeyValueArray(value.queryParams)) {
    return null;
  }

  return normalizeRequest({
    id: value.id,
    name: value.name,
    type: value.type,
    target: value.target,
    abi: typeof value.abi === 'string' ? value.abi : '',
    functionName:
      typeof value.functionName === 'string' ? value.functionName : '',
    network: typeof value.network === 'string' ? value.network : '1',
    args: value.args === undefined ? {} : value.args,
    headers: value.headers === undefined ? [] : value.headers,
    queryParams: value.queryParams === undefined ? [] : value.queryParams,
    body: typeof value.body === 'string' ? value.body : '',
    response: null,
  });
};

const parseCollection = (value: unknown): CollectionItem | null => {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    !Array.isArray(value.requests)
  ) {
    return null;
  }

  const requests = value.requests.map(parseRequest);
  if (requests.some((request) => request === null)) return null;

  return {
    id: value.id,
    name: value.name,
    requests: requests as RequestItem[],
  };
};

export const createCollectionsExportPayload = (
  collections: CollectionItem[],
): CollectionsExportPayload => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  collections: collections.map((collection) => ({
    ...collection,
    requests: collection.requests.map(normalizeRequest),
  })),
});

export const parseCollectionsImportPayload = (
  content: string,
): CollectionItem[] => {
  const parsed: unknown = JSON.parse(content);
  const rawCollections =
    isRecord(parsed) && Array.isArray(parsed.collections)
      ? parsed.collections
      : parsed;

  if (!Array.isArray(rawCollections)) {
    throw new Error('Import file must contain a collections array.');
  }

  const collections = rawCollections.map(parseCollection);
  if (collections.some((collection) => collection === null)) {
    throw new Error('Import file contains invalid collection data.');
  }

  return collections as CollectionItem[];
};
