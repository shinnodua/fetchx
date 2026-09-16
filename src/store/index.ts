import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

export const DEFAULT_THEME: Theme = 'light';

interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'app-storage',
    },
  ),
);

export * from './abi/useAbiStore';
export * from './assistant/useAiAssistantChatStore';
export * from './assistant/useAiAssistantStore';
export * from './cors/useCorsStore';
export * from './environment/useEnvironmentStore';
export * from './rpc/useRpcStore';
export * from './workspace/useWorkspaceStore';
