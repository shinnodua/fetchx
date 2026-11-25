import { describe, expect, test } from 'bun:test';
import { getRequestPanelLayout } from '../../utils/requestPanelLayout';
import { startRequestPanelDrag } from '../requestPanelDrag';

class CaptureTarget extends EventTarget {
  captured: number | null = null;
  releases = 0;
  setPointerCapture(pointerId: number) {
    this.captured = pointerId;
  }
  hasPointerCapture(pointerId: number) {
    return this.captured === pointerId;
  }
  releasePointerCapture() {
    this.captured = null;
    this.releases += 1;
  }
}

function setup(width = 1224, preference = 0.5) {
  const target = new CaptureTarget();
  const events = new EventTarget();
  const style = { cursor: 'text', userSelect: 'auto' };
  const previews: (number | null)[] = [];
  const commits: number[] = [];
  let finishes = 0;
  const cancel = startRequestPanelDrag({
    pointerId: 7,
    startX: 410,
    layout: getRequestPanelLayout(width, 1800, preference),
    target,
    events,
    style,
    onPreview: (value) => previews.push(value),
    onCommit: (value) => commits.push(value),
    onFinish: () => {
      finishes += 1;
    },
  });
  const send = (
    type: string,
    clientX: number,
    pointerId = 7,
    destination = events,
  ) => {
    destination.dispatchEvent(
      Object.assign(new Event(type, { cancelable: true }), {
        clientX,
        pointerId,
      }),
    );
  };
  return {
    target,
    events,
    style,
    previews,
    commits,
    cancel,
    send,
    get finishes() {
      return finishes;
    },
  };
}

describe('request panel drag session', () => {
  test('preserves grab offset, previews continuously and commits final release coordinates', () => {
    const drag = setup();
    expect(drag.target.captured).toBe(7);
    expect(drag.style).toEqual({ cursor: 'col-resize', userSelect: 'none' });
    drag.send('pointermove', 530);
    expect(drag.previews.at(-1)).toBeCloseTo(0.6);
    expect(drag.commits).toEqual([]);
    drag.send('pointerup', 650);
    expect(drag.commits).toEqual([0.7]);
    expect(drag.previews.at(-1)).toBeNull();
    expect(drag.finishes).toBe(1);
    expect(drag.target.releases).toBe(1);
    expect(drag.style).toEqual({ cursor: 'text', userSelect: 'auto' });
    drag.send('pointermove', 200);
    drag.send('pointerup', 200);
    drag.cancel?.();
    expect(drag.finishes).toBe(1);
    expect(drag.commits).toEqual([0.7]);
  });

  test('ignores unrelated pointers, clamps both limits and releases outside the target', () => {
    const drag = setup();
    drag.send('pointermove', 800, 9);
    drag.send('pointerup', 800, 9);
    drag.send('pointercancel', 800, 9);
    expect(drag.previews).toEqual([]);
    expect(drag.finishes).toBe(0);
    drag.send('pointermove', -1000);
    expect(drag.previews.at(-1)).toBeCloseTo(320 / 1200);
    drag.send('pointerup', 9000);
    expect(drag.commits[0]).toBeCloseTo(1 - 320 / 1200);
  });

  test('no-op, returning to start and pushing against a bound do not overwrite preference', () => {
    const clicked = setup(800, 0.9);
    clicked.send('pointerup', 410);
    expect(clicked.commits).toEqual([]);
    const returned = setup();
    returned.send('pointermove', 600);
    returned.send('pointerup', 410);
    expect(returned.commits).toEqual([]);
    const bounded = setup(800, 0.9);
    bounded.send('pointermove', 900);
    bounded.send('pointerup', 1000);
    expect(bounded.commits).toEqual([]);
  });

  test('cancel, blur, lost capture and explicit cleanup discard previews and restore styles', () => {
    for (const reason of [
      'pointercancel',
      'blur',
      'lostpointercapture',
      'cleanup',
    ]) {
      const drag = setup();
      drag.send('pointermove', 600);
      if (reason === 'cleanup') drag.cancel?.();
      else if (reason === 'blur') drag.events.dispatchEvent(new Event('blur'));
      else
        drag.send(
          reason,
          600,
          7,
          reason === 'lostpointercapture' ? drag.target : drag.events,
        );
      expect(drag.commits).toEqual([]);
      expect(drag.previews.at(-1)).toBeNull();
      expect(drag.finishes).toBe(1);
      expect(drag.style).toEqual({ cursor: 'text', userSelect: 'auto' });
      drag.send('pointerup', 800);
      expect(drag.commits).toEqual([]);
    }
  });

  test('does not begin if panels cannot fit or capture fails', () => {
    const target = new CaptureTarget();
    const style = { cursor: '', userSelect: '' };
    const options = {
      pointerId: 1,
      startX: 0,
      target,
      style,
      events: new EventTarget(),
      onPreview: () => {},
      onCommit: () => {},
      onFinish: () => {},
    };
    expect(
      startRequestPanelDrag({
        ...options,
        layout: getRequestPanelLayout(400, 900, 0.5),
      }),
    ).toBeNull();
    target.setPointerCapture = () => {
      throw new Error('capture unavailable');
    };
    expect(
      startRequestPanelDrag({
        ...options,
        layout: getRequestPanelLayout(1224, 1400, 0.5),
      }),
    ).toBeNull();
    expect(style).toEqual({ cursor: '', userSelect: '' });
  });
});
