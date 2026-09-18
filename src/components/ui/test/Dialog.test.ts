import { describe, expect, test } from 'bun:test';
import { dialogLayerClassName } from '../Dialog';

describe('Dialog', () => {
  test('renders above floating workspace controls', () => {
    expect(dialogLayerClassName).toBe('z-[70]');
  });
});
