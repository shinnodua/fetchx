import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ChevronRightIcon,
  CloseIcon,
  ImportIcon,
  PlusIcon,
} from '../../../../assets/svgs';
import { Button, DropdownMenu, DropdownMenuItem } from '../../../../components';
import { useWorkspaceStore } from '../../../../store';
import type { RequestItem } from '../../types';
import { getRequestIsDirty } from '../../utils/requestDirty';
import { TabContextMenu } from './TabContextMenu';

export const TabsHeader: React.FC = () => {
  const {
    tabs,
    collections,
    activeTabId,
    targetColId,
    drafts,
    collectionsPanelCollapsed,
    setActiveTabId,
    closeTab,
    closeTabs,
    reorderTabs,
    revealRequestInSidebar,
    setTargetColId,
    setImportReqOpen,
    addCollection,
    addNewTab,
    setTabToClose,
    setCollectionsPanelCollapsed,
  } = useWorkspaceStore();
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    tabId: string;
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const handleDragStart = (
    tabId: string,
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    setDraggedTabId(tabId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', tabId);
  };

  const handleDragOver = (
    tabId: string,
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (tabId !== draggedTabId) {
      setDragOverTabId(tabId);
    }
  };

  const handleDrop = (
    tabId: string,
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    const sourceTabId =
      event.dataTransfer.getData('text/plain') || draggedTabId;
    if (sourceTabId) {
      reorderTabs(sourceTabId, tabId);
    }
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  const resetDragState = () => {
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  const contextMenuReq = contextMenu
    ? drafts[contextMenu.tabId] ||
      collections
        .flatMap((c) => c.requests)
        .find((r) => r.id === contextMenu.tabId)
    : null;
  return (
    <div className="relative flex min-h-11 items-stretch border-b border-foreground/10 bg-foreground/[0.03] shadow-sm shadow-foreground/5 select-none dark:bg-background/40">
      {collectionsPanelCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollectionsPanelCollapsed(false)}
          className="h-11 rounded-none border-r border-foreground/10 px-3.5 text-foreground/60 hover:text-foreground cursor-pointer"
          title="Expand Sidebar"
        >
          <ChevronRightIcon title="Expand sidebar" className="w-4 h-4" />
        </Button>
      )}

      {/* Scrollable Tabs Container */}
      <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto px-2 pt-1 scrollbar-none">
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
          const methodColors: Record<string, string> = {
            READ: 'text-secondary-600',
            WRITE: 'text-primary-500',
            GET: 'text-secondary-600',
            POST: 'text-primary-500',
          };

          return (
            <div
              key={tabId}
              ref={(element) => {
                tabRefs.current[tabId] = element;
              }}
              draggable
              onClick={() => setActiveTabId(tabId)}
              onContextMenu={(event) => handleTabContextMenu(tabId, event)}
              onDragStart={(event) => handleDragStart(tabId, event)}
              onDragOver={(event) => handleDragOver(tabId, event)}
              onDragLeave={() => {
                if (dragOverTabId === tabId) {
                  setDragOverTabId(null);
                }
              }}
              onDrop={(event) => handleDrop(tabId, event)}
              onDragEnd={resetDragState}
              className={`group relative flex h-9 min-w-[148px] max-w-[220px] shrink-0 items-center gap-2 rounded-t-lg border border-b-0 px-3 text-xs cursor-pointer select-none transition-all ${
                isActive
                  ? 'z-10 border-foreground/10 bg-background text-foreground shadow-sm shadow-foreground/10 before:absolute before:inset-x-3 before:bottom-0 before:h-0.5 before:rounded-full before:bg-primary-500'
                  : 'border-transparent bg-transparent text-foreground/60 hover:border-foreground/10 hover:bg-background/70 hover:text-foreground'
              } ${draggedTabId === tabId ? 'opacity-50' : ''} ${
                dragOverTabId === tabId
                  ? 'border-primary-500/30 bg-primary-500/10 shadow-[inset_2px_0_0_theme(colors.primary.500)]'
                  : ''
              }`}
            >
              <span
                className={`rounded-md bg-foreground/5 px-1.5 py-0.5 text-[10px] font-bold leading-none ring-1 ring-foreground/10 ${methodColors[reqObject.type]}`}
              >
                {reqObject.type}
              </span>
              <span className="inline-flex min-w-0 flex-1 items-center gap-1">
                <span className="truncate font-medium" title={reqObject.name}>
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
            </div>
          );
        })}
      </div>

      {/* Dropdown Menu for Add/Import Request - Outside scrollable container */}
      <div className="flex shrink-0 items-center border-l border-foreground/10 px-2">
        <DropdownMenu
          align="right"
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-lg p-0 text-foreground/60 hover:bg-background hover:text-foreground cursor-pointer"
            >
              <PlusIcon
                title="Add or import request"
                className="block h-5 w-5 shrink-0"
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
