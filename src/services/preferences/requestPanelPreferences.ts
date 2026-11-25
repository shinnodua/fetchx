import {
  DEFAULT_REQUEST_PANEL_RATIO,
  normalizeRequestPanelRatio,
} from '../../features/workspace/utils/requestPanelLayout';

export const REQUEST_PANEL_STORAGE_KEY = 'fetchx-request-panel-ratio';
export type RequestPanelStorage = Pick<Storage, 'getItem' | 'setItem'>;
export type RequestPanelStorageAccess = () => RequestPanelStorage | undefined;

export const getRequestPanelStorage: RequestPanelStorageAccess = () =>
  typeof localStorage === 'undefined' ? undefined : localStorage;

export function readRequestPanelPreference(
  access: RequestPanelStorageAccess = getRequestPanelStorage,
): number {
  try {
    const saved = access()?.getItem(REQUEST_PANEL_STORAGE_KEY);
    return saved == null
      ? DEFAULT_REQUEST_PANEL_RATIO
      : normalizeRequestPanelRatio(JSON.parse(saved));
  } catch {
    return DEFAULT_REQUEST_PANEL_RATIO;
  }
}

export function saveRequestPanelPreference(
  ratio: number,
  access: RequestPanelStorageAccess = getRequestPanelStorage,
): void {
  try {
    access()?.setItem(
      REQUEST_PANEL_STORAGE_KEY,
      JSON.stringify(normalizeRequestPanelRatio(ratio)),
    );
  } catch {
    // Layout remains usable in memory when browser storage is unavailable.
  }
}
