import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../../components';
import { useWorkspaceStore } from '../../../../store';
import type { CollectionItem, SavedResponse } from '../../types';
import { RequestMenuItems } from '../request/RequestMenuItems';
import { ResponsePayloadDialog } from '../request/response/ResponsePayloadViewer';
import { CollectionItemView } from './CollectionItemView';
import { CollectionPanelDialogs } from './CollectionPanelDialogs';
import { CollectionReorderDialog } from './CollectionReorderDialog';
import type { ContextMenuTarget, RenameTarget } from './collectionPanelTypes';
import { SidebarContextMenu } from './SidebarContextMenu';
import { SidebarHeader } from './SidebarHeader';

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
    deleteRequest,
    openTab,
    toggleSavedResponsesCollapsed,
    deleteSavedResponse,
    setRequestToRevealId,
    setCollections,
    toggleCollectionCollapsed,
    setCollectionsPanelWidth,
    setCollectionsPanelCollapsed,
  } = useWorkspaceStore();

  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const requestRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const safeCollectionsPanelWidth =
    Number.isFinite(collectionsPanelWidth) && collectionsPanelWidth > 0
      ? Math.max(200, Math.min(500, collectionsPanelWidth))
      : 320;

  const filteredCollections = useMemo<CollectionItem[]>(() => {
    if (!searchTerm.trim()) return collections;
    const lower = searchTerm.toLowerCase();
    return collections
      .map((col) => {
        const filteredReqs = col.requests.filter(
          (req) =>
            req.name.toLowerCase().includes(lower) ||
            req.target.toLowerCase().includes(lower) ||
            (req.savedResponses ?? []).some((savedResponse) =>
              savedResponse.name.toLowerCase().includes(lower),
            ),
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
  const [savedResponseToDelete, setSavedResponseToDelete] = useState<{
    reqId: string;
    id: string;
    name: string;
  } | null>(null);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [selectedSavedResponse, setSelectedSavedResponse] =
    useState<SavedResponse | null>(null);
  const [contextMenuTarget, setContextMenuTarget] =
    useState<ContextMenuTarget | null>(null);
  const [reorderCollectionName, setReorderCollectionName] = useState<
    string | null
  >(null);

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
      x: Math.max(8, Math.min(relativeX, safeCollectionsPanelWidth - 168)),
      y: panelRect
        ? Math.max(8, Math.min(relativeY, panelRect.height - 144))
        : relativeY,
    });
  };

  const renderCollectionMenuItems = (col: { id: string; name: string }) => (
    <>
      <DropdownMenuItem
        onClick={() => {
          setReorderCollectionName(col.name);
          setContextMenuTarget(null);
        }}
      >
        Reorder
      </DropdownMenuItem>
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
    <RequestMenuItems
      req={req}
      onClose={() => setContextMenuTarget(null)}
      openRenameDialog={openRenameDialog}
      handleDeleteRequest={handleDeleteRequest}
    />
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startWidth = safeCollectionsPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(200, Math.min(500, startWidth + deltaX));
      setCollectionsPanelWidth(newWidth);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false);
      const finalX = upEvent.clientX;
      const deltaX = finalX - startX;
      if (startWidth + deltaX < 160) {
        setCollectionsPanelCollapsed(true);
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
      style={
        {
          '--panel-width': `${safeCollectionsPanelWidth}px`,
        } as React.CSSProperties
      }
      className={`fixed md:relative left-0 top-0 h-full z-40 border-r border-foreground/10 flex flex-col min-h-0 shrink-0 bg-background/95 md:bg-white/5 dark:md:bg-black/10 backdrop-blur-md overflow-hidden shadow-2xl md:shadow-none w-[280px] md:w-[var(--panel-width)] ${
        isDragging ? '' : 'transition-all duration-300'
      }`}
    >
      <SidebarHeader
        collectionsPanelWidth={safeCollectionsPanelWidth}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setNewColOpen={setNewColOpen}
        setCollectionsPanelCollapsed={setCollectionsPanelCollapsed}
      />

      {/* Collections List */}
      <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {filteredCollections.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-8">
            No collections found.
          </p>
        ) : (
          filteredCollections.map((col) => (
            <CollectionItemView
              key={col.id}
              col={col}
              activeTabId={activeTabId}
              collapsedCollectionIds={collapsedCollectionIds}
              toggleCollectionCollapsed={toggleCollectionCollapsed}
              setTargetColId={setTargetColId}
              setNewReqOpen={setNewReqOpen}
              openTab={openTab}
              toggleSavedResponsesCollapsed={toggleSavedResponsesCollapsed}
              openSavedResponse={setSelectedSavedResponse}
              confirmDeleteSavedResponse={(reqId, savedResponse) =>
                setSavedResponseToDelete({
                  reqId,
                  id: savedResponse.id,
                  name: savedResponse.name,
                })
              }
              handleContextMenu={handleContextMenu}
              renderCollectionMenuItems={renderCollectionMenuItems}
              renderRequestMenuItems={renderRequestMenuItems}
              requestRefs={requestRefs}
            />
          ))
        )}
      </div>

      {/* Drag handle for resizing */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className={`hidden md:block absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-500/40 active:bg-primary-500/70 transition-colors z-50 ${
          isDragging ? 'bg-primary-500/50' : ''
        }`}
      />

      {contextMenuTarget && (
        <SidebarContextMenu
          target={contextMenuTarget}
          contextMenuRef={contextMenuRef}
          onClose={() => setContextMenuTarget(null)}
          renderCollectionMenuItems={renderCollectionMenuItems}
          renderRequestMenuItems={renderRequestMenuItems}
        />
      )}

      <CollectionPanelDialogs
        renameTarget={renameTarget}
        renameValue={renameValue}
        colToDelete={colToDelete}
        reqToDelete={reqToDelete}
        setRenameValue={setRenameValue}
        closeRenameDialog={closeRenameDialog}
        handleRenameSubmit={handleRenameSubmit}
        setColToDelete={setColToDelete}
        setReqToDelete={setReqToDelete}
        savedResponseToDelete={savedResponseToDelete}
        setSavedResponseToDelete={setSavedResponseToDelete}
        deleteCollection={deleteCollection}
        deleteRequest={deleteRequest}
        deleteSavedResponse={deleteSavedResponse}
      />

      <CollectionReorderDialog
        collections={collections}
        isOpen={reorderCollectionName !== null}
        onClose={() => setReorderCollectionName(null)}
        onSave={setCollections}
      />

      {selectedSavedResponse && (
        <ResponsePayloadDialog
          data={selectedSavedResponse.response.data}
          isOpen={selectedSavedResponse !== null}
          onClose={() => setSelectedSavedResponse(null)}
          title={selectedSavedResponse.name}
        />
      )}
    </aside>
  );
};
