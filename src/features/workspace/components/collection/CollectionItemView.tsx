import type React from 'react';
import {
  ChevronDownIcon,
  FolderIcon,
  PlusIcon,
  TrashIcon,
} from '../../../../assets/svgs';
import { Button, DropdownMenu } from '../../../../components';
import { REQUEST_METHOD_BADGE_CLASS_NAMES } from '../../constants';
import type { CollectionItem, SavedResponse } from '../../types';
import type { ContextMenuTarget } from './collectionPanelTypes';

interface CollectionItemViewProps {
  col: CollectionItem;
  activeTabId: string;
  collapsedCollectionIds: string[];
  toggleCollectionCollapsed: (id: string) => void;
  setTargetColId: (id: string) => void;
  setNewReqOpen: (open: boolean) => void;
  openTab: (id: string) => void;
  toggleSavedResponsesCollapsed: (id: string) => void;
  openSavedResponse: (savedResponse: SavedResponse) => void;
  confirmDeleteSavedResponse: (
    reqId: string,
    savedResponse: SavedResponse,
  ) => void;
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

export const collectionRequestRowClassName =
  'group flex min-w-0 cursor-pointer items-center justify-between gap-1.5 rounded-lg border px-1.5 py-0.5 text-xs transition-all';

export const CollectionItemView: React.FC<CollectionItemViewProps> = ({
  col,
  activeTabId,
  collapsedCollectionIds,
  toggleCollectionCollapsed,
  setTargetColId,
  setNewReqOpen,
  openTab,
  toggleSavedResponsesCollapsed,
  openSavedResponse,
  confirmDeleteSavedResponse,
  handleContextMenu,
  renderCollectionMenuItems,
  renderRequestMenuItems,
  requestRefs,
}) => {
  const isCollapsed = collapsedCollectionIds.includes(col.id);

  return (
    <div className="space-y-0.5">
      <div
        onClick={() => toggleCollectionCollapsed(col.id)}
        onContextMenu={(event) =>
          handleContextMenu(
            { type: 'collection', id: col.id, name: col.name },
            event,
          )
        }
        className="-mx-0.5 flex cursor-pointer select-none items-center justify-between rounded-md px-0.5 py-0.5 transition-colors hover:bg-foreground/5"
      >
        <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-foreground/90">
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
          <span className="min-w-0 truncate">{col.name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1 transition-opacity">
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
        <div className="space-y-0.5 border-l border-foreground/10 py-0.5 pl-0.5">
          {col.requests.length === 0 ? (
            <span className="text-xs text-foreground/30 pl-2">
              Empty collection
            </span>
          ) : (
            col.requests.map((req) => {
              const isActive = req.id === activeTabId;
              const savedResponses = req.savedResponses ?? [];
              const hasSavedResponses = savedResponses.length > 0;
              const savedResponsesCollapsed =
                req.savedResponsesCollapsed ?? false;
              return (
                <div key={req.id} className="space-y-0.5">
                  <div
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
                    className={`${collectionRequestRowClassName} ${
                      isActive
                        ? 'bg-foreground/5 font-semibold text-foreground border border-foreground/10'
                        : 'text-foreground/75 hover:bg-foreground/5 hover:text-foreground border border-transparent'
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      {hasSavedResponses ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSavedResponsesCollapsed(req.id);
                          }}
                          className="h-5 w-5 shrink-0 rounded p-0 text-foreground/55 hover:text-foreground"
                          title={
                            savedResponsesCollapsed
                              ? 'Expand saved responses'
                              : 'Collapse saved responses'
                          }
                        >
                          <ChevronDownIcon
                            title="Toggle saved responses"
                            className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                              savedResponsesCollapsed ? '-rotate-90' : ''
                            }`}
                            strokeWidth={2.5}
                          />
                        </Button>
                      ) : (
                        <span className="h-5 w-5 shrink-0" />
                      )}
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold border ${REQUEST_METHOD_BADGE_CLASS_NAMES[req.type]}`}
                      >
                        {req.type}
                      </span>
                      <span className="min-w-0 truncate" title={req.name}>
                        {req.name}
                      </span>
                    </div>
                    <div
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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

                  {hasSavedResponses && !savedResponsesCollapsed && (
                    <div className="ml-7 space-y-0.5 border-l border-foreground/10 pl-1.5">
                      {savedResponses.map((savedResponse) => (
                        <div
                          key={savedResponse.id}
                          className="group/response flex min-w-0 items-center gap-1 rounded-md border border-transparent pr-0.5 transition-colors hover:border-foreground/10 hover:bg-foreground/5"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openSavedResponse(savedResponse)}
                            className="flex h-auto min-w-0 flex-1 justify-start gap-1.5 rounded-md px-1.5 py-0.5 text-left text-[11px] text-foreground/60 hover:bg-transparent hover:text-foreground"
                          >
                            <span className="shrink-0 rounded border border-secondary-500/20 bg-secondary-500/10 px-1.5 py-0.5 text-[8px] font-bold text-secondary-600">
                              RES
                            </span>
                            <span
                              className="min-w-0 truncate"
                              title={savedResponse.name}
                            >
                              {savedResponse.name}
                            </span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              confirmDeleteSavedResponse(req.id, savedResponse);
                            }}
                            className="h-6 w-6 shrink-0 rounded-md p-0 text-primary-500/60 opacity-0 hover:text-primary-500 group-hover/response:opacity-100"
                            title="Delete saved response"
                          >
                            <TrashIcon
                              title="Delete saved response"
                              className="h-3.5 w-3.5 shrink-0"
                              strokeWidth={1.75}
                            />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
