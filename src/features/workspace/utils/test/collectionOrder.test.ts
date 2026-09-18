import { describe, expect, test } from 'bun:test';

import type { CollectionItem } from '../../types';
import { reorderCollections, reorderRequests } from '../collectionOrder';

const collections: CollectionItem[] = [
  { id: 'c-1', name: 'First', requests: [] },
  { id: 'c-2', name: 'Second', requests: [] },
  { id: 'c-3', name: 'Third', requests: [] },
];

describe('collection ordering', () => {
  test('places a dragged collection at the dropped collection position', () => {
    expect(
      reorderCollections(collections, 'c-3', 'c-1').map(
        (collection) => collection.id,
      ),
    ).toEqual(['c-3', 'c-1', 'c-2']);
  });

  test('places a dragged collection before or after the hovered collection', () => {
    expect(
      reorderCollections(collections, 'c-1', 'c-3', 'before').map(
        (collection) => collection.id,
      ),
    ).toEqual(['c-2', 'c-1', 'c-3']);
    expect(
      reorderCollections(collections, 'c-1', 'c-3', 'after').map(
        (collection) => collection.id,
      ),
    ).toEqual(['c-2', 'c-3', 'c-1']);
  });

  test('leaves collection order unchanged when either drag target is invalid', () => {
    expect(reorderCollections(collections, 'missing', 'c-1')).toBe(collections);
    expect(reorderCollections(collections, 'c-1', 'c-1')).toBe(collections);
  });

  test('reorders requests only inside their collection', () => {
    const collectionsWithRequests: CollectionItem[] = [
      {
        id: 'c-1',
        name: 'First',
        requests: [
          { id: 'r-1', name: 'One', type: 'GET', target: 'https://one.test' },
          { id: 'r-2', name: 'Two', type: 'GET', target: 'https://two.test' },
        ],
      },
      {
        id: 'c-2',
        name: 'Second',
        requests: [
          {
            id: 'r-3',
            name: 'Three',
            type: 'GET',
            target: 'https://three.test',
          },
        ],
      },
    ];

    const result = reorderRequests(
      collectionsWithRequests,
      'c-1',
      'r-2',
      'r-1',
    );

    expect(result[0].requests.map((request) => request.id)).toEqual([
      'r-2',
      'r-1',
    ]);
    expect(result[1]).toBe(collectionsWithRequests[1]);
  });

  test('places a request after the hovered request when requested', () => {
    const collectionsWithRequests: CollectionItem[] = [
      {
        id: 'c-1',
        name: 'First',
        requests: [
          { id: 'r-1', name: 'One', type: 'GET', target: 'https://one.test' },
          { id: 'r-2', name: 'Two', type: 'GET', target: 'https://two.test' },
          {
            id: 'r-3',
            name: 'Three',
            type: 'GET',
            target: 'https://three.test',
          },
        ],
      },
    ];

    expect(
      reorderRequests(
        collectionsWithRequests,
        'c-1',
        'r-1',
        'r-2',
        'after',
      )[0].requests.map((request) => request.id),
    ).toEqual(['r-2', 'r-1', 'r-3']);
  });

  test('keeps request order unchanged for invalid or matching request targets', () => {
    expect(reorderRequests(collections, 'c-1', 'missing', 'r-1')).toBe(
      collections,
    );
    expect(reorderRequests(collections, 'c-1', 'r-1', 'r-1')).toBe(collections);
  });
});
