import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, FolderIcon } from '../../../../assets/svgs';
import { Button } from '../../../../components';
import { REQUEST_METHOD_BADGE_CLASS_NAMES } from '../../constants';
import type { CollectionItem } from '../../types';
import type { ReorderPlacement } from '../../utils/collectionOrder';
import {
  reorderCollections,
  reorderRequests,
} from '../../utils/collectionOrder';
import { ManagementDialog } from '../shared/ManagementDialog';
import { CollectionDragOverlay } from './CollectionDragOverlay';

export type DragTarget =
  | { type: 'collection'; collectionId: string }
  | { type: 'request'; collectionId: string; requestId: string };

interface DragInsertion {
  target: DragTarget;
  placement: ReorderPlacement;
}

interface CollectionReorderDialogProps {
  collections: CollectionItem[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (collections: CollectionItem[]) => void;
}

const getPointerDropInsertion = (clientX: number, clientY: number) => {
  const row = document
    .elementFromPoint(clientX, clientY)
    ?.closest<HTMLElement>('[data-reorder-target]');
  const type = row?.dataset.reorderType;
  const collectionId = row?.dataset.collectionId;

  if (!row || !collectionId) return null;
  const placement: ReorderPlacement =
    clientY >
    row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2
      ? 'after'
      : 'before';
  if (type === 'collection') {
    return { target: { type, collectionId } as const, placement };
  }

  const requestId = row.dataset.requestId;
  if (type === 'request' && requestId) {
    return {
      target: { type, collectionId, requestId } as const,
      placement,
    };
  }

  return null;
};

export const canDrop = (source: DragTarget | null, target: DragTarget) => {
  if (!source || source.type !== target.type) return false;
  if (source.type === 'collection' && target.type === 'collection') {
    return source.collectionId !== target.collectionId;
  }
  if (source.type === 'request' && target.type === 'request') {
    return (
      source.collectionId === target.collectionId &&
      source.requestId !== target.requestId
    );
  }
  return false;
};

export const CollectionReorderDialog = ({
  collections,
  isOpen,
  onClose,
  onSave,
}: CollectionReorderDialogProps) => {
  const [orderedCollections, setOrderedCollections] = useState(collections);
  const [draggedTarget, setDraggedTarget] = useState<DragTarget | null>(null);
  const [dragInsertion, setDragInsertion] = useState<DragInsertion | null>(
    null,
  );
  const [pointerPosition, setPointerPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [expandedCollectionIds, setExpandedCollectionIds] = useState<string[]>(
    [],
  );
  const pointerIdRef = useRef<number | null>(null);
  const lastPreviewKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setOrderedCollections(collections);
    setDraggedTarget(null);
    setDragInsertion(null);
    setPointerPosition(null);
    setExpandedCollectionIds([]);
    pointerIdRef.current = null;
    lastPreviewKeyRef.current = null;
  }, [collections, isOpen]);

  const resetPointerDrag = useCallback(() => {
    pointerIdRef.current = null;
    setDraggedTarget(null);
    setDragInsertion(null);
    setPointerPosition(null);
  }, []);

  const toggleCollectionExpanded = (collectionId: string) => {
    setExpandedCollectionIds((currentIds) =>
      currentIds.includes(collectionId)
        ? currentIds.filter((id) => id !== collectionId)
        : [...currentIds, collectionId],
    );
  };

  const applyDrop = useCallback(
    (source: DragTarget, insertion: DragInsertion) => {
      const { placement, target } = insertion;
      if (!canDrop(source, target)) return;

      setOrderedCollections((currentCollections) => {
        if (source.type === 'collection' && target.type === 'collection') {
          return reorderCollections(
            currentCollections,
            source.collectionId,
            target.collectionId,
            placement,
          );
        }
        if (source.type === 'request' && target.type === 'request') {
          return reorderRequests(
            currentCollections,
            source.collectionId,
            source.requestId,
            target.requestId,
            placement,
          );
        }
        return currentCollections;
      });
    },
    [],
  );

