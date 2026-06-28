import { describe, expect, test } from 'bun:test';

import { getApiErrorMessage } from '../errors';

describe('API error utilities', () => {
  test('extracts string error messages from API responses', () => {
    expect(getApiErrorMessage({ error: { message: 'Invalid request' } })).toBe(
      'Invalid request',
    );
  });

  test('returns null for non-matching values', () => {
    expect(getApiErrorMessage({ error: { message: 123 } })).toBeNull();
    expect(getApiErrorMessage(null)).toBeNull();
    expect(getApiErrorMessage('Invalid request')).toBeNull();
  });
});
