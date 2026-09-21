import type React from 'react';
import { useEffect, useState } from 'react';
import {
  CheckIcon,
  ChevronDownIcon,
  FolderIcon,
  GitHubIcon,
  SpinnerIcon,
} from '../../../../assets/svgs';
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../../components';
import { isDesktopApp } from '../../../../services/platform';
import { useWorkspaceStore } from '../../../../store';
import { cn } from '../../../../utils/cn';
import { useGitHubBranchManager } from '../../hooks/useGitHubBranchManager';
import { useGitHubPullRequest } from '../../hooks/useGitHubPullRequest';
import { useWorkspaceRemoteSync } from '../../hooks/useWorkspaceRemoteSync';
import { getWorkspaceChangeCount } from '../../utils/workspaceSyncState';
import { ConnectGitHubWorkspaceDialog } from './ConnectGitHubWorkspaceDialog';
import { DesktopRequiredDialog } from './DesktopRequiredDialog';
import { GitHubBranchDialog } from './GitHubBranchDialog';
import { GitHubPullRequestDialog } from './GitHubPullRequestDialog';
import { GitHubWorkspaceActions } from './GitHubWorkspaceActions';
import { ManageWorkspacesDialog } from './ManageWorkspacesDialog';
import { WorkspaceConflictDialog } from './WorkspaceConflictDialog';

