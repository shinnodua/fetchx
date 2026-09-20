import type { CollectionItem } from '../../features/workspace/types';
import type { WorkspaceManifest } from '../../features/workspace/utils/workspaceRepositoryFormat';

const prefix = (action: string) => `chore(fetchx): ${action}`;

export const getWorkspaceCommitMessage = (
  previous: WorkspaceManifest | null,
  current: WorkspaceManifest,
) => {
  if (!previous) return prefix('initialize workspace');

  const previousById = new Map(
    previous.collections.map((collection) => [collection.id, collection]),
  );
  const currentById = new Map(
    current.collections.map((collection) => [collection.id, collection]),
  );
  const removed = previous.collections.filter(
    (collection) => !currentById.has(collection.id),
  );
  const added = current.collections.filter(
    (collection) => !previousById.has(collection.id),
  );
  const renamed = current.collections.filter((collection) => {
    const prior = previousById.get(collection.id);
    return prior && prior.name !== collection.name;
  });

  if (removed.length === 1 && added.length === 0 && renamed.length === 0) {
    return prefix(`delete collection "${removed[0].name}"`);
  }
  if (added.length === 1 && removed.length === 0 && renamed.length === 0) {
    return prefix(`add collection "${added[0].name}"`);
  }
  if (renamed.length === 1 && added.length === 0 && removed.length === 0) {
    const collection = renamed[0];
    return prefix(
      `rename collection "${previousById.get(collection.id)?.name}" to "${collection.name}"`,
    );
  }
  return prefix('update workspace collections');
};

export const getCollectionCommitMessage = (
  previous: CollectionItem | null,
  current: CollectionItem,
) => {
  if (!previous) return prefix(`add collection "${current.name}"`);
  if (previous.name !== current.name) {
    return prefix(`rename collection "${previous.name}" to "${current.name}"`);
  }

  const previousById = new Map(
    previous.requests.map((request) => [request.id, request]),
  );
  const currentById = new Map(
    current.requests.map((request) => [request.id, request]),
  );
  const removed = previous.requests.filter(
    (request) => !currentById.has(request.id),
  );
  const added = current.requests.filter(
    (request) => !previousById.has(request.id),
  );
  const renamed = current.requests.filter((request) => {
    const prior = previousById.get(request.id);
    return prior && prior.name !== request.name;
  });
  const updated = current.requests.filter((request) => {
    const prior = previousById.get(request.id);
    return prior && JSON.stringify(prior) !== JSON.stringify(request);
  });

  if (removed.length === 1 && added.length === 0 && updated.length === 0) {
    return prefix(`delete request "${removed[0].name}"`);
  }
  if (added.length === 1 && removed.length === 0 && updated.length === 0) {
    return prefix(`add request "${added[0].name}"`);
  }
  if (renamed.length === 1 && added.length === 0 && removed.length === 0) {
    const request = renamed[0];
    return prefix(
      `rename request "${previousById.get(request.id)?.name}" to "${request.name}"`,
    );
  }
  if (updated.length === 1 && added.length === 0 && removed.length === 0) {
    return prefix(`update request "${updated[0].name}"`);
  }
  return prefix(`update collection "${current.name}"`);
};
