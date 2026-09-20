import type { CollectionItem, RequestItem } from '../types';

export const WORKSPACE_MANIFEST_PATH = '.fetchx/workspace.json';
export const WORKSPACE_COLLECTIONS_DIRECTORY = '.fetchx/collections';

export interface WorkspaceManifestCollection {
  id: string;
  name: string;
  path: string;
}

export interface WorkspaceManifest {
  version: 1;
  updatedAt: string;
  collections: WorkspaceManifestCollection[];
}

const cleanRequest = (request: RequestItem): RequestItem => ({
  ...request,
  args: request.args ?? {},
  headers: request.headers ?? [],
  queryParams: request.queryParams ?? [],
  body: request.body ?? '',
  response: null,
  savedResponses: request.savedResponses ?? [],
  savedResponsesCollapsed: request.savedResponsesCollapsed ?? false,
});

export const createCollectionsSnapshot = (collections: CollectionItem[]) =>
  collections.map((collection) => ({
    ...collection,
    requests: collection.requests.map(cleanRequest),
  }));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const getCollectionRepositoryPath = (collectionId: string) =>
  `${WORKSPACE_COLLECTIONS_DIRECTORY}/${collectionId}.json`;

export const createWorkspaceManifest = (
  collections: CollectionItem[],
): WorkspaceManifest => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  collections: collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    path: getCollectionRepositoryPath(collection.id),
  })),
});

export const serializeCollectionForRepository = (collection: CollectionItem) =>
  JSON.stringify(
    {
      id: collection.id,
      name: collection.name,
      requests: collection.requests.map(cleanRequest),
    },
    null,
    2,
  );

export const getCollectionsDigest = (collections: CollectionItem[]) =>
  JSON.stringify(createCollectionsSnapshot(collections));

export const getSyncedCollectionsSnapshot = (
  collections: CollectionItem[],
  lastSyncedCollectionsDigest?: string,
) => {
  if (
    !lastSyncedCollectionsDigest ||
    getCollectionsDigest(collections) !== lastSyncedCollectionsDigest
  ) {
    return undefined;
  }

  return createCollectionsSnapshot(collections);
};

export const parseWorkspaceManifest = (content: string): WorkspaceManifest => {
  const value: unknown = JSON.parse(content);
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    typeof value.updatedAt !== 'string' ||
    !Array.isArray(value.collections)
  ) {
    throw new Error('The FetchX workspace manifest is invalid.');
  }

  const collections = value.collections.map((collection) => {
    if (
      !isRecord(collection) ||
      typeof collection.id !== 'string' ||
      typeof collection.name !== 'string' ||
      typeof collection.path !== 'string' ||
      !collection.path.startsWith(`${WORKSPACE_COLLECTIONS_DIRECTORY}/`)
    ) {
      throw new Error(
        'The FetchX workspace manifest contains an invalid collection.',
      );
    }
    return { id: collection.id, name: collection.name, path: collection.path };
  });

  return { version: 1, updatedAt: value.updatedAt, collections };
};

export const parseRepositoryCollection = (content: string): CollectionItem => {
  const value: unknown = JSON.parse(content);
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    !Array.isArray(value.requests)
  ) {
    throw new Error('A FetchX collection file is invalid.');
  }

  return {
    id: value.id,
    name: value.name,
    requests: value.requests.map((request) =>
      cleanRequest(request as RequestItem),
    ),
  };
};
