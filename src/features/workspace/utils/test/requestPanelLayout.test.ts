import { describe, expect, test } from 'bun:test';
import {
  getRequestPanelKeyboardRatio,
  getRequestPanelLayout,
  normalizeRequestPanelRatio,
} from '../requestPanelLayout';

describe('request panel layout', () => {
  test('requires both the viewport and the available container to fit', () => {
    const exact = getRequestPanelLayout(664, 1024, 0.9);
    expect(exact.sideBySide).toBe(true);
    expect(exact.ratio).toBe(0.5);
    expect(exact.panelWidth * exact.ratio).toBe(320);
    expect(getRequestPanelLayout(663, 1024, 0.5).sideBySide).toBe(false);
    expect(getRequestPanelLayout(1000, 1023, 0.5).sideBySide).toBe(false);
    expect(getRequestPanelLayout(Number.NaN, 1200, 0.5).sideBySide).toBe(false);
  });

  test('keeps both panels usable and recovers the preferred ratio after expansion', () => {
    for (const width of [664, 700, 900, 1200, 1800]) {
      for (const preference of [0.01, 0.25, 0.5, 0.8, 0.99]) {
        const layout = getRequestPanelLayout(width, 1800, preference);
        expect(layout.panelWidth * layout.ratio).toBeGreaterThanOrEqual(
          320 - 1e-9,
        );
        expect(layout.panelWidth * (1 - layout.ratio)).toBeGreaterThanOrEqual(
          320 - 1e-9,
        );
      }
    }
    const preferred = 0.8;
    expect(getRequestPanelLayout(800, 1800, preferred).ratio).toBeLessThan(
      preferred,
    );
    expect(getRequestPanelLayout(1800, 1800, preferred).ratio).toBe(preferred);
  });

  test('rejects corrupt and out-of-range preferences', () => {
    for (const value of [
      null,
      undefined,
      '0.7',
      {},
      0,
      1,
      -1,
      Infinity,
      Number.NaN,
    ]) {
      expect(normalizeRequestPanelRatio(value)).toBe(0.5);
    }
    expect(normalizeRequestPanelRatio(0.7)).toBe(0.7);
  });

  test('supports keyboard steps, bounds and reset without consuming unrelated shortcuts', () => {
    const layout = getRequestPanelLayout(1224, 1400, 0.6);
    expect(
      getRequestPanelKeyboardRatio({ key: 'ArrowLeft' }, layout),
    ).toBeCloseTo(0.58);
    expect(
      getRequestPanelKeyboardRatio(
        { key: 'ArrowRight', shiftKey: true },
        layout,
      ),
    ).toBeCloseTo(0.7);
    expect(getRequestPanelKeyboardRatio({ key: 'Home' }, layout)).toBe(
      layout.minRatio,
    );
    expect(getRequestPanelKeyboardRatio({ key: 'End' }, layout)).toBe(
      layout.maxRatio,
    );
    expect(getRequestPanelKeyboardRatio({ key: 'Enter' }, layout)).toBe(0.5);
    for (const key of ['Tab', 'Escape', 'a', 'ArrowUp']) {
      expect(getRequestPanelKeyboardRatio({ key }, layout)).toBeNull();
    }
    for (const modifiers of [
      { ctrlKey: true },
      { metaKey: true },
      { altKey: true },
    ]) {
      expect(
        getRequestPanelKeyboardRatio(
          { key: 'ArrowLeft', ...modifiers },
          layout,
        ),
      ).toBeNull();
    }
    const narrow = getRequestPanelLayout(664, 1024, 0.5);
    expect(getRequestPanelKeyboardRatio({ key: 'ArrowLeft' }, narrow)).toBe(
      0.5,
    );
    expect(getRequestPanelKeyboardRatio({ key: 'ArrowRight' }, narrow)).toBe(
      0.5,
    );
    expect(
      getRequestPanelKeyboardRatio(
        { key: 'Enter' },
        getRequestPanelLayout(500, 900, 0.5),
      ),
    ).toBeNull();
  });
});
