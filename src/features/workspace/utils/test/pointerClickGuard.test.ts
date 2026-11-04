import { describe, expect, test } from 'bun:test';
import { createPointerClickGuard } from '../pointerClickGuard';

describe('collection row click and drag handling', () => {
  test('allows a row click with small pointer jitter', () => {
    const guard = createPointerClickGuard();
    guard.start(10, 20);
    expect(guard.move(12, 22)).toBe(false);
    expect(guard.consumeClick()).toBe(false);
  });

  test('suppresses the release click after dragging, even back to the origin', () => {
    const guard = createPointerClickGuard();
    guard.start(10, 20);
    expect(guard.move(10, 25)).toBe(true);
    expect(guard.move(10, 20)).toBe(true);
    expect(guard.consumeClick()).toBe(true);
    expect(guard.consumeClick()).toBe(false);
  });

  test('detects horizontal and diagonal drags', () => {
    for (const [x, y] of [
      [5, 0],
      [3, 4],
      [-5, 0],
    ]) {
      const guard = createPointerClickGuard();
      guard.start(0, 0);
      expect(guard.move(x, y)).toBe(true);
      expect(guard.consumeClick()).toBe(true);
    }
  });

  test('allows the next click after a canceled drag', () => {
    const guard = createPointerClickGuard();
    guard.start(0, 0);
    guard.cancel();
    expect(guard.consumeClick()).toBe(true);
    guard.start(0, 0);
    expect(guard.consumeClick()).toBe(false);
  });

  test('allows keyboard activation without a pointer gesture', () => {
    expect(createPointerClickGuard().consumeClick()).toBe(false);
  });
});
