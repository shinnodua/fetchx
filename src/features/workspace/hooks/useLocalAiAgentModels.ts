import { useQuery } from '@tanstack/react-query';
import {
  discoverLocalAiAgentModels,
  type LocalAiAgent,
} from '../../../services/platform';

export const localAiAgentModelCacheDurationMs = 5 * 60 * 1000;

export const getLocalAiAgentModelsQueryKey = (agentId: string) =>
  ['local-ai-agent-models', agentId] as const;

export const useLocalAiAgentModels = (
  agent: LocalAiAgent | null,
  enabled: boolean,
) =>
  useQuery({
    queryKey: getLocalAiAgentModelsQueryKey(agent?.id ?? 'none'),
    queryFn: () => {
      if (!agent)
        throw new Error('Select a local agent before loading models.');
      return discoverLocalAiAgentModels(agent.id);
    },
    enabled: enabled && agent !== null,
    staleTime: localAiAgentModelCacheDurationMs,
    gcTime: localAiAgentModelCacheDurationMs * 6,
    retry: 1,
  });
