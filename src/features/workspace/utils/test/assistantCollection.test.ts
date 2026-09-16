import { describe, expect, test } from 'bun:test';

import { findCollectionIdByName } from '../assistantCollection';

describe('assistant collection utilities', () => {
  test('matches collection names case-insensitively after trimming', () => {
    expect(
      findCollectionIdByName(
        [{ id: 'auth', name: 'Authentication', requests: [] }],
        ' authentication ',
      ),
    ).toBe('auth');
  });

  test('does not match an empty collection name', () => {
    expect(findCollectionIdByName([], '   ')).toBeUndefined();
  });
});
