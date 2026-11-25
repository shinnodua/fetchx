export const DEFAULT_REQUEST_PANEL_RATIO = 0.5;
export const REQUEST_PANEL_MIN_WIDTH = 320;
export const REQUEST_PANEL_DIVIDER_WIDTH = 24;
export const REQUEST_PANEL_VIEWPORT_MIN_WIDTH = 1024;

export const normalizeRequestPanelRatio = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 1
    ? value
    : DEFAULT_REQUEST_PANEL_RATIO;

export function getRequestPanelLayout(
  containerWidth: number,
  viewportWidth: number,
  preferredRatio: number,
) {
  const panelWidth = containerWidth - REQUEST_PANEL_DIVIDER_WIDTH;
  const sideBySide =
    Number.isFinite(containerWidth) &&
    Number.isFinite(viewportWidth) &&
    viewportWidth >= REQUEST_PANEL_VIEWPORT_MIN_WIDTH &&
    panelWidth >= REQUEST_PANEL_MIN_WIDTH * 2;
  const minRatio = sideBySide ? REQUEST_PANEL_MIN_WIDTH / panelWidth : 0.5;
  const maxRatio = 1 - minRatio;
  const ratio = Math.max(
    minRatio,
    Math.min(maxRatio, normalizeRequestPanelRatio(preferredRatio)),
  );
  return { sideBySide, panelWidth, minRatio, maxRatio, ratio };
}

export type RequestPanelLayout = ReturnType<typeof getRequestPanelLayout>;

interface ResizeKey {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

export function getRequestPanelKeyboardRatio(
  event: ResizeKey,
  layout: RequestPanelLayout,
): number | null {
  if (!layout.sideBySide || event.ctrlKey || event.metaKey || event.altKey) {
    return null;
  }
  const step = event.shiftKey ? 0.1 : 0.02;
  switch (event.key) {
    case 'ArrowLeft':
      return Math.max(layout.minRatio, layout.ratio - step);
    case 'ArrowRight':
      return Math.min(layout.maxRatio, layout.ratio + step);
    case 'Home':
      return layout.minRatio;
    case 'End':
      return layout.maxRatio;
    case 'Enter':
      return DEFAULT_REQUEST_PANEL_RATIO;
    default:
      return null;
  }
}
