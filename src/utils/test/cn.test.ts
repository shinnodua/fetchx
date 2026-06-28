import { describe, expect, test } from 'bun:test';

import { cn } from '../cn';

describe('cn', () => {
  test('joins truthy classes and skips falsy values', () => {
    expect(cn('base', false, null, undefined, '', 'active', 0, 'final')).toBe(
      'base active final',
    );
  });
});
