import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AiAssistantState {
  selectedAgentId: string;
  selectedAgentModels: Record<string, string>;
  setSelectedAgentId: (agentId: string) => void;
  setSelectedAgentModel: (agentId: string, modelId: string) => void;
}

export const useAiAssistantStore = create<AiAssistantState>()(
  persist(
    (set) => ({
      selectedAgentId: '',
      selectedAgentModels: {},
      setSelectedAgentId: (selectedAgentId) => set({ selectedAgentId }),
      setSelectedAgentModel: (agentId, modelId) =>
        set((state) => ({
          selectedAgentModels: {
            ...state.selectedAgentModels,
            [agentId]: modelId,
          },
        })),
    }),
    {
      name: 'call3-ai-assistant-storage',
      partialize: (state) => ({
        selectedAgentId: state.selectedAgentId,
        selectedAgentModels: state.selectedAgentModels,
      }),
    },
  ),
);
