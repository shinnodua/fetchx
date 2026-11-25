import { describe, expect, test } from 'bun:test';
import { createRequestPanelLayoutStore } from '../../../store/layout/useRequestPanelLayoutStore';
import {
  REQUEST_PANEL_STORAGE_KEY,
  readRequestPanelPreference,
  saveRequestPanelPreference,
} from '../requestPanelPreferences';

describe('request panel preference persistence', () => {
  test('retains one shared ratio across recreated stores using only its own key', () => {
    const values = new Map<string, string>();
    const access = () => ({
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    });
    const first = createRequestPanelLayoutStore(access);
    first.getState().setPreferredRatio(0.7);
    expect(
      createRequestPanelLayoutStore(access).getState().preferredRatio,
    ).toBe(0.7);
    expect([...values.keys()]).toEqual([REQUEST_PANEL_STORAGE_KEY]);
    first.getState().setPreferredRatio(0.5);
    expect(
      createRequestPanelLayoutStore(access).getState().preferredRatio,
    ).toBe(0.5);
  });

  test('falls back for missing, corrupt, invalid and unavailable storage', () => {
    for (const saved of [
      null,
      '{',
      'null',
      '{}',
      '"0.7"',
      '0',
      '1',
      '-4',
      '1e999',
    ]) {
      expect(
        readRequestPanelPreference(() => ({
          getItem: () => saved,
          setItem: () => {},
        })),
      ).toBe(0.5);
    }
    expect(readRequestPanelPreference(() => undefined)).toBe(0.5);
    expect(
      readRequestPanelPreference(() => {
        throw new Error('blocked access');
      }),
    ).toBe(0.5);
    expect(
      readRequestPanelPreference(() => ({
        getItem: () => {
          throw new Error('blocked read');
        },
        setItem: () => {},
      })),
    ).toBe(0.5);
  });

  test('failed writes retain in-memory updates and never escape into the request workflow', () => {
    const access = () => ({
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    });
    const store = createRequestPanelLayoutStore(access);
    expect(() => store.getState().setPreferredRatio(0.65)).not.toThrow();
    expect(store.getState().preferredRatio).toBe(0.65);
    expect(() =>
      saveRequestPanelPreference(0.7, () => {
        throw new Error('blocked');
      }),
    ).not.toThrow();
    store.getState().setPreferredRatio(Number.NaN);
    expect(store.getState().preferredRatio).toBe(0.5);
  });

  test('does not write when the preferred value has not changed', () => {
    let writes = 0;
    const store = createRequestPanelLayoutStore(() => ({
      getItem: () => '0.8',
      setItem: () => {
        writes += 1;
      },
    }));
    store.getState().setPreferredRatio(0.8);
    expect(writes).toBe(0);
    store.getState().setPreferredRatio(0.6);
    expect(writes).toBe(1);
  });
});
