import type { SelectOption } from '../../../components';

import type {
  LocalAiAgent,
  LocalAiAgentModel,
} from '../../../services/platform';

export const getLocalAiAgentModelOptions = (
  models: LocalAiAgentModel[],
): SelectOption[] => [
  {
    value: '',
    label: 'Use agent default model',
    separatorAfter: models.length > 0,
  },
  ...models.map((model) => ({ value: model.id, label: model.name })),
];

export const getLocalAiAgentLabel = (agent: LocalAiAgent) =>
  agent.kind === 'cli'
    ? agent.command || agent.name
    : agent.endpoint || agent.name;

export const sortLocalAiAgents = (agents: LocalAiAgent[]) =>
  [...agents].sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === 'cli' ? -1 : 1;
    return left.name.localeCompare(right.name);
  });

export const isRequestAssistantPanelVisible = (
  isAssistantOpen: boolean,
  isConnectionDialogOpen: boolean,
  isClearHistoryDialogOpen = false,
) => isAssistantOpen && !isConnectionDialogOpen && !isClearHistoryDialogOpen;

export const getRequestAssistantComposerState = (
  hasSelectedAgent: boolean,
  isSending: boolean,
  isAwaitingDuplicateDecision = false,
) => {
  if (isSending) {
    return {
      disabled: true,
      status:
        'Working on your request. Send is disabled until the agent replies.',
    };
  }

  if (!hasSelectedAgent) {
    return {
      disabled: true,
      status: 'Connect a local agent first.',
    };
  }

  if (isAwaitingDuplicateDecision) {
    return {
      disabled: true,
      status:
        'Choose whether to update the existing request or create a new one.',
    };
  }

  return {
    disabled: false,
    status: 'Press Cmd/Ctrl + Enter to send.',
  };
};
