import { describe, expect, test } from 'bun:test';
import { collectionDragOverlayClassName } from '../CollectionDragOverlay';
import { canDrop } from '../CollectionReorderDialog';

describe('CollectionReorderDialog', () => {
  test('allows compatible pointer drag targets only', () => {
    expect(
      canDrop(
        { type: 'collection', collectionId: 'collection-1' },
        { type: 'collection', collectionId: 'collection-2' },
      ),
    ).toBe(true);
    expect(
      canDrop(
        {
          type: 'request',
          collectionId: 'collection-1',
          requestId: 'request-1',
        },
        {
          type: 'request',
          collectionId: 'collection-1',
          requestId: 'request-2',
        },
      ),
    ).toBe(true);
    expect(
      canDrop(
        {
          type: 'request',
          collectionId: 'collection-1',
          requestId: 'request-1',
        },
        {
          type: 'request',
          collectionId: 'collection-2',
          requestId: 'request-2',
        },
      ),
    ).toBe(false);
  });

  test('keeps the drag overlay visible without blocking pointer target detection', () => {
    expect(collectionDragOverlayClassName).toContain('pointer-events-none');
    expect(collectionDragOverlayClassName).toContain('fixed');
  });
});
