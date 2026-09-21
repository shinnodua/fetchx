import type { CollectionItem } from '../types';
import { getCollectionsDigest } from './workspaceRepositoryFormat';

export * from './workspaceChangeIndex';

export interface WorkspaceSyncConflict {
  baseCommitSha?: string;
  remoteCommitSha?: string;
  entries: WorkspaceSyncConflictBlock[];
  mergedCollections: CollectionItem[];
  remoteCollections: CollectionItem[];
}

export interface WorkspaceConflictValue {
  exists: boolean;
  value?: unknown;
}

export interface WorkspaceSyncConflictBlock {
  id: string;
  collectionId: string;
  kind: 'value' | 'edit-delete';
  label: string;
  path: string[];
  base: WorkspaceConflictValue;
  local: WorkspaceConflictValue;
  remote: WorkspaceConflictValue;
}

export type WorkspaceConflictChoice = 'local' | 'remote' | 'custom';

export interface WorkspaceConflictResolution {
  choice: WorkspaceConflictChoice;
  custom?: WorkspaceConflictValue;
}

const hasSameCollections = (
  first: CollectionItem[] | undefined,
  second: CollectionItem[] | undefined,
) => getCollectionsDigest(first ?? []) === getCollectionsDigest(second ?? []);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const valuesEqual = (
  first: WorkspaceConflictValue,
  second: WorkspaceConflictValue,
) =>
  first.exists === second.exists &&
  (!first.exists ||
    JSON.stringify(first.value) === JSON.stringify(second.value));

const present = (value: unknown): WorkspaceConflictValue => ({
  exists: true,
  value,
});
const missing = (): WorkspaceConflictValue => ({ exists: false });

interface MergeContext {
  blocks: WorkspaceSyncConflictBlock[];
  collectionId: string;
  label: string;
}

const mergeRequests = (
  base: unknown[],
  local: unknown[],
  remote: unknown[],
  path: string[],
  context: MergeContext,
) => {
  const toMap = (items: unknown[]) =>
    new Map(
      items
        .filter(
          (item): item is Record<string, unknown> =>
            isRecord(item) && typeof item.id === 'string',
        )
        .map((item) => [item.id as string, item]),
    );
  const baseById = toMap(base);
  const localById = toMap(local);
  const remoteById = toMap(remote);
  const ids = new Set([
    ...remoteById.keys(),
    ...localById.keys(),
    ...baseById.keys(),
  ]);
  const merged = new Map<string, unknown>();

  for (const id of ids) {
    const value = mergeValue(
      baseById.has(id) ? present(baseById.get(id)) : missing(),
      localById.has(id) ? present(localById.get(id)) : missing(),
      remoteById.has(id) ? present(remoteById.get(id)) : missing(),
      [...path, id],
      context,
    );
    if (value.exists) merged.set(id, value.value);
  }

  return [
    ...remote.filter(
      (item) =>
        isRecord(item) && typeof item.id === 'string' && merged.has(item.id),
    ),
    ...local.filter(
      (item) =>
        isRecord(item) &&
        typeof item.id === 'string' &&
        merged.has(item.id) &&
        !remoteById.has(item.id),
    ),
  ].map((item) => (isRecord(item) ? merged.get(item.id as string) : item));
};

const mergeValue = (
  base: WorkspaceConflictValue,
  local: WorkspaceConflictValue,
  remote: WorkspaceConflictValue,
  path: string[],
  context: MergeContext,
): WorkspaceConflictValue => {
  if (valuesEqual(local, remote)) return local;
  if (valuesEqual(base, local)) return remote;
  if (valuesEqual(base, remote)) return local;

  if (
    base.exists &&
    local.exists &&
    remote.exists &&
    isRecord(base.value) &&
    isRecord(local.value) &&
    isRecord(remote.value)
  ) {
    const result: Record<string, unknown> = {};
    const keys = new Set([
      ...Object.keys(remote.value),
      ...Object.keys(local.value),
      ...Object.keys(base.value),
    ]);
    for (const key of keys) {
      const merged = mergeValue(
        Object.hasOwn(base.value, key) ? present(base.value[key]) : missing(),
        Object.hasOwn(local.value, key) ? present(local.value[key]) : missing(),
        Object.hasOwn(remote.value, key)
          ? present(remote.value[key])
          : missing(),
        [...path, key],
        context,
      );
      if (merged.exists) result[key] = merged.value;
    }
    return present(result);
  }

  if (
    path.at(-1) === 'requests' &&
    base.exists &&
    local.exists &&
    remote.exists &&
    Array.isArray(base.value) &&
    Array.isArray(local.value) &&
    Array.isArray(remote.value)
  ) {
    return present(
      mergeRequests(base.value, local.value, remote.value, path, context),
    );
  }

  const id = `${context.collectionId}:${path.join('/') || '$'}`;
  context.blocks.push({
    id,
    collectionId: context.collectionId,
    kind: !local.exists || !remote.exists ? 'edit-delete' : 'value',
    label: context.label,
    path,
    base,
    local,
    remote,
  });
  return present({ __fetchxConflict: id });
};

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
  const entries: WorkspaceSyncConflictBlock[] = [];
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

    const label =
      local?.name || remote?.name || base?.name || 'Deleted collection';
    const chosen =
      localChanged && remoteChanged
        ? mergeValue(
            base ? present(base) : missing(),
            local ? present(local) : missing(),
            remote ? present(remote) : missing(),
            [],
            { blocks: entries, collectionId: id, label },
          )
        : localChanged
          ? local
            ? present(local)
            : missing()
          : remote
            ? present(remote)
            : missing();
    if (chosen.exists) mergedById.set(id, chosen.value as CollectionItem);
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
  resolutions: Record<string, WorkspaceConflictResolution>,
) => {
  const selected = new Map<string, WorkspaceConflictValue>();
  for (const block of conflict.entries) {
    const resolution = resolutions[block.id];
    if (!resolution) throw new Error(`Conflict ${block.id} is unresolved.`);
    selected.set(
      block.id,
      resolution.choice === 'custom'
        ? (resolution.custom ?? missing())
        : resolution.choice === 'remote'
          ? block.remote
          : block.local,
    );
  }

  const resolveNode = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map(resolveNode).filter((item) => item !== undefined);
    }
    if (!isRecord(value)) return value;
    if (typeof value.__fetchxConflict === 'string') {
      const replacement = selected.get(value.__fetchxConflict);
      return replacement?.exists ? replacement.value : undefined;
    }
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, resolveNode(item)] as const)
        .filter(([, item]) => item !== undefined),
    );
  };

  const resolved = conflict.mergedCollections
    .map((collection) => resolveNode(collection))
    .filter((collection) => collection !== undefined);
  if (
    !resolved.every(
      (collection): collection is CollectionItem =>
        isRecord(collection) &&
        typeof collection.id === 'string' &&
        typeof collection.name === 'string' &&
        Array.isArray(collection.requests) &&
        collection.requests.every(
          (request) =>
            isRecord(request) &&
            typeof request.id === 'string' &&
            typeof request.name === 'string' &&
            typeof request.type === 'string' &&
            typeof request.target === 'string',
        ),
    )
  ) {
    throw new Error('The conflict resolution does not form a valid workspace.');
  }
  return resolved;
};
