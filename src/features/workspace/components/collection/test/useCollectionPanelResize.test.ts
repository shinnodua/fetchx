import { describe, expect, test } from 'bun:test';
import {
  clampCollectionPanelWidth,
  useCollectionPanelResize,
} from '../useCollectionPanelResize';

describe('useCollectionPanelResize', () => {
  test('is defined as a hook function', () => {
    expect(typeof useCollectionPanelResize).toBe('function');
  });

  test('clamps panel width within safe boundaries', () => {
    expect(clampCollectionPanelWidth(100)).toBe(200);
    expect(clampCollectionPanelWidth(600)).toBe(500);
    expect(clampCollectionPanelWidth(350)).toBe(350);
    expect(clampCollectionPanelWidth(Number.NaN)).toBe(320);
    expect(clampCollectionPanelWidth(0)).toBe(320);
    expect(clampCollectionPanelWidth(-50)).toBe(320);
  });
});
