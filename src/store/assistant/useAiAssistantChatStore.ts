import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AiAssistantChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isPending?: boolean;
}

const initialChatHistory: AiAssistantChatMessage[] = [
  {
    id: 'assistant-welcome',
    role: 'system',
    content:
      'Connect a local agent, then describe the request you want to create or update.',
  },
];

interface AiAssistantChatState {
  messages: AiAssistantChatMessage[];
  updateMessages: (
    updater: (messages: AiAssistantChatMessage[]) => AiAssistantChatMessage[],
  ) => void;
  clearChatHistory: () => void;
}

export const useAiAssistantChatStore = create<AiAssistantChatState>()(
  persist(
    (set) => ({
      messages: initialChatHistory,
      updateMessages: (updater) =>
        set((state) => ({ messages: updater(state.messages) })),
      clearChatHistory: () => set({ messages: [] }),
    }),
    {
      name: 'call3-ai-assistant-chat-storage',
      partialize: (state) => ({
        messages: state.messages.filter((message) => !message.isPending),
      }),
    },
  ),
);
