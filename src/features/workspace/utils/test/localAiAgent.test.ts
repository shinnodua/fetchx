import { describe, expect, test } from 'bun:test';

import type { LocalAiAgent } from '../../../../services/platform';
import {
  getLocalAiAgentLabel,
  getLocalAiAgentModelOptions,
  getRequestAssistantComposerState,
  isRequestAssistantPanelVisible,
  sortLocalAiAgents,
} from '../localAiAgent';

const agents: LocalAiAgent[] = [
  {
    id: 'http:ollama',
    name: 'Ollama',
    kind: 'http',
    endpoint: 'http://127.0.0.1:11434',
    protocol: 'ollama-chat',
  },
  {
    id: 'cli:codex',
    name: 'Codex',
    kind: 'cli',
    command: 'codex',
    protocol: 'cli-prompt',
  },
  {
    id: 'cli:claude',
    name: 'Claude Code',
    kind: 'cli',
    command: 'claude',
    protocol: 'cli-prompt',
  },
];

describe('local AI agent presentation', () => {
  test('shows the executable for CLI agents and endpoint for HTTP agents', () => {
    expect(getLocalAiAgentLabel(agents[1])).toBe('codex');
    expect(getLocalAiAgentLabel(agents[0])).toBe('http://127.0.0.1:11434');
  });

  test('places the agent default before dynamically discovered models', () => {
    expect(
      getLocalAiAgentModelOptions([{ id: 'gemini-3', name: 'Gemini 3' }]),
    ).toEqual([
      {
        value: '',
        label: 'Use agent default model',
        separatorAfter: true,
      },
      { value: 'gemini-3', label: 'Gemini 3' },
    ]);
  });

  test('sorts CLI agents before HTTP agents and names alphabetically', () => {
    expect(sortLocalAiAgents(agents).map((agent) => agent.id)).toEqual([
      'cli:claude',
      'cli:codex',
      'http:ollama',
    ]);
    expect(agents[0]?.id).toBe('http:ollama');
  });

  test('hides the request assistant while the connection dialog is open', () => {
    expect(isRequestAssistantPanelVisible(true, false)).toBe(true);
    expect(isRequestAssistantPanelVisible(true, true)).toBe(false);
    expect(isRequestAssistantPanelVisible(true, false, true)).toBe(false);
    expect(isRequestAssistantPanelVisible(false, false)).toBe(false);
  });

  test('locks the composer and explains the pending agent request', () => {
    expect(getRequestAssistantComposerState(true, true)).toEqual({
      disabled: true,
      status:
        'Working on your request. Send is disabled until the agent replies.',
    });
    expect(getRequestAssistantComposerState(false, false).disabled).toBe(true);
    expect(getRequestAssistantComposerState(true, false).disabled).toBe(false);
  });

  test('locks the composer until a duplicate request decision is made', () => {
    expect(getRequestAssistantComposerState(true, false, true)).toEqual({
      disabled: true,
      status:
        'Choose whether to update the existing request or create a new one.',
    });
  });
});
