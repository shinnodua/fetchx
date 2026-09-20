import { describe, expect, test } from 'bun:test';
import {
  createWorkspaceManifest,
  getCollectionsDigest,
  getSyncedCollectionsSnapshot,
  parseRepositoryCollection,
  parseWorkspaceManifest,
  serializeCollectionForRepository,
  WORKSPACE_MANIFEST_PATH,
} from '../workspaceRepositoryFormat';

const collection = {
  id: 'collection-1',
  name: 'Payments',
  requests: [
    {
      id: 'request-1',
      name: 'Create payment',
      type: 'POST',
      target: 'https://example.com/payments',
      response: {
        status: '200',
        data: { secret: 'never commit' },
        duration: 4,
        logs: ['log'],
      },
    },
  ],
};

describe('workspaceRepositoryFormat', () => {
  test('uses a separate stable file for every collection', () => {
    const manifest = createWorkspaceManifest([collection]);
    expect(WORKSPACE_MANIFEST_PATH).toBe('.fetchx/workspace.json');
    expect(manifest.collections[0]?.path).toBe(
      '.fetchx/collections/collection-1.json',
    );
  });

  test('removes live responses when serializing a collection', () => {
    const parsed = parseRepositoryCollection(
      serializeCollectionForRepository(collection),
    );
    expect(parsed.requests[0]?.response).toBeNull();
  });

  test('rejects collection files outside the FetchX directory', () => {
    expect(() =>
      parseWorkspaceManifest(
        '{"version":1,"updatedAt":"2026-01-01","collections":[{"id":"a","name":"A","path":"data/a.json"}]}',
      ),
    ).toThrow('invalid collection');
  });

  test('computes stable collections digest and detects modifications', () => {
    const digest1 = getCollectionsDigest([collection]);

    // Modifying transient response does not change digest
    const collectionWithDifferentResponse = {
      ...collection,
      requests: [
        {
          ...collection.requests[0],
          response: { status: '500', data: 'error', duration: 100 },
        },
      ],
    };
    expect(getCollectionsDigest([collectionWithDifferentResponse])).toBe(
      digest1,
    );

    // Modifying request content changes digest
    const modifiedCollection = {
      ...collection,
      requests: [
        {
          ...collection.requests[0],
          target: 'https://example.com/updated-target',
        },
      ],
    };
    expect(getCollectionsDigest([modifiedCollection])).not.toBe(digest1);
  });

  test('restores an item-level snapshot only when collections match GitHub', () => {
    const digest = getCollectionsDigest([collection]);

    expect(getSyncedCollectionsSnapshot([collection], digest)).toEqual([
      expect.objectContaining({ id: 'collection-1' }),
    ]);
    expect(
      getSyncedCollectionsSnapshot(
        [{ ...collection, name: 'Changed payments' }],
        digest,
      ),
    ).toBeUndefined();
  });
});
