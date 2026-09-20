import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ChevronRightIcon,
  CloseIcon,
  EnvironmentIcon,
  ImportIcon,
  PlusIcon,
} from '../../../../../assets/svgs';
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
} from '../../../../../components';
import { trackEvent } from '../../../../../services/analytics/googleAnalytics';
import { useWorkspaceStore } from '../../../../../store';
import { usePointerTabReorder } from '../../../hooks/usePointerTabReorder';
import type { RequestItem } from '../../../types';
import { getRequestIsDirty } from '../../../utils/requestDirty';
import {
  workspaceChangeStatusLabels,
  workspaceChangeTextClassNames,
} from '../../workspaceChangeStatusClassNames';
import { TabContextMenu } from './TabContextMenu';

export const workspaceTabClassName =
  'group relative flex h-8 min-w-[140px] max-w-[210px] shrink-0 items-center gap-1.5 rounded-t-lg border border-b-0 px-2.5 text-[11px] cursor-pointer select-none transition-all';

export const TabsHeader: React.FC = () => {
  const {
    tabs,
    collections,
    activeWorkspaceId,
    activeTabId,
    targetColId,
    drafts,
    collectionsPanelCollapsed,
    workspaces,
    setActiveTabId,
    duplicateRequest,
    closeTab,
    closeTabs,
    reorderTabs,
    revealRequestInSidebar,
    setTargetColId,
    setImportReqOpen,
    setImportContractOpen,
    addCollection,
    addNewTab,
    setTabToClose,
    setCollectionsPanelCollapsed,
  } = useWorkspaceStore();
  const [contextMenu, setContextMenu] = useState<{
    tabId: string;
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { draggedTabId, isTabInsertion, startTabDrag } =
    usePointerTabReorder(reorderTabs);
  const changeIndex = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  )?.github?.syncState?.changeIndex;

  useEffect(() => {
    if (!activeTabId) return;

    tabRefs.current[activeTabId]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [activeTabId]);

  useEffect(() => {
    if (!contextMenu) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    };

    const handleOutsideMouseDown = (event: MouseEvent) => {
      if (contextMenuRef.current?.contains(event.target as Node)) return;
      setContextMenu(null);
    };

    window.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleOutsideMouseDown);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleOutsideMouseDown);
    };
  }, [contextMenu]);

  const isTabDirty = (tabId: string) => {
    const draft = drafts[tabId];
    let original: RequestItem | undefined;
    for (const col of collections) {
      const found = col.requests.find((r) => r.id === tabId);
      if (found) {
        original = found;
        break;
      }
    }
    return getRequestIsDirty(draft, original);
  };

  const handleClose = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    closeTabWithPrompt(tabId);
  };

  const closeTabWithPrompt = (tabId: string) => {
    if (isTabDirty(tabId)) {
      setTabToClose(tabId);
    } else {
      closeTab(tabId);
    }
  };

  const closeTabsWithPrompt = (tabIds: string[]) => {
    const cleanTabIds = tabIds.filter((tabId) => !isTabDirty(tabId));
    if (cleanTabIds.length > 0) {
      closeTabs(cleanTabIds);
    }

    const firstDirtyTabId = tabIds.find((tabId) => isTabDirty(tabId));
    if (firstDirtyTabId) {
      setTabToClose(firstDirtyTabId);
    }
  };

  const handleTabContextMenu = (
    tabId: string,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      tabId,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleAddNewRequest = () => {
    trackEvent({ screen: 'workspace', action: 'new_request' });
    addNewTab();
  };

  const handleOpenImportDialog = () => {
    let colId = targetColId || collections[0]?.id;
    if (!colId && collections.length === 0) {
      addCollection('Default Collection');
      const updatedCols = useWorkspaceStore.getState().collections;
      colId = updatedCols[updatedCols.length - 1]?.id;
    }
    if (colId) {
      setTargetColId(colId);
      setImportReqOpen(true);
    }
  };

  const handleOpenImportContractDialog = () => {
    let colId = targetColId || collections[0]?.id;
    if (!colId && collections.length === 0) {
      addCollection('Default Collection');
      const updatedCols = useWorkspaceStore.getState().collections;
      colId = updatedCols[updatedCols.length - 1]?.id;
    }
    if (colId) {
      setTargetColId(colId);
      setImportContractOpen(true);
    }
  };

  const contextMenuReq = contextMenu
    ? drafts[contextMenu.tabId] ||
      collections
        .flatMap((c) => c.requests)
        .find((r) => r.id === contextMenu.tabId)
    : null;
  return (
    <div className="relative flex min-h-8 select-none items-stretch border-b border-foreground/10 bg-foreground/[0.03] shadow-sm shadow-foreground/5 dark:bg-background/40">
      {collectionsPanelCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollectionsPanelCollapsed(false)}
          className="h-8 cursor-pointer rounded-none border-r border-foreground/10 px-2.5 text-foreground/60 hover:text-foreground"
          title="Expand Sidebar"
        >
          <ChevronRightIcon title="Expand sidebar" className="w-4 h-4" />
        </Button>
      )}

      {/* Scrollable Tabs Container */}
      <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto px-2 pt-0.5 scrollbar-none">
        {tabs.map((tabId) => {
          let reqObject: RequestItem | null = null;
          if (drafts[tabId]) {
            reqObject = drafts[tabId];
          } else {
            for (const col of collections) {
              const found = col.requests.find((r) => r.id === tabId);
              if (found) {
                reqObject = found;
                break;
              }
            }
          }
          if (!reqObject) return null;

          const isActive = tabId === activeTabId;
          const isDirty = isTabDirty(tabId);
          const requestChangeStatus =
            changeIndex?.requests[tabId] ?? 'unchanged';
          const methodColors: Record<string, string> = {
            READ: 'text-secondary-600',
            WRITE: 'text-primary-500',
            GET: 'text-secondary-600',
            POST: 'text-primary-500',
            PUT: 'text-primary-500',
            PATCH: 'text-secondary-600',
            DELETE: 'text-primary-500',
          };

          return (
            <div
              key={tabId}
              ref={(element) => {
                tabRefs.current[tabId] = element;
              }}
              data-workspace-tab-id={tabId}
              onClick={() => setActiveTabId(tabId)}
              onContextMenu={(event) => handleTabContextMenu(tabId, event)}
              onPointerDown={(event) => startTabDrag(tabId, event)}
              className={`${workspaceTabClassName} ${
                isActive
                  ? 'z-10 border-foreground/10 bg-background text-foreground shadow-sm shadow-foreground/10'
                  : 'border-transparent bg-transparent text-foreground/60 hover:border-foreground/10 hover:bg-background/70 hover:text-foreground'
              } ${draggedTabId === tabId ? 'scale-[0.98] opacity-40' : ''} ${
                isTabInsertion(tabId, 'before')
                  ? 'before:absolute before:-left-1 before:inset-y-2 before:w-0.5 before:rounded-full before:bg-primary-500'
                  : ''
              } ${
                isTabInsertion(tabId, 'after')
                  ? 'after:absolute after:-right-1 after:inset-y-2 after:w-0.5 after:rounded-full after:bg-primary-500'
                  : ''
              }`}
            >
              <span
                className={`rounded-md bg-foreground/5 px-1.5 py-0.5 text-[10px] font-bold leading-none ring-1 ring-foreground/10 ${methodColors[reqObject.type]}`}
              >
                {reqObject.type}
              </span>
              <span className="inline-flex min-w-0 flex-1 items-center gap-1">
                <span
                  className={`truncate font-medium ${
                    requestChangeStatus === 'unchanged'
                      ? ''
                      : workspaceChangeTextClassNames[requestChangeStatus]
                  }`}
                  title={
                    requestChangeStatus === 'unchanged'
                      ? reqObject.name
                      : workspaceChangeStatusLabels[requestChangeStatus]
                  }
                >
                  {reqObject.name}
                </span>
                {isDirty && (
                  <span className="ml-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500 ring-2 ring-background" />
                )}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleClose(tabId, e)}
                className={`h-5 w-5 rounded-md p-0 hover:bg-foreground/10 hover:text-foreground ${
                  isActive ? 'text-foreground/55' : 'text-foreground/35'
                }`}
                title="Close tab"
              >
                <CloseIcon title="Close tab" className="w-3 h-3 shrink-0" />
              </Button>
              {isActive && (
                <span className="pointer-events-none absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary-500" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center gap-1 border-l border-foreground/10 px-2">
        <DropdownMenu
          align="right"
          className="w-56"
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 rounded-lg p-0 text-foreground/60 hover:bg-background hover:text-foreground cursor-pointer"
            >
              <PlusIcon
                title="Add or import request"
                className="block h-4 w-4 shrink-0"
                strokeWidth={2}
              />
            </Button>
          }
        >
          <DropdownMenuItem onClick={handleAddNewRequest} className="gap-2">
            <PlusIcon title="New request" className="w-4 h-4 shrink-0" />
            <span>New Request</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenImportDialog} className="gap-2">
            <ImportIcon title="Import request" className="w-4 h-4" />
            <span>Import Request</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleOpenImportContractDialog}
            className="gap-2"
          >
            <EnvironmentIcon
              title="Import contract"
              className="w-4 h-4 shrink-0"
            />
            <span>Import Contract/Program</span>
          </DropdownMenuItem>
        </DropdownMenu>
      </div>

      {contextMenu && (
        <TabContextMenu
          tabId={contextMenu.tabId}
          x={contextMenu.x}
          y={contextMenu.y}
          request={contextMenuReq}
          tabs={tabs}
          menuRef={contextMenuRef}
          duplicateRequest={duplicateRequest}
          closeTab={closeTab}
          closeTabWithPrompt={closeTabWithPrompt}
          closeTabs={closeTabs}
          closeTabsWithPrompt={closeTabsWithPrompt}
          revealRequestInSidebar={revealRequestInSidebar}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
