import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChatIcon, SpinnerIcon } from '../../../../assets/svgs';
import {
  Badge,
  Button,
  Dialog,
  Select,
  Textarea,
  useToast,
} from '../../../../components';
import {
  chatWithLocalAiAgent,
  discoverLocalAiAgents,
  isDesktopApp,
  type LocalAiAgent,
} from '../../../../services/platform';
import type { AiAssistantChatMessage } from '../../../../store';
import {
  useAiAssistantChatStore,
  useAiAssistantStore,
  useWorkspaceStore,
} from '../../../../store';
import { cn } from '../../../../utils/cn';
import { useLocalAiAgentModels } from '../../hooks/useLocalAiAgentModels';
import type { RequestItem } from '../../types';
import {
  type AiAgentStructuredResponse,
  buildAiAgentPrompt,
  parseAiAgentResponse,
} from '../../utils/aiAgentRequest';
import { findCollectionIdByName } from '../../utils/assistantCollection';
import { findRequestByTarget } from '../../utils/assistantRequestDuplicate';
import { findRequestByKeyword } from '../../utils/assistantRequestSearch';
import {
  getRequestAssistantComposerState,
  isRequestAssistantPanelVisible,
  sortLocalAiAgents,
} from '../../utils/localAiAgent';
import { LocalAgentConnectionDialog } from './LocalAgentConnectionDialog';

interface RequestAssistantChatProps {
  activeRequest: RequestItem | null;
  launcherClassName?: string;
  launcherLabel?: string;
}

type ChatMessage = AiAssistantChatMessage;

interface PendingDuplicateRequest {
  response: AiAgentStructuredResponse;
  existingRequest: RequestItem;
}

interface AgentResponseSummary {
  changed: boolean;
  createdRequest: boolean;
  requestNotFound?: boolean;
}

const createMessage = (
  role: ChatMessage['role'],
  content: string,
  isPending = false,
): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  content,
  ...(isPending ? { isPending } : {}),
});

export const requestAssistantMessageClassName =
  'max-w-[88%] break-words rounded-2xl px-3 py-2 text-sm leading-6';

export const requestAssistantPanelClassName =
  'fixed bottom-20 right-5 z-[60] flex h-[min(680px,calc(100dvh-7rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-primary-200/80 bg-primary-50/80 shadow-2xl shadow-primary-900/20 backdrop-blur-xl dark:border-primary-800/80 dark:bg-primary-900/25';

export const requestAssistantManageButtonClassName =
  'h-8 shrink-0 border border-foreground/10';

export const requestAssistantPanelMotion = {
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 12 },
  initial: { opacity: 0, scale: 0.96, y: 12 },
};

const workingMessageContent =
  'Working on your request. This can take a moment.';

export const isRequestAssistantWorkingMessage = (message: ChatMessage) =>
  message.role === 'system' && message.content === workingMessageContent;

export const shouldScrollRequestAssistantChatToEnd = (
  isOpen: boolean,
  messageCount: number,
) => isOpen && messageCount > 0;

