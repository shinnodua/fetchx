import { afterEach, describe, expect, test } from 'bun:test';

import { useAiAssistantChatStore } from '../useAiAssistantChatStore';

describe('AI assistant chat store', () => {
  afterEach(() => {
    useAiAssistantChatStore.getState().clearChatHistory();
  });

  test('keeps chat messages until the history is cleared', () => {
    useAiAssistantChatStore
      .getState()
      .updateMessages((messages) => [
        ...messages,
        { id: 'user-1', role: 'user', content: 'Create a request.' },
      ]);

    expect(useAiAssistantChatStore.getState().messages).toContainEqual({
      id: 'user-1',
      role: 'user',
      content: 'Create a request.',
    });

    useAiAssistantChatStore.getState().clearChatHistory();

    expect(useAiAssistantChatStore.getState().messages).toEqual([]);
  });
});
