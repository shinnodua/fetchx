import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Input,
} from '../../../components';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';
import type { CollectionItem } from '../types';

type RenameTarget =
  | { type: 'collection'; id: string; name: string }
  | { type: 'request'; id: string; name: string };

type ContextMenuTarget =
  | { type: 'collection'; id: string; name: string; x: number; y: number }
  | { type: 'request'; id: string; name: string; x: number; y: number };

export const CollectionsPanel: React.FC = () => {
  const {
    collections,
    searchTerm,
    activeTabId,
    requestToRevealId,
    collapsedCollectionIds,
    collectionsPanelWidth,
    setSearchTerm,
    setNewColOpen,
    setTargetColId,
    setNewReqOpen,
    renameCollection,
    duplicateCollection,
    deleteCollection,
    renameRequest,
    duplicateRequest,
    deleteRequest,
    openTab,
    setRequestToRevealId,
    toggleCollectionCollapsed,
    setCollectionsPanelWidth,
    setCollectionsPanelCollapsed,
  } = useWorkspaceStore();

  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const requestRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filteredCollections = useMemo<CollectionItem[]>(() => {
    if (!searchTerm.trim()) return collections;
    const lower = searchTerm.toLowerCase();
    return collections
      .map((col) => {
        const filteredReqs = col.requests.filter(
          (req) =>
            req.name.toLowerCase().includes(lower) ||
            req.target.toLowerCase().includes(lower),
        );
        if (col.name.toLowerCase().includes(lower) || filteredReqs.length > 0) {
          return { ...col, requests: filteredReqs };
        }
        return null;
      })
      .filter((col): col is CollectionItem => col !== null);
  }, [collections, searchTerm]);

  const [colToDelete, setColToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [reqToDelete, setReqToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenuTarget, setContextMenuTarget] =
    useState<ContextMenuTarget | null>(null);

  useEffect(() => {
    if (!contextMenuTarget) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenuTarget(null);
      }
    };

    const handleOutsideMouseDown = (event: MouseEvent) => {
      if (contextMenuRef.current?.contains(event.target as Node)) return;
      setContextMenuTarget(null);
    };

    window.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleOutsideMouseDown);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleOutsideMouseDown);
    };
  }, [contextMenuTarget]);

  useEffect(() => {
    if (!requestToRevealId) return;

    const timeoutId = window.setTimeout(() => {
      requestRefs.current[requestToRevealId]?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
      setRequestToRevealId(null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [requestToRevealId, setRequestToRevealId]);

  const openRenameDialog = (target: RenameTarget) => {
    setRenameTarget(target);
    setRenameValue(target.name);
  };

  const closeRenameDialog = () => {
    setRenameTarget(null);
    setRenameValue('');
  };

  const handleRenameSubmit = () => {
    if (!renameTarget) return;

    if (renameTarget.type === 'collection') {
      renameCollection(renameTarget.id, renameValue);
    } else {
      renameRequest(renameTarget.id, renameValue);
    }

    closeRenameDialog();
  };

  const handleDeleteRequest = (
    reqId: string,
    reqName: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    setReqToDelete({ id: reqId, name: reqName });
  };

  const handleDeleteCollection = (
    colId: string,
    colName: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    setColToDelete({ id: colId, name: colName });
  };

  const handleContextMenu = (
    target: Omit<ContextMenuTarget, 'x' | 'y'>,
    event: React.MouseEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const panelRect = panelRef.current?.getBoundingClientRect();
    const relativeX = panelRect
      ? event.clientX - panelRect.left
      : event.clientX;
    const relativeY = panelRect ? event.clientY - panelRect.top : event.clientY;

    setContextMenuTarget({
      ...target,
      x: Math.max(8, Math.min(relativeX, collectionsPanelWidth - 168)),
      y: panelRect
        ? Math.max(8, Math.min(relativeY, panelRect.height - 144))
        : relativeY,
    });
  };

  const renderCollectionMenuItems = (col: { id: string; name: string }) => (
    <>
      <DropdownMenuItem
        onClick={() => {
          openRenameDialog({
            type: 'collection',
            id: col.id,
            name: col.name,
          });
          setContextMenuTarget(null);
        }}
      >
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          duplicateCollection(col.id);
          setContextMenuTarget(null);
        }}
      >
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={(event) => {
          handleDeleteCollection(col.id, col.name, event);
          setContextMenuTarget(null);
        }}
        className="text-primary-600 hover:text-primary-700 focus:text-primary-700"
      >
        Delete
      </DropdownMenuItem>
    </>
  );

  const renderRequestMenuItems = (req: { id: string; name: string }) => (
    <>
      <DropdownMenuItem
        onClick={() => {
          openRenameDialog({
            type: 'request',
            id: req.id,
            name: req.name,
          });
          setContextMenuTarget(null);
        }}
      >
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          duplicateRequest(req.id);
          setContextMenuTarget(null);
        }}
      >
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={(event) => {
          handleDeleteRequest(req.id, req.name, event);
          setContextMenuTarget(null);
        }}
        className="text-primary-600 hover:text-primary-700 focus:text-primary-700"
      >
        Delete
      </DropdownMenuItem>
    </>
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startWidth = collectionsPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      // Constrain panel width between 200px and 500px
      const newWidth = Math.max(200, Math.min(500, startWidth + deltaX));
      setCollectionsPanelWidth(newWidth);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false);
      const finalX = upEvent.clientX;
      const deltaX = finalX - startX;
      // If drag width is below 160px, collapse the panel completely
      if (startWidth + deltaX < 160) {
        setCollectionsPanelCollapsed(true);
        // Reset to default width so that when they re-open, it is a healthy size
        setCollectionsPanelWidth(320);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClick = () => {
    setCollectionsPanelCollapsed(true);
  };

  return (
    <aside
      ref={panelRef}
      className={`relative flex-shrink-0 border-r border-foreground/10 flex flex-col min-h-0 bg-white/5 dark:bg-black/10 backdrop-blur-md overflow-hidden ${
        isDragging ? '' : 'transition-all duration-300'
      }`}
      style={{ width: collectionsPanelWidth }}
    >
      <div className="p-4 border-b border-foreground/10 flex flex-col gap-3 select-none">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 shrink-0">
            <h2 className="text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500 truncate">
              {collectionsPanelWidth >= 220 ? 'Collections' : 'Cols'}
            </h2>
            <button
              onClick={() => setCollectionsPanelCollapsed(true)}
              className="p-1 rounded-lg hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-all cursor-pointer shrink-0"
              title="Collapse Sidebar"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>Collapse icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 rounded-lg text-xs shrink-0"
            onClick={() => setNewColOpen(true)}
          >
            {collectionsPanelWidth >= 240 ? '+ Collection' : '+'}
          </Button>
        </div>
        <Input
          placeholder="Search request or path..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={
            <svg
              className="w-4 h-4 text-foreground/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>Search icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredCollections.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-8">
            No collections found.
          </p>
        ) : (
          filteredCollections.map((col) => {
            const isCollapsed = collapsedCollectionIds.includes(col.id);
            return (
              <div key={col.id} className="space-y-1">
                <div
                  onClick={() => toggleCollectionCollapsed(col.id)}
                  onContextMenu={(event) =>
                    handleContextMenu(
                      { type: 'collection', id: col.id, name: col.name },
                      event,
                    )
                  }
                  className="flex items-center justify-between group cursor-pointer hover:bg-foreground/5 p-1 -mx-1 rounded-lg select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-sm font-semibold truncate text-foreground/90">
                    <svg
                      className={`w-3.5 h-3.5 text-foreground/45 transition-transform shrink-0 ${
                        isCollapsed ? '-rotate-90' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <title>Chevron icon</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    <svg
                      className="w-4 h-4 text-primary-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <title>Folder icon</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <span className="truncate">{col.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetColId(col.id);
                        setNewReqOpen(true);
                      }}
                      className="p-1 rounded hover:bg-foreground/10 text-foreground/60 hover:text-foreground"
                      title="Add Request"
                    >
                      <svg
                        className="w-3.5 h-3.5"
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
                    </button>
                    <div onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu
                        align="right"
                        className="w-40"
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 rounded-md p-0 text-foreground/70 hover:text-foreground"
                            title="Collection options"
                          >
                            <span
                              aria-hidden="true"
                              className="flex items-center gap-0.5"
                            >
                              <span className="h-1 w-1 rounded-full bg-current" />
                              <span className="h-1 w-1 rounded-full bg-current" />
                              <span className="h-1 w-1 rounded-full bg-current" />
                            </span>
                          </Button>
                        }
                      >
                        {renderCollectionMenuItems(col)}
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="pl-4 border-l border-foreground/10 space-y-1.5 pt-1.5 pb-2">
                    {col.requests.length === 0 ? (
                      <span className="text-xs text-foreground/30 pl-2">
                        Empty collection
                      </span>
                    ) : (
                      col.requests.map((req) => {
                        const isActive = req.id === activeTabId;
                        const typeColors: Record<string, string> = {
                          READ: 'bg-green-500/10 text-green-500 border-green-500/20',
                          WRITE:
                            'bg-primary-500/10 text-primary-500 border-primary-500/20',
                          GET: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                          POST: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
                        };
                        return (
                          <div
                            key={req.id}
                            ref={(element) => {
                              requestRefs.current[req.id] = element;
                            }}
                            onClick={() => openTab(req.id)}
                            onContextMenu={(event) =>
                              handleContextMenu(
                                {
                                  type: 'request',
                                  id: req.id,
                                  name: req.name,
                                },
                                event,
                              )
                            }
                            className={`flex items-center justify-between gap-2 p-2 rounded-xl text-xs cursor-pointer group transition-all ${
                              isActive
                                ? 'bg-foreground/5 font-semibold text-foreground border border-foreground/10'
                                : 'text-foreground/75 hover:bg-foreground/5 hover:text-foreground border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${typeColors[req.type]}`}
                              >
                                {req.type}
                              </span>
                              <span className="truncate">{req.name}</span>
                            </div>
                            <div
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <DropdownMenu
                                align="right"
                                className="w-40"
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 rounded-md p-0 text-foreground/70 hover:text-foreground"
                                    title="Request options"
                                  >
                                    <span
                                      aria-hidden="true"
                                      className="flex items-center gap-0.5"
                                    >
                                      <span className="h-1 w-1 rounded-full bg-current" />
                                      <span className="h-1 w-1 rounded-full bg-current" />
                                      <span className="h-1 w-1 rounded-full bg-current" />
                                    </span>
                                  </Button>
                                }
                              >
                                {renderRequestMenuItems(req)}
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Drag handle for resizing */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-500/40 active:bg-primary-500/70 transition-colors z-50 ${
          isDragging ? 'bg-primary-500/50' : ''
        }`}
      />

      {contextMenuTarget && (
        <div
          className="absolute inset-0 z-[60]"
          onClick={() => setContextMenuTarget(null)}
          onContextMenu={(event) => {
            event.preventDefault();
            setContextMenuTarget(null);
          }}
        >
          <div
            ref={contextMenuRef}
            className="absolute z-[61] w-40 overflow-hidden rounded-xl border border-foreground/10 bg-background/95 p-1 shadow-xl backdrop-blur-xl"
            style={{
              left: contextMenuTarget.x,
              top: contextMenuTarget.y,
            }}
            onClick={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.preventDefault()}
          >
            {contextMenuTarget.type === 'collection'
              ? renderCollectionMenuItems(contextMenuTarget)
              : renderRequestMenuItems(contextMenuTarget)}
          </div>
        </div>
      )}

      {/* Dialog: Rename Collection or Request */}
      <Dialog
        isOpen={!!renameTarget}
        onClose={closeRenameDialog}
        title={`Rename ${
          renameTarget?.type === 'collection' ? 'Collection' : 'Request'
        }`}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleRenameSubmit();
          }}
        >
          <Input
            label="Name"
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={closeRenameDialog}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="cursor-pointer">
              Rename
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: Confirm Delete Collection */}
      <Dialog
        isOpen={!!colToDelete}
        onClose={() => setColToDelete(null)}
        title="Delete Collection?"
        description={
          colToDelete ? (
            <span>
              Are you sure you want to delete the collection{' '}
              <strong className="text-foreground font-semibold">
                "{colToDelete.name}"
              </strong>
              ? This will permanently delete the collection and all its
              requests.
            </span>
          ) : (
            ''
          )
        }
      >
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => setColToDelete(null)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (colToDelete) {
                deleteCollection(colToDelete.id);
                setColToDelete(null);
              }
            }}
            className="cursor-pointer"
          >
            Delete
          </Button>
        </div>
      </Dialog>

      {/* Dialog: Confirm Delete Request */}
      <Dialog
        isOpen={!!reqToDelete}
        onClose={() => setReqToDelete(null)}
        title="Delete Request?"
        description={
          reqToDelete ? (
            <span>
              Are you sure you want to delete the request{' '}
              <strong className="text-foreground font-semibold">
                "{reqToDelete.name}"
              </strong>
              ? This action cannot be undone.
            </span>
          ) : (
            ''
          )
        }
      >
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => setReqToDelete(null)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (reqToDelete) {
                deleteRequest(reqToDelete.id);
                setReqToDelete(null);
              }
            }}
            className="cursor-pointer"
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </aside>
  );
};
