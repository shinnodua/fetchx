import { describe, expect, test } from 'bun:test';
import type { CollectionItem } from '../../../features/workspace/types';
import type { WorkspaceManifest } from '../../../features/workspace/utils/workspaceRepositoryFormat';
import {
  getCollectionCommitMessage,
  getWorkspaceCommitMessage,
} from '../githubCommitMessage';

const collection = (requests: CollectionItem['requests']): CollectionItem => ({
  id: 'collection-1',
  name: 'API',
  requests,
});

describe('GitHub workspace commit messages', () => {
  test('describes collection deletion and rename actions', () => {
    const previous: WorkspaceManifest = {
      version: 1,
      updatedAt: 'before',
      collections: [
        { id: 'collection-1', name: 'API', path: 'collections/api.json' },
      ],
    };
    expect(
      getWorkspaceCommitMessage(previous, {
        ...previous,
        updatedAt: 'after',
        collections: [],
      }),
    ).toBe('chore(fetchx): delete collection "API"');
    expect(
      getWorkspaceCommitMessage(previous, {
        ...previous,
        updatedAt: 'after',
        collections: [{ ...previous.collections[0], name: 'Public API' }],
      }),
    ).toBe('chore(fetchx): rename collection "API" to "Public API"');
  });

  test('describes request deletion, rename, and update actions', () => {
    const previous = collection([
      { id: 'request-1', name: 'List users', type: 'GET', target: '/users' },
    ]);
    expect(getCollectionCommitMessage(previous, collection([]))).toBe(
      'chore(fetchx): delete request "List users"',
    );
    expect(
      getCollectionCommitMessage(
        previous,
        collection([
          {
            ...previous.requests[0],
            name: 'Get users',
          },
        ]),
      ),
    ).toBe('chore(fetchx): rename request "List users" to "Get users"');
    expect(
      getCollectionCommitMessage(
        previous,
        collection([{ ...previous.requests[0], target: '/v2/users' }]),
      ),
    ).toBe('chore(fetchx): update request "List users"');
  });
});