export const WorkspaceSelector: React.FC = () => {
  const {
    activeWorkspaceId,
    migrateLegacyGitHubConnections,
    switchWorkspace,
    workspaces,
  } = useWorkspaceStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isPullRequestOpen, setIsPullRequestOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  useEffect(() => {
    if (!isDesktopApp()) return;
    migrateLegacyGitHubConnections();
  }, [migrateLegacyGitHubConnections]);

  const {
    activeWorkspace,
    unpushedCommitsCount,
    unpulledCommitsCount,
    isWorking,
    syncingDirection,
    handleSync,
    conflict,
    resolveConflict,
    dismissConflict,
  } = useWorkspaceRemoteSync({
    token: '',
    onRequestToken: () => setIsDialogOpen(true),
    onError: (error) => {
      setDialogError(error);
      setIsDialogOpen(true);
    },
  });
  const showCredentialError = (error: string) => {
    setDialogError(error);
    setIsDialogOpen(true);
  };
  const branchManager = useGitHubBranchManager({
    onError: showCredentialError,
    onRequestToken: () => setIsDialogOpen(true),
  });
  const pullRequest = useGitHubPullRequest({
    onError: showCredentialError,
    onRequestToken: () => setIsDialogOpen(true),
  });

  if (!isDesktopApp()) {
    return (
      <>
        <DropdownMenu
          align="right"
          className="w-64"
          trigger={
            <Button
              variant="glass"
              size="sm"
              className="mb-1 h-8 max-w-52 gap-1.5 rounded-lg px-3 text-xs"
            >
              <FolderIcon
                title="Local workspace"
                className="h-3.5 w-3.5 shrink-0 text-foreground/55"
              />
              <span className="truncate">Local Workspace</span>
              <ChevronDownIcon
                title="Open workspace menu"
                className="h-3 w-3 shrink-0 text-foreground/45"
              />
            </Button>
          }
        >
          <DropdownMenuItem
            className="items-center gap-2 font-medium text-primary-500"
            onClick={() => setIsDialogOpen(true)}
          >
            <GitHubIcon title="GitHub workspace" className="h-4 w-4" />
            GitHub Workspaces
          </DropdownMenuItem>
        </DropdownMenu>

        <DesktopRequiredDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      </>
    );
  }

  const syncStatusText =
    syncingDirection === 'pull'
      ? 'Pulling…'
      : syncingDirection === 'push'
        ? 'Pushing…'
        : 'Syncing…';

  return (
    <>
      <DropdownMenu
        align="right"
        className="w-72"
        trigger={
          <Button
            variant="glass"
            size="sm"
            className={cn(
              'mb-1 h-8 max-w-52 gap-1.5 rounded-lg px-3 text-xs transition-colors',
              isWorking &&
                'border-primary-500/30 bg-primary-500/10 text-primary-600 dark:text-primary-400',
            )}
            aria-busy={isWorking}
          >
            {isWorking ? (
              <SpinnerIcon
                title={syncStatusText}
                className="h-3.5 w-3.5 shrink-0 animate-spin text-primary-500"
              />
            ) : activeWorkspace?.kind === 'github' ? (
              <GitHubIcon
                title="GitHub workspace"
                className="h-3.5 w-3.5 shrink-0 text-foreground/55"
              />
            ) : (
              <FolderIcon
                title="Local workspace"
                className="h-3.5 w-3.5 shrink-0 text-foreground/55"
              />
            )}
            <span className="truncate font-medium">
              {isWorking
                ? syncStatusText
                : activeWorkspace?.name || 'Local Workspace'}
            </span>
            {isWorking ? (
              <span className="relative ml-0.5 flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-500" />
              </span>
            ) : (
              <ChevronDownIcon
                title="Open workspace menu"
                className="h-3 w-3 shrink-0 text-foreground/45"
              />
            )}
          </Button>
        }
      >
        <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/45">
          Workspaces
        </div>
        {workspaces.map((workspace) => {
          const isActive = workspace.id === activeWorkspaceId;
          const changeCount = workspace.github?.syncState
            ? getWorkspaceChangeCount(workspace.github.syncState.changeIndex)
            : 0;
          const remoteStatus = workspace.github?.syncState?.remote.status;
          const workspaceStatusLabel =
            remoteStatus === 'conflict'
              ? 'Resolve changes'
              : workspace.github?.syncState?.remote.aheadBy
                ? `${workspace.github.syncState.remote.aheadBy} to pull`
                : changeCount > 0
                  ? `${changeCount} to push`
                  : null;
          return (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => {
                if (isWorking) return;
                switchWorkspace(workspace.id);
              }}
              className={cn(
                'items-center justify-between gap-2',
                isWorking && 'pointer-events-none opacity-60',
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                {workspace.kind === 'github' ? (
                  <GitHubIcon
                    title="GitHub workspace"
                    className="h-4 w-4 shrink-0"
                  />
                ) : (
                  <FolderIcon
                    title="Local workspace"
                    className="h-4 w-4 shrink-0"
                  />
                )}
                <span className="truncate">{workspace.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {isActive &&
                  (isWorking ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-primary-500">
                      <SpinnerIcon
                        title={syncStatusText}
                        className="h-3 w-3 animate-spin"
                      />
                      <span>{syncStatusText}</span>
                    </span>
                  ) : (
                    <CheckIcon
                      title="Selected workspace"
                      className="h-4 w-4 shrink-0 text-primary-500"
                    />
                  ))}
                {!isWorking && workspaceStatusLabel && (
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      remoteStatus === 'conflict' || changeCount > 0
                        ? 'text-status-modified'
                        : 'text-primary-500',
                    )}
                  >
                    {workspaceStatusLabel}
                  </span>
                )}
              </span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        {activeWorkspace?.kind === 'github' && activeWorkspace.github && (
          <GitHubWorkspaceActions
            activeWorkspace={activeWorkspace}
            isWorking={
              isWorking || branchManager.isWorking || pullRequest.isWorking
            }
            onOpenBranchDialog={() => setIsBranchOpen(true)}
            onOpenPullRequestDialog={() => setIsPullRequestOpen(true)}
            onSync={(direction) => {
              if (!isWorking) void handleSync(direction);
            }}
            syncingDirection={syncingDirection}
            unpulledCommitsCount={unpulledCommitsCount}
            unpushedCommitsCount={unpushedCommitsCount}
          />
        )}
        <DropdownMenuItem
          onClick={() => {
            if (isWorking) return;
            setIsManageOpen(true);
          }}
          className={cn(
            'font-medium text-foreground/80',
            isWorking && 'pointer-events-none opacity-60',
          )}
        >
          Manage Workspaces
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (isWorking) return;
            setDialogError(null);
            setIsDialogOpen(true);
          }}
          className={cn(
            'font-medium text-primary-500',
            isWorking && 'pointer-events-none opacity-60',
          )}
        >
          Connect GitHub repository…
        </DropdownMenuItem>
      </DropdownMenu>

      <ConnectGitHubWorkspaceDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setDialogError(null);
        }}
        initialError={dialogError}
      />

      <ManageWorkspacesDialog
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
      />

      {activeWorkspace?.kind === 'github' && activeWorkspace.github && (
        <>
          <GitHubBranchDialog
            currentBranch={activeWorkspace.github.branch}
            isDirty={branchManager.isDirty}
            isOpen={isBranchOpen}
            isWorking={branchManager.isWorking}
            onClose={() => setIsBranchOpen(false)}
            onCreate={branchManager.createBranch}
            onLoad={branchManager.loadBranches}
            onSwitch={branchManager.switchBranch}
          />
          <GitHubPullRequestDialog
            currentBranch={activeWorkspace.github.branch}
            defaultBranch={pullRequest.defaultBranch}
            hasUnpushedChanges={pullRequest.hasUnpushedChanges}
            isOpen={isPullRequestOpen}
            isWorking={pullRequest.isWorking}
            onClose={() => setIsPullRequestOpen(false)}
            onCreate={pullRequest.createPullRequest}
          />
        </>
      )}

      <WorkspaceConflictDialog
        key={conflict?.remoteCommitSha ?? 'no-conflict'}
        conflict={conflict}
        onClose={dismissConflict}
        onResolve={resolveConflict}
      />
    </>
  );
};
