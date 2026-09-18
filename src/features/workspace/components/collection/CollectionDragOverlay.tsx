import { FolderIcon } from '../../../../assets/svgs';
import { REQUEST_METHOD_BADGE_CLASS_NAMES } from '../../constants';
import type { CollectionItem } from '../../types';
import type { DragTarget } from './CollectionReorderDialog';

interface CollectionDragOverlayProps {
  collections: CollectionItem[];
  pointerPosition: { x: number; y: number } | null;
  target: DragTarget | null;
}

export const collectionDragOverlayClassName =
  'pointer-events-none fixed z-[80] flex min-w-48 max-w-80 items-center gap-2 rounded-lg border border-primary-500/50 bg-background px-3 py-2 text-sm font-semibold shadow-xl';

export const CollectionDragOverlay = ({
  collections,
  pointerPosition,
  target,
}: CollectionDragOverlayProps) => {
  if (!target || !pointerPosition) return null;

  const collection = collections.find(
    (item) => item.id === target.collectionId,
  );
  if (!collection) return null;

  const request =
    target.type === 'request'
      ? collection.requests.find((item) => item.id === target.requestId)
      : null;

  return (
    <div
      className={collectionDragOverlayClassName}
      style={{ left: pointerPosition.x + 16, top: pointerPosition.y + 16 }}
    >
      <span
        className="text-xs tracking-tight text-foreground/35"
        aria-hidden="true"
      >
        ⠿
      </span>
      {request ? (
        <>
          <span
            className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold ${REQUEST_METHOD_BADGE_CLASS_NAMES[request.type]}`}
          >
            {request.type}
          </span>
          <span className="min-w-0 truncate text-foreground/80">
            {request.name}
          </span>
        </>
      ) : (
        <>
          <FolderIcon
            title="Collection"
            className="h-4 w-4 shrink-0 text-primary-400"
          />
          <span className="min-w-0 truncate">{collection.name}</span>
        </>
      )}
    </div>
  );
};
