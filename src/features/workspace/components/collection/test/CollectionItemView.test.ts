import { describe, expect, test } from 'bun:test';
import { collectionRequestRowClassName } from '../CollectionItemView';

describe('CollectionItemView', () => {
  test('uses compact request rows in the collection sidebar', () => {
    expect(collectionRequestRowClassName).toContain('gap-1.5');
    expect(collectionRequestRowClassName).toContain('px-1.5');
    expect(collectionRequestRowClassName).toContain('py-0.5');
    expect(collectionRequestRowClassName).toContain('rounded-lg');
    expect(collectionRequestRowClassName).not.toContain('py-1');
  });
});
