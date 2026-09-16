import { afterEach, describe, expect, test } from 'bun:test';

type Theme = 'light' | 'dark';

const createMemoryStorage = (): Storage => {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
};

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: createMemoryStorage(),
});
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: globalThis.localStorage,
  },
});

const storeModule = await import('..');
const defaultTheme: Theme = storeModule.DEFAULT_THEME;
const useStore = storeModule.useStore;

describe('app store', () => {
  afterEach(() => {
    useStore.getState().setTheme(defaultTheme);
  });

  test('defaults the app theme to light', () => {
    expect(useStore.getState().theme).toBe('light');
  });

  test('toggles theme from the light default', () => {
    useStore.getState().toggleTheme();

    expect(useStore.getState().theme).toBe('dark');
  });
});
