import { afterEach, describe, expect, test } from 'bun:test';

import { useAiAssistantChatStore } from '../useAiAssistantChatStore';

describe('AI assistant chat store', () => {
  afterEach(() => {
    useAiAssistantChatStore.getState().clearChatHistory();
  });

  test('keeps chat messages until the history is cleared', () => {
    useAiAssistantChatStore.getState().appendMessage({
      id: 'user-1',
      role: 'user',
      content: 'Create a request.',
    });

    expect(useAiAssistantChatStore.getState().messages).toContainEqual({
      id: 'user-1',
      role: 'user',
      content: 'Create a request.',
    });

    useAiAssistantChatStore.getState().clearChatHistory();

    expect(useAiAssistantChatStore.getState().messages).toEqual([]);
  });

  test('replaces and removes a pending message by its stable id', () => {
    const store = useAiAssistantChatStore.getState();
    store.appendMessage({
      id: 'pending-1',
      role: 'system',
      content: 'Working',
      isPending: true,
    });
    store.replaceMessage('pending-1', {
      id: 'pending-1',
      role: 'assistant',
      content: 'Done',
    });

    expect(useAiAssistantChatStore.getState().messages).toContainEqual({
      id: 'pending-1',
      role: 'assistant',
      content: 'Done',
    });

    useAiAssistantChatStore.getState().removeMessage('pending-1');

    expect(useAiAssistantChatStore.getState().messages).not.toContainEqual(
      expect.objectContaining({ id: 'pending-1' }),
    );
  });
});
