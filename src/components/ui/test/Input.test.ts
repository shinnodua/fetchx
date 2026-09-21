import { describe, expect, test } from 'bun:test';
import { getInputSizeClasses } from '../Input';

describe('getInputSizeClasses', () => {
  test('matches the compact text-button height for inline action rows', () => {
    expect(getInputSizeClasses('sm')).toBe('h-7');
  });

  test('preserves the default field height', () => {
    expect(getInputSizeClasses('md')).toBe('h-[38px]');
  });
});
