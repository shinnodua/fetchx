import { describe, expect, test } from 'bun:test';
import { reorderTabIds } from '../tabOrder';

describe('reorderTabIds', () => {
  test('places a tab before or after the hovered tab', () => {
    expect(reorderTabIds(['a', 'b', 'c'], 'a', 'c', 'before')).toEqual([
      'b',
      'a',
      'c',
    ]);
    expect(reorderTabIds(['a', 'b', 'c'], 'a', 'c', 'after')).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  test('keeps the tab order for invalid or matching ids', () => {
    const tabs = ['a', 'b'];
    expect(reorderTabIds(tabs, 'missing', 'a')).toBe(tabs);
    expect(reorderTabIds(tabs, 'a', 'a')).toBe(tabs);
  });
});
