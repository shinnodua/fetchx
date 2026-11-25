import type { RequestPanelLayout } from '../utils/requestPanelLayout';

interface CaptureTarget extends EventTarget {
  setPointerCapture: (pointerId: number) => void;
  hasPointerCapture: (pointerId: number) => boolean;
  releasePointerCapture: (pointerId: number) => void;
}

interface RequestPanelDragOptions {
  pointerId: number;
  startX: number;
  layout: RequestPanelLayout;
  target: CaptureTarget;
  events: EventTarget;
  style: Pick<CSSStyleDeclaration, 'cursor' | 'userSelect'>;
  onPreview: (ratio: number | null) => void;
  onCommit: (ratio: number) => void;
  onFinish: () => void;
}

export function startRequestPanelDrag({
  pointerId,
  startX,
  layout,
  target,
  events,
  style,
  onPreview,
  onCommit,
  onFinish,
}: RequestPanelDragOptions): (() => void) | null {
  if (!layout.sideBySide) return null;
  try {
    target.setPointerCapture(pointerId);
  } catch {
    return null;
  }
  let active = true;
  let ratio = layout.ratio;
  const previousCursor = style.cursor;
  const previousSelection = style.userSelect;
  style.cursor = 'col-resize';
  style.userSelect = 'none';

  const update = (event: PointerEvent) => {
    if (event.pointerId !== pointerId || !Number.isFinite(event.clientX))
      return;
    ratio = Math.max(
      layout.minRatio,
      Math.min(
        layout.maxRatio,
        layout.ratio + (event.clientX - startX) / layout.panelWidth,
      ),
    );
    onPreview(ratio);
    event.preventDefault();
  };

  const finish = (commit: boolean) => {
    if (!active) return;
    active = false;
    events.removeEventListener('pointermove', move);
    events.removeEventListener('pointerup', up);
    events.removeEventListener('pointercancel', cancelPointer);
    events.removeEventListener('blur', cancel);
    target.removeEventListener('lostpointercapture', cancelPointer);
    style.cursor = previousCursor;
    style.userSelect = previousSelection;
    onPreview(null);
    onFinish();
    try {
      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId);
      }
    } catch {
      // Capture can already be gone after a browser interruption.
    }
    if (commit && Math.abs(ratio - layout.ratio) > Number.EPSILON) {
      onCommit(ratio);
    }
  };

  const move: EventListener = (event) => update(event as PointerEvent);
  const up: EventListener = (event) => {
    const pointer = event as PointerEvent;
    if (pointer.pointerId !== pointerId) return;
    update(pointer);
    finish(true);
  };
  const cancelPointer: EventListener = (event) => {
    if ((event as PointerEvent).pointerId === pointerId) finish(false);
  };
  const cancel = () => finish(false);
  events.addEventListener('pointermove', move);
  events.addEventListener('pointerup', up);
  events.addEventListener('pointercancel', cancelPointer);
  events.addEventListener('blur', cancel);
  target.addEventListener('lostpointercapture', cancelPointer);
  return cancel;
}
