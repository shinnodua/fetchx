import type React from 'react';
import {
  CheckIcon,
  FolderIcon,
  GitHubIcon,
  TrashIcon,
} from '../../../../assets/svgs';
import { Button } from '../../../../components';
import { LOCAL_WORKSPACE_ID } from '../../../../store';
import type { WorkspaceDescriptor } from '../../../../store/workspace/workspaceStoreTypes';
import { cn } from '../../../../utils/cn';
import type { CollectionItem } from '../../types';
import { getWorkspaceChangeCount } from '../../utils/workspaceSyncState';

interface WorkspaceListPaneProps {
  workspaces: WorkspaceDescriptor[];
  activeWorkspaceId: string;
  inspectedWorkspaceId: string;
  workspaceCollections: Record<string, CollectionItem[]>;
  activeCollections: CollectionItem[];
  onSelectWorkspace: (workspaceId: string) => void;
  onSwitchWorkspace: (workspace: WorkspaceDescriptor) => void;
  onRequestDeleteWorkspace: (workspace: { id: string; name: string }) => void;
}

export const WorkspaceListPane: React.FC<WorkspaceListPaneProps> = ({
  workspaces,
  activeWorkspaceId,
  inspectedWorkspaceId,
  workspaceCollections,
  activeCollections,
  onSelectWorkspace,
  onSwitchWorkspace,
  onRequestDeleteWorkspace,
}) => {
  return (
    <div className="flex w-full min-h-0 shrink-0 flex-col gap-3 md:w-80">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
          Workspaces ({workspaces.length})
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {workspaces.map((workspace) => {
          const isActive = workspace.id === activeWorkspaceId;
          const isInspected = workspace.id === inspectedWorkspaceId;
          const colsCount =
            workspace.id === activeWorkspaceId
              ? activeCollections.length
              : (workspaceCollections[workspace.id] ?? []).length;
          const changeCount = workspace.github?.syncState
            ? getWorkspaceChangeCount(workspace.github.syncState.changeIndex)
            : 0;
          const remoteStatus = workspace.github?.syncState?.remote.status;
          const syncLabel =
            remoteStatus === 'conflict'
              ? 'Resolve changes'
              : workspace.github?.syncState?.remote.aheadBy
                ? `${workspace.github.syncState.remote.aheadBy} to pull`
                : changeCount > 0
                  ? `${changeCount} to push`
                  : workspace.kind === 'github'
                    ? 'Synced'
                    : null;

          return (
            <div
              key={workspace.id}
              onClick={() => onSelectWorkspace(workspace.id)}
              className={cn(
                'group relative flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3 transition-all',
                isInspected
                  ? 'border-primary-500/40 bg-primary-500/[0.06] shadow-sm'
                  : 'border-foreground/10 bg-foreground/[0.02] hover:border-foreground/20 hover:bg-foreground/[0.04]',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {workspace.kind === 'github' ? (
                    <GitHubIcon
                      title="GitHub workspace"
                      className="h-4 w-4 shrink-0 text-foreground/70"
                    />
                  ) : (
                    <FolderIcon
                      title="Local workspace"
                      className="h-4 w-4 shrink-0 text-foreground/70"
                    />
                  )}
                  <span className="truncate text-xs font-medium text-foreground">
                    {workspace.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isActive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/10 px-2 py-0.5 text-[10px] font-medium text-primary-500">
                      <CheckIcon title="Active workspace" className="h-3 w-3" />
                      Active
                    </span>
                  )}
                  <span className="rounded bg-foreground/5 px-1.5 py-0.5 text-[10px] font-mono text-foreground/50">
                    {workspace.kind}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-foreground/50">
                <span className="truncate">
                  {workspace.github
                    ? `${workspace.github.repository} (${workspace.github.branch})`
                    : 'Local Browser Storage'}
                </span>
                <span className="shrink-0">
                  {colsCount} {colsCount === 1 ? 'col' : 'cols'}
                </span>
              </div>

              {syncLabel && (
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    remoteStatus === 'conflict' || changeCount > 0
                      ? 'text-status-modified'
                      : 'text-foreground/45',
                  )}
                >
                  {syncLabel}
                </span>
              )}

              <div className="mt-1 flex items-center justify-end gap-1.5 pt-1 border-t border-foreground/5">
                {!isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] font-normal text-foreground/70 hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSwitchWorkspace(workspace);
                    }}
                  >
                    Switch
                  </Button>
                )}
                {workspace.id !== LOCAL_WORKSPACE_ID && (
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    className="h-6 w-6 rounded-md text-primary-500/80 hover:bg-primary-500/10 hover:text-primary-600"
                    title="Remove workspace"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDeleteWorkspace({
                        id: workspace.id,
                        name: workspace.name,
                      });
                    }}
                  >
                    <TrashIcon
                      title="Remove workspace"
                      className="h-3.5 w-3.5"
                    />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
