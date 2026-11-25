import type { KeyboardEvent, PointerEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRequestPanelLayoutStore } from '../../../store/layout/useRequestPanelLayoutStore';
import {
  DEFAULT_REQUEST_PANEL_RATIO,
  getRequestPanelKeyboardRatio,
  getRequestPanelLayout,
} from '../utils/requestPanelLayout';
import { startRequestPanelDrag } from './requestPanelDrag';

export function useRequestPanelResize() {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRegionRef = useRef<HTMLElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  const cancelDragRef = useRef<(() => void) | null>(null);
  const [size, setSize] = useState({ width: 0, viewport: 0 });
  const [preview, setPreview] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const preferredRatio = useRequestPanelLayoutStore(
    (state) => state.preferredRatio,
  );
  const setPreferredRatio = useRequestPanelLayoutStore(
    (state) => state.setPreferredRatio,
  );
  const layout = getRequestPanelLayout(
    size.width,
    size.viewport,
    preview ?? preferredRatio,
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let previousWidth = 0;
    let previousViewport = 0;
    const measure = () => {
      const width = container.clientWidth;
      const viewport = window.innerWidth;
      if (width === previousWidth && viewport === previousViewport) return;
      cancelDragRef.current?.();
      const next = getRequestPanelLayout(
        width,
        viewport,
        DEFAULT_REQUEST_PANEL_RATIO,
      );
      if (
        !next.sideBySide &&
        (document.activeElement === dividerRef.current ||
          document.activeElement === resetRef.current)
      ) {
        requestRegionRef.current?.focus({ preventScroll: true });
      }
      previousWidth = width;
      previousViewport = viewport;
      setSize({ width, viewport });
    };
    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measure);
    observer?.observe(container);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      cancelDragRef.current?.();
    };
  }, []);

  const reset = useCallback(() => {
    cancelDragRef.current?.();
    setPreferredRatio(DEFAULT_REQUEST_PANEL_RATIO);
  }, [setPreferredRatio]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const baseLayout = getRequestPanelLayout(
      size.width,
      size.viewport,
      preferredRatio,
    );
    const next = getRequestPanelKeyboardRatio(event, baseLayout);
    if (next === null) return;
    event.preventDefault();
    cancelDragRef.current?.();
    if (event.key === 'Enter' || next !== baseLayout.ratio)
      setPreferredRatio(next);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (
      !layout.sideBySide ||
      !event.isPrimary ||
      event.button !== 0 ||
      cancelDragRef.current
    )
      return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    const cancel = startRequestPanelDrag({
      pointerId: event.pointerId,
      startX: event.clientX,
      layout,
      target: event.currentTarget,
      events: window,
      style: document.body.style,
      onPreview: setPreview,
      onCommit: setPreferredRatio,
      onFinish: () => {
        cancelDragRef.current = null;
        setIsDragging(false);
      },
    });
    if (cancel) {
      cancelDragRef.current = cancel;
      setIsDragging(true);
    }
  };

  return {
    containerRef,
    requestRegionRef,
    dividerRef,
    resetRef,
    layout,
    isDragging,
    reset,
    onKeyDown,
    onPointerDown,
  };
}