  const startPointerDrag = (
    target: DragTarget,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if ((event.target as HTMLElement).closest('button')) return;
    event.preventDefault();
    pointerIdRef.current = event.pointerId;
    lastPreviewKeyRef.current = null;
    setPointerPosition({ x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggedTarget(target);
  };

  useEffect(() => {
    if (!draggedTarget) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerIdRef.current) return;
      const insertion = getPointerDropInsertion(event.clientX, event.clientY);
      setPointerPosition({ x: event.clientX, y: event.clientY });
      if (!insertion || !canDrop(draggedTarget, insertion.target)) {
        setDragInsertion(null);
        return;
      }

      setDragInsertion(insertion);
      const targetKey = `${insertion.target.type}:${insertion.target.collectionId}:${
        insertion.target.type === 'request' ? insertion.target.requestId : ''
      }:${insertion.placement}`;
      if (targetKey === lastPreviewKeyRef.current) return;

      lastPreviewKeyRef.current = targetKey;
      applyDrop(draggedTarget, insertion);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerIdRef.current) return;
      resetPointerDrag();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [applyDrop, draggedTarget, resetPointerDrag]);

  const isInsertionTarget = (
    target: DragTarget,
    placement: ReorderPlacement,
  ) => {
    if (target.type === 'collection') {
      return (
        dragInsertion?.target.type === 'collection' &&
        dragInsertion.target.collectionId === target.collectionId &&
        dragInsertion.placement === placement
      );
    }
    return (
      dragInsertion?.target.type === 'request' &&
      dragInsertion.target.collectionId === target.collectionId &&
      dragInsertion.target.requestId === target.requestId &&
      dragInsertion.placement === placement
    );
  };

  return (
    <ManagementDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Collections"
      description="Drag collections or a request within its collection. The list previews its new position as you move."
    >
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {orderedCollections.map((collection) => {
          const isExpanded = expandedCollectionIds.includes(collection.id);
          return (
            <div
              key={collection.id}
              className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-2 transition-all duration-200 ease-out"
            >
              <div
                data-reorder-target
                data-reorder-type="collection"
                data-collection-id={collection.id}
                onPointerDown={(event) =>
                  startPointerDrag(
                    { type: 'collection', collectionId: collection.id },
                    event,
                  )
                }
                className={`relative flex cursor-grab select-none items-center gap-2 rounded-lg border px-2.5 py-2 text-sm font-semibold transition-[transform,opacity,background-color,border-color] duration-200 ease-out active:cursor-grabbing ${
                  draggedTarget?.type === 'collection' &&
                  draggedTarget.collectionId === collection.id
                    ? 'scale-[0.99] opacity-40'
                    : ''
                } ${
                  isInsertionTarget(
                    { type: 'collection', collectionId: collection.id },
                    'before',
                  )
                    ? 'before:absolute before:-top-1 before:inset-x-2 before:h-0.5 before:rounded-full before:bg-primary-500'
                    : ''
                } ${
                  isInsertionTarget(
                    { type: 'collection', collectionId: collection.id },
                    'after',
                  )
                    ? 'after:absolute after:-bottom-1 after:inset-x-2 after:h-0.5 after:rounded-full after:bg-primary-500'
                    : ''
                } border-transparent bg-background hover:bg-foreground/5`}
              >
                <span
                  className="text-xs tracking-tight text-foreground/35"
                  aria-hidden="true"
                >
                  ⠿
                </span>
                <FolderIcon
                  title="Collection"
                  className="h-4 w-4 shrink-0 text-primary-400"
                />
                <span className="min-w-0 truncate">{collection.name}</span>
                <span className="ml-auto text-xs font-medium text-foreground/45">
                  {collection.requests.length}{' '}
                  {collection.requests.length === 1 ? 'request' : 'requests'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleCollectionExpanded(collection.id);
                  }}
                  className="h-6 w-6 shrink-0 rounded-md p-0 text-foreground/55 hover:text-foreground"
                  title={isExpanded ? 'Collapse requests' : 'Expand requests'}
                >
                  <ChevronDownIcon
                    title={isExpanded ? 'Collapse requests' : 'Expand requests'}
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                      isExpanded ? '' : '-rotate-90'
                    }`}
                    strokeWidth={2.5}
                  />
                </Button>
              </div>

              {isExpanded && (
                <div className="mt-1.5 space-y-1 border-l border-foreground/10 pl-3">
                  {collection.requests.length === 0 ? (
                    <p className="py-1 text-xs text-foreground/40">
                      No requests
                    </p>
                  ) : (
                    collection.requests.map((request) => {
                      const requestTarget: DragTarget = {
                        type: 'request',
                        collectionId: collection.id,
                        requestId: request.id,
                      };
                      return (
                        <div
                          key={request.id}
                          data-reorder-target
                          data-reorder-type="request"
                          data-collection-id={collection.id}
                          data-request-id={request.id}
                          onPointerDown={(event) =>
                            startPointerDrag(requestTarget, event)
                          }
                          className={`relative flex cursor-grab select-none items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-[transform,opacity,background-color,border-color] duration-200 ease-out active:cursor-grabbing ${
                            draggedTarget?.type === 'request' &&
                            draggedTarget.requestId === request.id
                              ? 'scale-[0.99] opacity-40'
                              : ''
                          } ${
                            isInsertionTarget(requestTarget, 'before')
                              ? 'before:absolute before:-top-1 before:inset-x-2 before:h-0.5 before:rounded-full before:bg-secondary-500'
                              : ''
                          } ${
                            isInsertionTarget(requestTarget, 'after')
                              ? 'after:absolute after:-bottom-1 after:inset-x-2 after:h-0.5 after:rounded-full after:bg-secondary-500'
                              : ''
                          } border-transparent hover:bg-foreground/5`}
                        >
                          <span
                            className="text-xs tracking-tight text-foreground/35"
                            aria-hidden="true"
                          >
                            ⠿
                          </span>
                          <span
                            className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold ${REQUEST_METHOD_BADGE_CLASS_NAMES[request.type]}`}
                          >
                            {request.type}
                          </span>
                          <span className="min-w-0 truncate text-foreground/80">
                            {request.name}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end gap-3 border-t border-foreground/10 pt-4">
        <Button variant="ghost" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="button"
          onClick={() => {
            onSave(orderedCollections);
            onClose();
          }}
        >
          Save order
        </Button>
      </div>
      <CollectionDragOverlay
        collections={orderedCollections}
        pointerPosition={pointerPosition}
        target={draggedTarget}
      />
    </ManagementDialog>
  );
};
