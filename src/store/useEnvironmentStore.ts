import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Environment,
  EnvironmentVariable,
  SensitiveCryptoConfig,
} from '../features/workspace/types';
import {
  createSensitiveCryptoConfig,
  decryptSensitiveValue,
  deriveSensitiveCryptoKey,
  encryptSensitiveValue,
  validateSensitivePin,
} from '../features/workspace/utils/sensitiveCrypto';
import { createId } from './workspaceStoreUtils';

interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string | null;
  manageEnvOpen: boolean;
  sensitiveCryptoConfig: SensitiveCryptoConfig | null;
  sensitiveCryptoError: string | null;
  sensitiveUnlocked: boolean;

  setManageEnvOpen: (open: boolean) => void;
  setActiveEnvironmentId: (id: string | null) => void;
  addEnvironment: (name: string) => void;
  deleteEnvironment: (id: string) => void;
  renameEnvironment: (id: string, name: string) => void;
  setSensitivePin: (pin: string) => Promise<boolean>;
  unlockSensitiveValues: (pin: string) => Promise<boolean>;
  lockSensitiveValues: () => void;
  clearSensitiveCryptoError: () => void;
  updateEnvironmentVariables: (
    id: string,
    variables: EnvironmentVariable[],
  ) => void;
}

let sensitiveCryptoKey: CryptoKey | null = null;

function normalizeVariables(
  variables: EnvironmentVariable[],
): EnvironmentVariable[] {
  return variables.map((variable) => ({
    ...variable,
    encryptedValue: variable.sensitive
      ? (variable.encryptedValue ?? null)
      : null,
    sensitive: variable.sensitive ?? false,
  }));
}

function stripSensitivePlaintext(environments: Environment[]): Environment[] {
  return environments.map((environment) => ({
    ...environment,
    variables: environment.variables.map((variable) =>
      variable.sensitive
        ? {
            ...variable,
            value: '',
            encryptedValue: variable.encryptedValue ?? null,
          }
        : { ...variable, encryptedValue: null },
    ),
  }));
}

async function encryptSensitiveVariables(
  variables: EnvironmentVariable[],
  key: CryptoKey,
): Promise<EnvironmentVariable[]> {
  return Promise.all(
    normalizeVariables(variables).map(async (variable) => {
      if (!variable.sensitive) {
        return { ...variable, encryptedValue: null };
      }

      if (!variable.value) {
        return variable;
      }

      return {
        ...variable,
        encryptedValue: await encryptSensitiveValue(variable.value, key),
      };
    }),
  );
}

export const useEnvironmentStore = create<EnvironmentState>()(
  persist(
    (set, get) => ({
      environments: [],
      activeEnvironmentId: null,
      manageEnvOpen: false,
      sensitiveCryptoConfig: null,
      sensitiveCryptoError: null,
      sensitiveUnlocked: false,

      setManageEnvOpen: (manageEnvOpen) => set({ manageEnvOpen }),
      setActiveEnvironmentId: (activeEnvironmentId) =>
        set({ activeEnvironmentId }),
      clearSensitiveCryptoError: () => set({ sensitiveCryptoError: null }),

      addEnvironment: (name) =>
        set((state) => {
          const trimmedName = name.trim();
          const newEnv: Environment = {
            id: createId('env'),
            name: trimmedName || 'New Environment',
            variables: [
              {
                id: createId('v'),
                key: '',
                value: '',
                enabled: true,
                sensitive: false,
                encryptedValue: null,
              },
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

      setSensitivePin: async (pin) => {
        if (!validateSensitivePin(pin)) {
          set({ sensitiveCryptoError: 'Pincode must be at least 6 numbers.' });
          return false;
        }

        try {
          const sensitiveCryptoConfig = createSensitiveCryptoConfig();
          sensitiveCryptoKey = await deriveSensitiveCryptoKey(
            pin,
            sensitiveCryptoConfig,
          );
          const environments = await Promise.all(
            get().environments.map(async (environment) => ({
              ...environment,
              variables: await encryptSensitiveVariables(
                environment.variables,
                sensitiveCryptoKey as CryptoKey,
              ),
            })),
          );

          set({
            environments,
            sensitiveCryptoConfig,
            sensitiveCryptoError: null,
            sensitiveUnlocked: true,
          });
          return true;
        } catch (error) {
          set({
            sensitiveCryptoError:
              error instanceof Error
                ? error.message
                : 'Could not set sensitive pincode.',
          });
          return false;
        }
      },

      unlockSensitiveValues: async (pin) => {
        const { sensitiveCryptoConfig } = get();
        if (!sensitiveCryptoConfig) {
          return get().setSensitivePin(pin);
        }

        try {
          sensitiveCryptoKey = await deriveSensitiveCryptoKey(
            pin,
            sensitiveCryptoConfig,
          );
          const environments = await Promise.all(
            get().environments.map(async (environment) => ({
              ...environment,
              variables: await Promise.all(
                normalizeVariables(environment.variables).map(
                  async (variable) => {
                    if (!variable.sensitive || !variable.encryptedValue) {
                      return variable;
                    }

                    return {
                      ...variable,
                      value: await decryptSensitiveValue(
                        variable.encryptedValue,
                        sensitiveCryptoKey as CryptoKey,
                      ),
                    };
                  },
                ),
              ),
            })),
          );

          set({
            environments,
            sensitiveCryptoError: null,
            sensitiveUnlocked: true,
          });
          return true;
        } catch {
          sensitiveCryptoKey = null;
          set({
            sensitiveCryptoError: 'Could not unlock sensitive values.',
            sensitiveUnlocked: false,
          });
          return false;
        }
      },

      lockSensitiveValues: () => {
        sensitiveCryptoKey = null;
        set((state) => ({
          environments: stripSensitivePlaintext(state.environments),
          sensitiveUnlocked: false,
        }));
      },

      updateEnvironmentVariables: (id, variables) => {
        const normalizedVariables = normalizeVariables(variables);
        set((state) => ({
          environments: state.environments.map((e) =>
            e.id === id ? { ...e, variables: normalizedVariables } : e,
          ),
        }));

        if (!sensitiveCryptoKey) return;

        void encryptSensitiveVariables(normalizedVariables, sensitiveCryptoKey)
          .then((encryptedVariables) => {
            set((state) => ({
              environments: state.environments.map((environment) =>
                environment.id === id
                  ? { ...environment, variables: encryptedVariables }
                  : environment,
              ),
              sensitiveCryptoError: null,
            }));
          })
          .catch(() => {
            set({
              sensitiveCryptoError: 'Could not encrypt sensitive values.',
            });
          });
      },
    }),
    {
      name: 'call3-environment-storage',
      partialize: (state) => ({
        activeEnvironmentId: state.activeEnvironmentId,
        environments: stripSensitivePlaintext(state.environments),
        manageEnvOpen: false,
        sensitiveCryptoConfig: state.sensitiveCryptoConfig,
        sensitiveCryptoError: null,
        sensitiveUnlocked: false,
      }),
      onRehydrateStorage: () => () => {
        sensitiveCryptoKey = null;
        useEnvironmentStore.setState({
          sensitiveCryptoError: null,
          sensitiveUnlocked: false,
        });
      },
    },
  ),
);
