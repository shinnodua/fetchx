import { describe, expect, test } from 'bun:test';
import { headerActionButtonClassName } from '../AppHeader';

describe('AppHeader', () => {
  test('leaves bottom breathing room below header action buttons', () => {
    expect(headerActionButtonClassName).toContain('mb-1');
    expect(headerActionButtonClassName).toContain('h-8');
  });
});
