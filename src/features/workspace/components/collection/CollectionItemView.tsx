import type React from 'react';
import { ChevronDownIcon, FolderIcon, PlusIcon } from '../../../../assets/svgs';
import { Button, DropdownMenu } from '../../../../components';
import type { CollectionItem } from '../../types';
import type { ContextMenuTarget } from './collectionPanelTypes';

interface CollectionItemViewProps {
  col: CollectionItem;
  activeTabId: string;
  collapsedCollectionIds: string[];
  toggleCollectionCollapsed: (id: string) => void;
  setTargetColId: (id: string) => void;
  setNewReqOpen: (open: boolean) => void;
  openTab: (id: string) => void;
  handleContextMenu: (
    target: Omit<ContextMenuTarget, 'x' | 'y'>,
    event: React.MouseEvent,
  ) => void;
  renderCollectionMenuItems: (col: {
    id: string;
    name: string;
  }) => React.ReactNode;
  renderRequestMenuItems: (req: {
    id: string;
    name: string;
  }) => React.ReactNode;
  requestRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}

export const CollectionItemView: React.FC<CollectionItemViewProps> = ({
  col,
  activeTabId,
  collapsedCollectionIds,
  toggleCollectionCollapsed,
  setTargetColId,
  setNewReqOpen,
  openTab,
  handleContextMenu,
  renderCollectionMenuItems,
  renderRequestMenuItems,
  requestRefs,
}) => {
  const isCollapsed = collapsedCollectionIds.includes(col.id);

  return (
    <div className="space-y-1">
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
          <ChevronDownIcon
            title="Toggle collection"
            className={`w-3.5 h-3.5 text-foreground/45 transition-transform shrink-0 ${
              isCollapsed ? '-rotate-90' : ''
            }`}
            strokeWidth={2.5}
          />
          <FolderIcon
            title="Collection"
            className="w-4 h-4 text-primary-400 shrink-0"
          />
          <span className="truncate">{col.name}</span>
        </div>
        <div className="flex items-center gap-1 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setTargetColId(col.id);
              setNewReqOpen(true);
            }}
            className="h-6 w-6 rounded p-0 text-foreground/60 hover:text-foreground"
            title="Add Request"
          >
            <PlusIcon
              title="Add request"
              className="w-3.5 h-3.5 shrink-0"
              strokeWidth={2}
            />
          </Button>
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
                READ: 'bg-secondary-500/10 text-secondary-600 border-secondary-500/20',
                WRITE:
                  'bg-primary-500/10 text-primary-500 border-primary-500/20',
                GET: 'bg-secondary-500/10 text-secondary-600 border-secondary-500/20',
                POST: 'bg-primary-500/10 text-primary-500 border-primary-500/20',
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
};
