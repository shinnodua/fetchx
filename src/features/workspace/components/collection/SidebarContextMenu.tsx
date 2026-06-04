import type React from 'react';
import type { ContextMenuTarget } from './collectionPanelTypes';

interface SidebarContextMenuProps {
  target: ContextMenuTarget;
  contextMenuRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  renderCollectionMenuItems: (col: {
    id: string;
    name: string;
  }) => React.ReactNode;
  renderRequestMenuItems: (req: {
    id: string;
    name: string;
  }) => React.ReactNode;
}

export const SidebarContextMenu: React.FC<SidebarContextMenuProps> = ({
  target,
  contextMenuRef,
  onClose,
  renderCollectionMenuItems,
  renderRequestMenuItems,
}) => {
  return (
    <div
      className="absolute inset-0 z-[60]"
      onClick={onClose}
      onContextMenu={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div
        ref={contextMenuRef}
        className="absolute z-[61] w-40 overflow-hidden rounded-xl border border-foreground/10 bg-background/95 p-1 shadow-xl backdrop-blur-xl"
        style={{
          left: target.x,
          top: target.y,
        }}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.preventDefault()}
      >
        {target.type === 'collection'
          ? renderCollectionMenuItems(target)
          : renderRequestMenuItems(target)}
      </div>
    </div>
  );
};