export const RequestAssistantChat: React.FC<RequestAssistantChatProps> = ({
  activeRequest,
  launcherClassName,
  launcherLabel,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { toast } = useToast();
  const addCustomRequest = useWorkspaceStore((state) => state.addCustomRequest);
  const addCollection = useWorkspaceStore((state) => state.addCollection);
  const saveDraft = useWorkspaceStore((state) => state.saveDraft);
  const openTab = useWorkspaceStore((state) => state.openTab);
  const collections = useWorkspaceStore((state) => state.collections);
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
  const updateMessages = useAiAssistantChatStore(
    (state) => state.updateMessages,
  );
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

  useEffect(() => {
    if (!shouldScrollRequestAssistantChatToEnd(isOpen, messages.length)) return;
    chatEndRef.current?.scrollIntoView({ block: 'end' });
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (!isOpen && !isConnectDialogOpen && !isClearHistoryDialogOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isClearHistoryDialogOpen) {
          setIsClearHistoryDialogOpen(false);
          return;
        }
        if (isConnectDialogOpen) {
          setIsConnectDialogOpen(false);
          return;
        }
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isClearHistoryDialogOpen, isConnectDialogOpen, isOpen]);

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
      const message =
        error instanceof Error ? error.message : 'Failed to discover agents.';
      setConnectionError(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOpenConnectDialog = () => {
    setIsConnectDialogOpen(true);
    void handleDiscoverAgents();
  };

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

  const handleOpenAssistant = () => {
    setIsOpen(true);
    void handleDiscoverAgents();
  };

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
    updateMessages((currentMessages) => [
      ...currentMessages,
      createMessage('system', `${agent.name} is connected and ready.`),
    ]);
  };

  const ensureCollection = (collectionName: string | undefined) => {
    if (!collectionName) return undefined;

    const existingCollectionId = findCollectionIdByName(
      useWorkspaceStore.getState().collections,
      collectionName,
    );
    if (existingCollectionId) return existingCollectionId;

    addCollection(collectionName);
    return findCollectionIdByName(
      useWorkspaceStore.getState().collections,
      collectionName,
    );
  };

  const createRequest = (
    request: NonNullable<AiAgentStructuredResponse['request']>,
    collectionName?: string,
  ) => {
    addCustomRequest(request);
    const requestId = useWorkspaceStore.getState().activeTabId;
    const collectionId = ensureCollection(collectionName);
    if (collectionId) saveDraft(requestId, collectionId);
    return true;
  };

  const applyAgentResponse = (
    response: AiAgentStructuredResponse,
  ): AgentResponseSummary => {
    const collectionName = response.collection?.name;

    switch (response.action) {
      case 'create_request':
        return response.request
          ? {
              changed: createRequest(response.request, collectionName),
              createdRequest: true,
            }
          : { changed: false, createdRequest: false };
      case 'update_request':
        if (!response.request || !activeRequest) {
          return { changed: false, createdRequest: false };
        }
        updateActiveRequest(response.request);
        return { changed: true, createdRequest: false };
      case 'create_collection':
        return {
          changed: Boolean(ensureCollection(collectionName)),
          createdRequest: false,
        };
      case 'create_collection_with_request': {
        const collectionId = ensureCollection(collectionName);
        if (!collectionId || !response.request) {
          return { changed: false, createdRequest: false };
        }
        return {
          changed: createRequest(response.request, collectionName),
          createdRequest: true,
        };
      }
      case 'save_request_to_collection': {
        const collectionId = ensureCollection(collectionName);
        if (!collectionId || !activeRequest) {
          return { changed: false, createdRequest: false };
        }
        saveDraft(activeRequest.id, collectionId);
        return { changed: true, createdRequest: false };
      }
      case 'search_requests': {
        const keyword = response.search?.keyword;
        if (!keyword) return { changed: false, createdRequest: false };

        setSearchTerm(keyword);
        setCollectionsPanelCollapsed(false);
        return { changed: true, createdRequest: false };
      }
      case 'open_request':
      case 'run_request': {
        const keyword = response.search?.keyword;
        const request = findRequestByKeyword(collections, keyword);
        if (!keyword || !request) {
          if (keyword) {
            setSearchTerm(keyword);
            setCollectionsPanelCollapsed(false);
          }
          return {
            changed: Boolean(keyword),
            createdRequest: false,
            requestNotFound: Boolean(keyword),
          };
        }

        setSearchTerm(keyword);
        setCollectionsPanelCollapsed(false);
        openTab(request.id);
        return {
          changed: true,
          createdRequest: false,
        };
      }
      default:
        return { changed: false, createdRequest: false };
    }
  };

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

  const handleCreateDuplicateRequest = () => {
    if (!pendingDuplicateRequest) return;

    const { response } = pendingDuplicateRequest;
    const resultSummary = applyAgentResponse(response);
    setPendingDuplicateRequest(null);
    updateMessages((currentMessages) => [
      ...currentMessages,
      createMessage('user', 'Create a new request.'),
    ]);

    if (resultSummary.createdRequest) {
      setIsOpen(false);
    }

    toast({
      title: 'Request created',
      description: response.message,
      type: 'success',
    });
  };

  const handleUpdateDuplicateRequest = () => {
    if (!pendingDuplicateRequest) return;

    const { existingRequest, response } = pendingDuplicateRequest;
    const request = response.request;
    if (!request) return;

    openTab(existingRequest.id);
    useWorkspaceStore.getState().updateActiveRequest(request);
    setPendingDuplicateRequest(null);
    updateMessages((currentMessages) => [
      ...currentMessages,
      createMessage('user', `Update ${existingRequest.name}.`),
      createMessage('assistant', `Updated ${existingRequest.name}.`),
    ]);
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

    const prompt = buildAiAgentPrompt({
      userMessage,
      hasActiveRequest: Boolean(activeRequest),
    });
    const pendingMessage = createMessage('system', workingMessageContent, true);
    setComposerValue('');
    setIsSending(true);
    updateMessages((currentMessages) => [
      ...currentMessages,
      createMessage('user', userMessage),
      pendingMessage,
    ]);

    try {
      const result = await chatWithLocalAiAgent({
        agentId: selectedAgent.id,
        model: selectedModelId || undefined,
        prompt,
      });
      const parsedResponse = parseAiAgentResponse(result.content);
      const duplicateRequest = getDuplicateRequest(parsedResponse);
      if (duplicateRequest) {
        setPendingDuplicateRequest({
          response: parsedResponse,
          existingRequest: duplicateRequest,
        });
        updateMessages((currentMessages) => [
          ...currentMessages.filter(
            (message) => message.id !== pendingMessage.id,
          ),
          createMessage('assistant', parsedResponse.message),
          createMessage(
            'system',
            `The URL already exists in “${duplicateRequest.name}”. Choose whether to update it or create a new request.`,
          ),
        ]);
        return;
      }
      const resultSummary = applyAgentResponse(parsedResponse);
      updateMessages((currentMessages) => [
        ...currentMessages.filter(
          (message) => message.id !== pendingMessage.id,
        ),
        createMessage('assistant', parsedResponse.message),
      ]);

      if (resultSummary.createdRequest) {
        setIsOpen(false);
      }

      if (resultSummary.requestNotFound) {
        toast({
          title: 'No matching saved request',
          description: 'The sidebar was filtered so you can choose a request.',
          type: 'error',
        });
      } else if (resultSummary.changed) {
        toast({
          title:
            parsedResponse.action === 'create_request' ||
            parsedResponse.action === 'create_collection_with_request'
              ? 'Request created'
              : parsedResponse.action === 'update_request'
                ? 'Request draft updated'
                : parsedResponse.action === 'create_collection'
                  ? 'Collection created'
                  : 'Request saved to collection',
          description: parsedResponse.message,
          type: 'success',
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'The local agent failed.';
      updateMessages((currentMessages) => [
        ...currentMessages.filter(
          (chatMessage) => chatMessage.id !== pendingMessage.id,
        ),
        createMessage('assistant', message),
      ]);
      toast({
        title: 'Agent response failed',
        description: message,
        type: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={launcherLabel ? 'primary' : 'ghost'}
        size="sm"
        onClick={handleOpenAssistant}
        className={cn(
          launcherLabel
            ? 'h-11 w-auto gap-2 rounded-xl px-5 text-sm font-semibold cursor-pointer'
            : 'h-8 w-8 rounded-lg p-0 text-foreground/60 hover:bg-background hover:text-foreground cursor-pointer',
          launcherClassName,
        )}
        title="Open request assistant"
      >
        <ChatIcon
          title="Open request assistant"
          className="h-[18px] w-[18px]"
        />
        {launcherLabel && <span>{launcherLabel}</span>}
      </Button>

      <AnimatePresence>
        {isPanelVisible && (
          <motion.div
            {...requestAssistantPanelMotion}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.18,
              ease: 'easeOut',
            }}
            className={requestAssistantPanelClassName}
          >
            <div className="flex items-start justify-between gap-3 border-b border-primary-200/70 bg-primary-100/45 p-4 dark:border-primary-800/60 dark:bg-primary-900/30">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-semibold">
                    Request Assistant
                  </h2>
                  <Badge variant={selectedAgent ? 'secondary' : 'ghost'}>
                    {selectedAgent ? 'Connected' : 'Offline'}
                  </Badge>
                </div>
                <p className="text-xs leading-5 text-foreground/55">
                  Create requests and collections, search saved requests, or
                  open and run one with a local agent.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsClearHistoryDialogOpen(true)}
                  disabled={
                    messages.length === 0 ||
                    isSending ||
                    Boolean(pendingDuplicateRequest)
                  }
                  className="h-9 px-2 text-xs"
                  title="Clear chat history"
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-9 w-9 rounded-lg border border-foreground/15 bg-foreground/[0.04] p-0 text-foreground hover:bg-foreground/10 hover:text-foreground"
                  title="Close request assistant"
                  aria-label="Close request assistant"
                >
                  <span
                    aria-hidden="true"
                    className="relative block h-4 w-4 text-foreground"
                  >
                    <span className="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-current" />
                    <span className="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-current" />
                  </span>
                </Button>
              </div>
            </div>

            <div className="border-b border-primary-200/70 bg-background/45 p-4 backdrop-blur-sm dark:border-primary-800/60">
              {agents.length > 0 ? (
                <div className="flex items-end gap-2">
                  <Select
                    size="sm"
                    label="Agent"
                    value={selectedAgentId}
                    options={agents.map((agent) => ({
                      value: agent.id,
                      label: agent.name,
                    }))}
                    onChange={setSelectedAgentId}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenConnectDialog}
                    className={requestAssistantManageButtonClassName}
                  >
                    Manage
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-3 text-xs leading-5 text-foreground/65">
                    Fetchx connects only to supported localhost model services.
                    Do not paste credentials or sensitive request data; a local
                    service may use the model provider configured on your
                    device.
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full"
                    onClick={handleOpenConnectDialog}
                  >
                    Connect Local Agent
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-background/35 p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  role={
                    isRequestAssistantWorkingMessage(message)
                      ? 'status'
                      : undefined
                  }
                  aria-live={
                    isRequestAssistantWorkingMessage(message)
                      ? 'polite'
                      : undefined
                  }
                  className={cn(
                    requestAssistantMessageClassName,
                    isRequestAssistantWorkingMessage(message) &&
                      'flex items-center gap-2',
                    message.role === 'user'
                      ? 'ml-auto bg-primary-500 text-white'
                      : message.role === 'assistant'
                        ? 'bg-secondary-50 text-secondary-900 dark:bg-secondary-900/30 dark:text-secondary-100'
                        : 'bg-foreground/[0.04] text-foreground/65',
                  )}
                >
                  {isRequestAssistantWorkingMessage(message) && (
                    <SpinnerIcon
                      title="Working"
                      className="h-4 w-4 shrink-0 animate-spin text-secondary-600 motion-reduce:animate-none dark:text-secondary-300"
                    />
                  )}
                  <span>{message.content}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-primary-200/70 bg-secondary-50/55 p-4 dark:border-primary-800/60 dark:bg-secondary-900/15">
              {pendingDuplicateRequest && (
                <div className="mb-3 rounded-xl border border-primary-500/25 bg-primary-50/60 p-3 dark:bg-primary-900/15">
                  <p className="break-all text-xs leading-5 text-foreground/70">
                    {pendingDuplicateRequest.existingRequest.target}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleUpdateDuplicateRequest}
                    >
                      Update existing
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCreateDuplicateRequest}
                    >
                      Create new
                    </Button>
                  </div>
                </div>
              )}
              <Textarea
                value={composerValue}
                onChange={(event) => setComposerValue(event.target.value)}
                disabled={composerState.disabled}
                placeholder={
                  selectedAgent
                    ? 'Ask to create, search, or run a request, e.g. “Find and open GitHub users.”'
                    : 'Connect a local agent first.'
                }
                className="min-h-[88px] resize-none"
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    (event.metaKey || event.ctrlKey)
                  ) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span aria-live="polite" className="text-xs text-foreground/45">
                  {composerState.status}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="h-10 px-3"
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSend}
                    disabled={
                      composerState.disabled ||
                      !composerValue.trim() ||
                      isSending
                    }
                    isLoading={isSending}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LocalAgentConnectionDialog
        agents={agents}
        error={connectionError}
        isDesktop={isDesktopApp()}
        isDiscovering={isConnecting}
        isOpen={isConnectDialogOpen}
        isLoadingModels={isLoadingModels}
        modelError={
          modelLoadingError instanceof Error ? modelLoadingError.message : null
        }
        models={models}
        selectedAgentId={selectedAgentId}
        selectedModelId={selectedModelId}
        onClose={() => setIsConnectDialogOpen(false)}
        onConnect={handleSelectAgent}
        onModelChange={(modelId) => {
          if (selectedAgent) setSelectedAgentModel(selectedAgent.id, modelId);
        }}
        onRefresh={() => void handleDiscoverAgents()}
      />
      <Dialog
        isOpen={isClearHistoryDialogOpen}
        onClose={() => setIsClearHistoryDialogOpen(false)}
        title="Clear chat history?"
        description="This removes the assistant conversation stored on this device. It does not remove requests, collections, or your connected agent."
      >
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsClearHistoryDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleClearChatHistory}
          >
            Clear history
          </Button>
        </div>
      </Dialog>
    </>
  );
};
