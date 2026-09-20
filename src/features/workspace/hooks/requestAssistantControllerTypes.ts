import type { RefObject } from 'react';
import type {
  LocalAiAgent,
  LocalAiAgentModel,
} from '../../../services/platform';
import type { AiAssistantChatMessage } from '../../../store';
import type { RequestItem } from '../types';
import type { AiAgentStructuredResponse } from '../utils/aiAgentRequest';
import type { getRequestAssistantComposerState } from '../utils/localAiAgent';

export interface PendingDuplicateRequest {
  existingRequest: RequestItem;
  response: AiAgentStructuredResponse;
}

export interface RequestAssistantController {
  agents: LocalAiAgent[];
  chatEndRef: RefObject<HTMLDivElement | null>;
  composerState: ReturnType<typeof getRequestAssistantComposerState>;
  composerValue: string;
  connectionError: string | null;
  handleClearChatHistory: () => void;
  handleClose: () => void;
  handleCreateDuplicateRequest: () => void;
  handleOpenAssistant: () => void;
  handleOpenConnectDialog: () => void;
  handleSelectAgent: (agentId: string) => void;
  handleSend: () => Promise<void>;
  handleUpdateDuplicateRequest: () => void;
  isClearHistoryDialogOpen: boolean;
  isConnectDialogOpen: boolean;
  isConnecting: boolean;
  isLoadingModels: boolean;
  isOpen: boolean;
  isPanelVisible: boolean;
  isSending: boolean;
  messages: AiAssistantChatMessage[];
  modelLoadingError: Error | null;
  models: LocalAiAgentModel[];
  pendingDuplicateRequest: PendingDuplicateRequest | null;
  selectedAgent: LocalAiAgent | null;
  selectedAgentId: string;
  selectedModelId: string;
  setComposerValue: (value: string) => void;
  setIsClearHistoryDialogOpen: (isOpen: boolean) => void;
  setIsConnectDialogOpen: (isOpen: boolean) => void;
  setSelectedAgentId: (agentId: string) => void;
  setSelectedAgentModel: (agentId: string, modelId: string) => void;
}
