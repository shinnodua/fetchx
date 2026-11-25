import { create } from 'zustand';
import { normalizeRequestPanelRatio } from '../../features/workspace/utils/requestPanelLayout';
import {
  getRequestPanelStorage,
  type RequestPanelStorageAccess,
  readRequestPanelPreference,
  saveRequestPanelPreference,
} from '../../services/preferences/requestPanelPreferences';

interface RequestPanelLayoutState {
  preferredRatio: number;
  setPreferredRatio: (ratio: number) => void;
}

export const createRequestPanelLayoutStore = (
  access: RequestPanelStorageAccess = getRequestPanelStorage,
) =>
  create<RequestPanelLayoutState>()((set, get) => ({
    preferredRatio: readRequestPanelPreference(access),
    setPreferredRatio: (value) => {
      const preferredRatio = normalizeRequestPanelRatio(value);
      if (preferredRatio === get().preferredRatio) return;
      set({ preferredRatio });
      saveRequestPanelPreference(preferredRatio, access);
    },
  }));

export const useRequestPanelLayoutStore = createRequestPanelLayoutStore();
