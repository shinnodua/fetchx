import { afterEach, describe, expect, test } from 'bun:test';

import { useAiAssistantStore } from '../useAiAssistantStore';

describe('AI assistant store', () => {
  afterEach(() => {
    useAiAssistantStore.getState().setSelectedAgentId('');
  });

  test('remembers the selected local agent identifier', () => {
    useAiAssistantStore.getState().setSelectedAgentId('cli:codex');

    expect(useAiAssistantStore.getState().selectedAgentId).toBe('cli:codex');
  });

  test('keeps a model selection for each local agent', () => {
    useAiAssistantStore.getState().setSelectedAgentModel('cli:agy', 'gemini-3');
    useAiAssistantStore
      .getState()
      .setSelectedAgentModel('http:ollama', 'llama3.1');

    expect(useAiAssistantStore.getState().selectedAgentModels).toEqual({
      'cli:agy': 'gemini-3',
      'http:ollama': 'llama3.1',
    });
  });
});
