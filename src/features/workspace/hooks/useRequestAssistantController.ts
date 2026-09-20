import { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../../../components';
import {
  chatWithLocalAiAgent,
  discoverLocalAiAgents,
  isDesktopApp,
  type LocalAiAgent,
} from '../../../services/platform';
import {
  type AiAssistantChatMessage,
  useAiAssistantChatStore,
  useAiAssistantStore,
  useWorkspaceStore,
} from '../../../store';
import type { RequestItem } from '../types';
import {
  type AiAgentStructuredResponse,
  buildAiAgentPrompt,
  parseAiAgentResponse,
} from '../utils/aiAgentRequest';
import {
  type AssistantActionResult,
  executeAssistantActionPlan,
} from '../utils/assistantActionExecutor';
import {
  type AssistantActionPlanResult,
  createAssistantActionPlan,
} from '../utils/assistantActionPlan';
import { findRequestByTarget } from '../utils/assistantRequestDuplicate';
import {
  getRequestAssistantComposerState,
  isRequestAssistantPanelVisible,
  sortLocalAiAgents,
} from '../utils/localAiAgent';
import type {
  PendingDuplicateRequest,
  RequestAssistantController,
} from './requestAssistantControllerTypes';
import { useLocalAiAgentModels } from './useLocalAiAgentModels';

const workingMessageContent =
  'Working on your request. This can take a moment.';

const createMessage = (
  role: AiAssistantChatMessage['role'],
  content: string,
  isPending = false,
): AiAssistantChatMessage => ({
  id: crypto.randomUUID(),
  role,
  content,
  ...(isPending ? { isPending } : {}),
});

const getActionToastTitle = (action: AiAgentStructuredResponse['action']) => {
  if (
    action === 'create_request' ||
    action === 'create_collection_with_request'
  ) {
    return 'Request created';
  }
  if (action === 'update_request') return 'Request draft updated';
  if (action === 'create_collection') return 'Collection created';
  return 'Request saved to collection';
};

export function useRequestAssistantController(
  activeRequest: RequestItem | null,
): RequestAssistantController {
  const { toast } = useToast();
  const addCustomRequest = useWorkspaceStore((state) => state.addCustomRequest);
  const addCollection = useWorkspaceStore((state) => state.addCollection);
  const saveDraft = useWorkspaceStore((state) => state.saveDraft);
  const openTab = useWorkspaceStore((state) => state.openTab);
  const setCollectionsPanelCollapsed = useWorkspaceStore(
    (state) => state.setCollectionsPanelCollapsed,
  );
  const setSearchTerm = useWorkspaceStore((state) => state.setSearchTerm);
  const updateActiveRequest = useWorkspaceStore(
    (state) => state.updateActiveRequest,
  );
  const selectedAgentId = useAiAssistantStore((state) => state.selectedAgentId);
  const setSelectedAgentId = useAiAssistantStore(
    (state) => state.setSelectedAgentId,
  );
  const selectedAgentModels = useAiAssistantStore(
    (state) => state.selectedAgentModels,
  );
  const setSelectedAgentModel = useAiAssistantStore(
    (state) => state.setSelectedAgentModel,
  );
  const messages = useAiAssistantChatStore((state) => state.messages);
  const appendMessage = useAiAssistantChatStore((state) => state.appendMessage);
  const removeMessage = useAiAssistantChatStore((state) => state.removeMessage);
  const clearChatHistory = useAiAssistantChatStore(
    (state) => state.clearChatHistory,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [agents, setAgents] = useState<LocalAiAgent[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [composerValue, setComposerValue] = useState('');
  const [pendingDuplicateRequest, setPendingDuplicateRequest] =
    useState<PendingDuplicateRequest | null>(null);
  const [isClearHistoryDialogOpen, setIsClearHistoryDialogOpen] =
    useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) || null,
    [agents, selectedAgentId],
  );
  const selectedModelId = selectedAgent
    ? (selectedAgentModels[selectedAgent.id] ?? '')
    : '';
  const {
    data: models = [],
    error: modelLoadingError,
    isLoading: isLoadingModels,
  } = useLocalAiAgentModels(selectedAgent, isConnectDialogOpen);
  const composerState = getRequestAssistantComposerState(
    Boolean(selectedAgent),
    isSending,
    Boolean(pendingDuplicateRequest),
  );
  const isPanelVisible = isRequestAssistantPanelVisible(
    isOpen,
    isConnectDialogOpen,
    isClearHistoryDialogOpen,
  );

  const handleDiscoverAgents = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
      const discoveredAgents = sortLocalAiAgents(await discoverLocalAiAgents());
      setAgents(discoveredAgents);
      if (
        isDesktopApp() &&
        selectedAgentId &&
        !discoveredAgents.some((agent) => agent.id === selectedAgentId)
      ) {
        setSelectedAgentId('');
      }
    } catch (error) {
      setConnectionError(
        error instanceof Error ? error.message : 'Failed to discover agents.',
      );
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (!isOpen || messages.length === 0) return;
    chatEndRef.current?.scrollIntoView({ block: 'end' });
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (!isOpen && !isConnectDialogOpen && !isClearHistoryDialogOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (isClearHistoryDialogOpen) return setIsClearHistoryDialogOpen(false);
      if (isConnectDialogOpen) return setIsConnectDialogOpen(false);
      setIsOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isClearHistoryDialogOpen, isConnectDialogOpen, isOpen]);

  useEffect(() => {
    if (
      selectedAgent &&
      selectedModelId &&
      models.length > 0 &&
      !models.some((model) => model.id === selectedModelId)
    ) {
      setSelectedAgentModel(selectedAgent.id, '');
    }
  }, [models, selectedAgent, selectedModelId, setSelectedAgentModel]);

  const applyActionPlan = (result: AssistantActionPlanResult) =>
    executeAssistantActionPlan(result.plan, {
      addCollection,
      addCustomRequest,
      getState: () => useWorkspaceStore.getState(),
      openTab,
      saveDraft,
      setCollectionsPanelCollapsed,
      setSearchTerm,
      updateActiveRequest,
    });

  const getDuplicateRequest = (response: AiAgentStructuredResponse) => {
    if (
      !response.request ||
      (response.action !== 'create_request' &&
        response.action !== 'create_collection_with_request')
    ) {
      return undefined;
    }

    const workspaceState = useWorkspaceStore.getState();
    return findRequestByTarget(
      workspaceState.collections,
      response.request.target,
      workspaceState.drafts,
    );
  };

  const handleOpenConnectDialog = () => {
    setIsConnectDialogOpen(true);
    void handleDiscoverAgents();
  };

  const handleOpenAssistant = () => {
    setIsOpen(true);
    void handleDiscoverAgents();
  };

  const handleClose = () => setIsOpen(false);

  const handleClearChatHistory = () => {
    clearChatHistory();
    setIsClearHistoryDialogOpen(false);
    toast({
      title: 'Chat history cleared',
      description: 'Your local assistant conversation was removed.',
      type: 'success',
    });
  };

  const handleSelectAgent = (agentId: string) => {
    const agent = agents.find((candidate) => candidate.id === agentId);
    if (!agent) return;

    setSelectedAgentId(agentId);
    setIsConnectDialogOpen(false);
    appendMessage(
      createMessage('system', `${agent.name} is connected and ready.`),
    );
  };

  const handleCreateDuplicateRequest = () => {
    if (!pendingDuplicateRequest) return;

    const result = createAssistantActionPlan(pendingDuplicateRequest.response, {
      activeRequest,
      collections: useWorkspaceStore.getState().collections,
    });
    applyActionPlan(result);
    setPendingDuplicateRequest(null);
    appendMessage(createMessage('user', 'Create a new request.'));
    if (result.createdRequest) setIsOpen(false);
    toast({
      title: 'Request created',
      description: pendingDuplicateRequest.response.message,
      type: 'success',
    });
  };

  const handleUpdateDuplicateRequest = () => {
    if (!pendingDuplicateRequest) return;

    const { existingRequest, response } = pendingDuplicateRequest;
    const request = response.request;
    if (!request) return;
    openTab(existingRequest.id);
    updateActiveRequest(request);
    setPendingDuplicateRequest(null);
    appendMessage(createMessage('user', `Update ${existingRequest.name}.`));
    appendMessage(
      createMessage('assistant', `Updated ${existingRequest.name}.`),
    );
    setIsOpen(false);
    toast({
      title: 'Existing request updated',
      description: `Opened ${existingRequest.name} in the workspace.`,
      type: 'success',
    });
  };

  const handleSend = async () => {
    const userMessage = composerValue.trim();
    if (!userMessage || !selectedAgent) return;

    const pendingMessage = createMessage('system', workingMessageContent, true);
    setComposerValue('');
    setIsSending(true);
    appendMessage(createMessage('user', userMessage));
    appendMessage(pendingMessage);

    try {
      const result = await chatWithLocalAiAgent({
        agentId: selectedAgent.id,
        model: selectedModelId || undefined,
        prompt: buildAiAgentPrompt({
          userMessage,
          hasActiveRequest: Boolean(activeRequest),
        }),
      });
      const response = parseAiAgentResponse(result.content);
      const duplicateRequest = getDuplicateRequest(response);
      removeMessage(pendingMessage.id);

      if (duplicateRequest) {
        setPendingDuplicateRequest({
          existingRequest: duplicateRequest,
          response,
        });
        appendMessage(createMessage('assistant', response.message));
        appendMessage(
          createMessage(
            'system',
            `The URL already exists in “${duplicateRequest.name}”. Choose whether to update it or create a new request.`,
          ),
        );
        return;
      }

      const actionPlan = createAssistantActionPlan(response, {
        activeRequest,
        collections: useWorkspaceStore.getState().collections,
      });
      const actionResult: AssistantActionResult = applyActionPlan(actionPlan);
      appendMessage(createMessage('assistant', response.message));

      if (actionPlan.createdRequest) {
        setIsOpen(false);
      }
      if (actionResult.requestNotFound) {
        toast({
          title: 'No matching saved request',
          description: 'The sidebar was filtered so you can choose a request.',
          type: 'error',
        });
      } else if (actionResult.changed) {
        toast({
          title: getActionToastTitle(response.action),
          description: response.message,
          type: 'success',
        });
      }
    } catch (error) {
      removeMessage(pendingMessage.id);
      const message =
        error instanceof Error ? error.message : 'The local agent failed.';
      appendMessage(createMessage('assistant', message));
      toast({
        title: 'Agent response failed',
        description: message,
        type: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  return {
    agents,
    chatEndRef,
    composerState,
    composerValue,
    connectionError,
    handleClearChatHistory,
    handleClose,
    handleCreateDuplicateRequest,
    handleOpenAssistant,
    handleOpenConnectDialog,
    handleSelectAgent,
    handleSend,
    handleUpdateDuplicateRequest,
    isClearHistoryDialogOpen,
    isConnectDialogOpen,
    isConnecting,
    isLoadingModels,
    isOpen,
    isPanelVisible,
    isSending,
    messages,
    modelLoadingError:
      modelLoadingError instanceof Error ? modelLoadingError : null,
    models,
    pendingDuplicateRequest,
    selectedAgent,
    selectedAgentId,
    selectedModelId,
    setComposerValue,
    setIsClearHistoryDialogOpen,
    setIsConnectDialogOpen,
    setSelectedAgentId,
    setSelectedAgentModel,
  };
}
