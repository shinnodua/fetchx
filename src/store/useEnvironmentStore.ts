import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Environment,
  EnvironmentVariable,
} from '../features/workspace/types';
import { createId } from './workspaceStoreUtils';

interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string | null;
  manageEnvOpen: boolean;

  setManageEnvOpen: (open: boolean) => void;
  setActiveEnvironmentId: (id: string | null) => void;
  addEnvironment: (name: string) => void;
  deleteEnvironment: (id: string) => void;
  renameEnvironment: (id: string, name: string) => void;
  updateEnvironmentVariables: (
    id: string,
    variables: EnvironmentVariable[],
  ) => void;
}

export const useEnvironmentStore = create<EnvironmentState>()(
  persist(
    (set) => ({
      environments: [],
      activeEnvironmentId: null,
      manageEnvOpen: false,

      setManageEnvOpen: (manageEnvOpen) => set({ manageEnvOpen }),
      setActiveEnvironmentId: (activeEnvironmentId) =>
        set({ activeEnvironmentId }),

      addEnvironment: (name) =>
        set((state) => {
          const trimmedName = name.trim();
          const newEnv: Environment = {
            id: createId('env'),
            name: trimmedName || 'New Environment',
            variables: [
              { id: createId('v'), key: '', value: '', enabled: true },
            ],
          };
          const updatedEnvironments = [...state.environments, newEnv];
          return {
            environments: updatedEnvironments,
            activeEnvironmentId: state.activeEnvironmentId || newEnv.id,
          };
        }),

      deleteEnvironment: (id) =>
        set((state) => {
          const filtered = state.environments.filter((e) => e.id !== id);
          return {
            environments: filtered,
            activeEnvironmentId:
              state.activeEnvironmentId === id
                ? filtered[0]?.id || null
                : state.activeEnvironmentId,
          };
        }),

      renameEnvironment: (id, name) =>
        set((state) => ({
          environments: state.environments.map((e) =>
            e.id === id ? { ...e, name: name.trim() || 'Environment' } : e,
          ),
        })),

      updateEnvironmentVariables: (id, variables) =>
        set((state) => ({
          environments: state.environments.map((e) =>
            e.id === id ? { ...e, variables } : e,
          ),
        })),
    }),
    {
      name: 'call3-environment-storage',
    },
  ),
);
