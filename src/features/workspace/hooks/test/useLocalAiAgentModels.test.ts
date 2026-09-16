import { describe, expect, test } from 'bun:test';
import { getLocalAiAgentModelsQueryKey } from '../useLocalAiAgentModels';

describe('local AI agent model query', () => {
  test('uses an agent-specific cache key', () => {
    expect(getLocalAiAgentModelsQueryKey('cli:agy')).toEqual([
      'local-ai-agent-models',
      'cli:agy',
    ]);
  });
});
