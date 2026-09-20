import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { SpinnerIcon } from '../../../../assets/svgs';
import {
  Badge,
  Button,
  Dialog,
  Select,
  Textarea,
} from '../../../../components';
import { isDesktopApp } from '../../../../services/platform';
import type { AiAssistantChatMessage } from '../../../../store';
import { cn } from '../../../../utils/cn';
import type { RequestAssistantController } from '../../hooks/requestAssistantControllerTypes';
import { LocalAgentConnectionDialog } from './LocalAgentConnectionDialog';

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

export const isRequestAssistantWorkingMessage = (
  message: AiAssistantChatMessage,
) => message.role === 'system' && message.content === workingMessageContent;

interface RequestAssistantPanelProps {
  controller: RequestAssistantController;
}

export function RequestAssistantPanel({
  controller,
}: RequestAssistantPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const {
    agents,
    chatEndRef,
    composerState,
    composerValue,
    connectionError,
    handleClearChatHistory,
    handleClose,
    handleCreateDuplicateRequest,
    handleOpenConnectDialog,
    handleSelectAgent,
    handleSend,
    handleUpdateDuplicateRequest,
    isClearHistoryDialogOpen,
    isConnectDialogOpen,
    isConnecting,
    isLoadingModels,
    isPanelVisible,
    isSending,
    messages,
    modelLoadingError,
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
  } = controller;

  return (
    <>
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
                  open one with a local agent.
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
                  onClick={handleClose}
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
                    ? 'Ask to create, search, or open a request, e.g. “Find and open GitHub users.”'
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
                    onClick={handleClose}
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
        modelError={modelLoadingError?.message ?? null}
        models={models}
        selectedAgentId={selectedAgentId}
        selectedModelId={selectedModelId}
        onClose={() => setIsConnectDialogOpen(false)}
        onConnect={handleSelectAgent}
        onModelChange={(modelId) => {
          if (selectedAgent) setSelectedAgentModel(selectedAgent.id, modelId);
        }}
        onRefresh={() => handleOpenConnectDialog()}
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
}
