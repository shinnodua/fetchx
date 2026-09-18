import type React from 'react';
import { useEffect, useMemo } from 'react';
import { useWorkspaceStore } from '../../store';
import {
  ActiveRequestWorkspace,
  CollectionsPanel,
  EnvironmentDialog,
  RequestAssistantChat,
  TabsHeader,
  UnlockSensitiveDialog,
  WorkspaceDialogs,
  WorkspaceEmptyState,
} from './components';
import {
  useAutoCollapseSidebar,
  useAutoLoadAbi,
  useRequestRunner,
  useUnsavedChangesWarning,
  useWorkspacePublicClient,
} from './hooks';
import type { RequestItem } from './types';
import { getRequestIsDirty } from './utils/requestDirty';

export const WorkspacePage: React.FC = () => {
  // Global hooks
  useAutoCollapseSidebar();
  useUnsavedChangesWarning();

  // Store bindings
  const {
    collections,
    tabs,
    activeTabId,
    drafts,
    collectionsPanelCollapsed,
    addNewTab,
    updateActiveRequest,
    initializeDraft,
    setCollectionsPanelCollapsed,
  } = useWorkspaceStore();

  // Auto-initialize draft on mount or activeTabId change
  useEffect(() => {
    if (activeTabId && !drafts[activeTabId]) {
      initializeDraft(activeTabId);
    }
  }, [activeTabId, drafts, initializeDraft]);

  // Find active request (prioritize drafts)
  const activeRequest = useMemo(() => {
    if (drafts[activeTabId]) return drafts[activeTabId];

    for (const col of collections) {
      const req = col.requests.find((r) => r.id === activeTabId);
      if (req) return req;
    }
    return null;
  }, [collections, activeTabId, drafts]);

  // Helper to determine if current tab is dirty
  const activeTabIsDirty = useMemo(() => {
    const draft = drafts[activeTabId];
    let original: RequestItem | undefined;
    for (const col of collections) {
      const found = col.requests.find((r) => r.id === activeTabId);
      if (found) {
        original = found;
        break;
      }
    }
    return getRequestIsDirty(draft, original);
  }, [collections, activeTabId, drafts]);

  // Load ABI hook
  useAutoLoadAbi(activeRequest, activeTabId);

  // Public client hook
  const publicClient = useWorkspacePublicClient(activeRequest);

  // Request execution hook
  const {
    isLoading,
    selectedColId,
    unlockDialogOpen,
    setUnlockDialogOpen,
    setSelectedColId,
    handleTargetPaste,
    handleSaveActiveRequest,
    handleRunRequest,
    handleSimulateRequest,
  } = useRequestRunner(activeRequest, activeTabId, publicClient);

  const validTabs = useMemo(() => {
    return tabs.filter((tabId) => {
      if (drafts[tabId]) return true;
      for (const col of collections) {
        if (col.requests.some((r) => r.id === tabId)) return true;
      }
      return false;
    });
  }, [tabs, drafts, collections]);

  return (
    <div className="flex flex-1 w-full min-h-0 h-full overflow-hidden bg-background text-foreground relative">
      {/* LEFT Sidebar Panel */}
      {!collectionsPanelCollapsed && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity"
            onClick={() => setCollectionsPanelCollapsed(true)}
          />
          <CollectionsPanel />
        </>
      )}

      {/* RIGHT Workspace Details */}
      <main className="flex-grow flex flex-col min-h-0 min-w-0 bg-background">
        {validTabs.length === 0 ? (
          <WorkspaceEmptyState onNewRequest={addNewTab} />
        ) : (
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <TabsHeader />

            {activeRequest && (
              <ActiveRequestWorkspace
                activeRequest={activeRequest}
                activeTabId={activeTabId}
                activeTabIsDirty={activeTabIsDirty}
                collections={collections}
                isLoading={isLoading}
                selectedColId={selectedColId}
                onRunRequest={handleRunRequest}
                onSimulateRequest={handleSimulateRequest}
                onSave={handleSaveActiveRequest}
                onSelectedCollectionChange={setSelectedColId}
                onTargetPaste={handleTargetPaste}
                onUpdateActiveRequest={updateActiveRequest}
              />
            )}
          </div>
        )}
      </main>

      <RequestAssistantChat
        activeRequest={activeRequest}
        launcherLabel="AI Assistant"
        launcherClassName="absolute bottom-4 right-4 z-[55] shadow-xl shadow-primary-500/25 ring-2 ring-background"
      />

      <WorkspaceDialogs />
      <EnvironmentDialog />

      <UnlockSensitiveDialog
        isOpen={unlockDialogOpen}
        onClose={() => setUnlockDialogOpen(false)}
        onUnlockSuccess={() => {
          setTimeout(() => {
            void handleRunRequest();
          }, 100);
        }}
      />
    </div>
  );
};
