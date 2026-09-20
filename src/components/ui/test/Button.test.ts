import { describe, expect, test } from 'bun:test';
import { getButtonSizeClasses } from '../Button';

describe('getButtonSizeClasses', () => {
  test('provides a consistent target for small icon-only buttons', () => {
    expect(getButtonSizeClasses('sm', true)).toBe('h-8 w-8 p-0');
  });

  test('keeps text-button sizing unchanged', () => {
    expect(getButtonSizeClasses('sm')).toBe('h-7 px-3 text-xs');
  });
});
