import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../components';
import {
  getRequestIsDirty,
  useWorkspaceStore,
} from '../../../store/useWorkspaceStore';
import type { RequestItem } from '../types';

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

  const runMenuAction = (action: () => void) => {
    action();
    setContextMenu(null);
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

  return (
    <div className="flex items-center border-b border-foreground/10 bg-white/5 dark:bg-black/10 min-h-[45px] relative select-none">
      {collectionsPanelCollapsed && (
        <button
          onClick={() => setCollectionsPanelCollapsed(false)}
          className="p-3.5 border-r border-foreground/10 hover:bg-foreground/5 text-foreground/60 hover:text-foreground transition-all flex items-center justify-center shrink-0 h-[45px] cursor-pointer"
          title="Expand Sidebar"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>Expand icon</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Scrollable Tabs Container */}
      <div className="flex-1 flex items-center overflow-x-auto scrollbar-none min-w-0">
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
            READ: 'text-green-500',
            WRITE: 'text-primary-500',
            GET: 'text-blue-500',
            POST: 'text-purple-500',
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
              className={`flex items-center gap-2 px-4 py-2.5 text-xs border-r border-foreground/10 cursor-pointer select-none shrink-0 transition-all ${
                isActive
                  ? 'bg-background font-semibold text-foreground border-b-2 border-b-primary-500'
                  : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground'
              } ${draggedTabId === tabId ? 'opacity-50' : ''} ${
                dragOverTabId === tabId
                  ? 'bg-primary-500/10 shadow-[inset_2px_0_0_theme(colors.primary.500)]'
                  : ''
              }`}
            >
              <span
                className={`text-[10px] font-bold ${methodColors[reqObject.type]}`}
              >
                {reqObject.type}
              </span>
              <span className="inline-flex items-center gap-1 min-w-0 max-w-[120px]">
                <span className="truncate" title={reqObject.name}>
                  {reqObject.name}
                </span>
                {isDirty && (
                  <span className="text-primary-500 font-bold text-lg leading-none shrink-0">
                    •
                  </span>
                )}
              </span>
              <button
                onClick={(e) => handleClose(tabId, e)}
                className="ml-1 p-0.5 rounded-full hover:bg-foreground/10 text-foreground/45 hover:text-foreground"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Close icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Dropdown Menu for Add/Import Request - Outside scrollable container */}
      <div className="flex items-center px-3 border-l border-foreground/10 shrink-0 self-stretch">
        <DropdownMenu
          align="right"
          trigger={
            <button
              type="button"
              className="p-1.5 rounded-lg hover:bg-foreground/5 text-foreground/60 hover:text-foreground transition-all flex items-center justify-center cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>Add/Import Request</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          }
        >
          <DropdownMenuItem onClick={handleAddNewRequest} className="gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>Plus icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>New Request</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenImportDialog} className="gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>Import icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span>Import Request</span>
          </DropdownMenuItem>
        </DropdownMenu>
      </div>

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-[70] w-48 overflow-hidden rounded-xl border border-foreground/10 bg-background/95 p-1 shadow-xl backdrop-blur-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <DropdownMenuItem
            onClick={() =>
              runMenuAction(() => closeTabWithPrompt(contextMenu.tabId))
            }
          >
            Close Tab
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => runMenuAction(() => closeTab(contextMenu.tabId))}
          >
            Force Close Tab
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              runMenuAction(() =>
                closeTabsWithPrompt(
                  tabs.filter((tabId) => tabId !== contextMenu.tabId),
                ),
              )
            }
          >
            Close Other Tabs
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => runMenuAction(() => closeTabsWithPrompt(tabs))}
          >
            Close All Tabs
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => runMenuAction(() => closeTabs(tabs))}
          >
            Force Close All Tabs
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              runMenuAction(() => revealRequestInSidebar(contextMenu.tabId))
            }
          >
            Reveal in Sidebar
          </DropdownMenuItem>
        </div>
      )}
    </div>
  );
};
