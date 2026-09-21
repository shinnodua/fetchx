import { GitHubIcon, SpinnerIcon } from '../../../../assets/svgs';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../../components';
import type { WorkspaceDescriptor } from '../../../../store/workspace/workspaceStoreTypes';
import { cn } from '../../../../utils/cn';

interface GitHubWorkspaceActionsProps {
  activeWorkspace: WorkspaceDescriptor;
  isWorking: boolean;
  onOpenBranchDialog: () => void;
  onOpenPullRequestDialog: () => void;
  onSync: (direction: 'pull' | 'push') => void;
  syncingDirection: 'pull' | 'push' | null;
  unpulledCommitsCount: number | null;
  unpushedCommitsCount: number;
}

export const GitHubWorkspaceActions = ({
  activeWorkspace,
  isWorking,
  onOpenBranchDialog,
  onOpenPullRequestDialog,
  onSync,
  syncingDirection,
  unpulledCommitsCount,
  unpushedCommitsCount,
}: GitHubWorkspaceActionsProps) => {
  const github = activeWorkspace.github;
  if (!github) return null;

  const actionClassName = cn(
    'flex items-center justify-between gap-3 font-medium text-foreground/85',
    isWorking && 'pointer-events-none opacity-60',
  );

  return (
    <>
      <DropdownMenuItem
        onClick={() => void onSync('pull')}
        className={cn(
          actionClassName,
          syncingDirection === 'pull' &&
            'bg-primary-500/10 text-primary-600 opacity-100 dark:text-primary-400',
        )}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {syncingDirection === 'pull' && (
            <SpinnerIcon
              title="Pulling"
              className="h-3.5 w-3.5 shrink-0 animate-spin text-primary-500"
            />
          )}
          <span className="truncate">
            {syncingDirection === 'pull'
              ? `Pulling from GitHub (${github.branch})…`
              : `Pull from GitHub (${github.branch})`}
          </span>
        </span>
        <span
          className={cn(
            'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums',
            syncingDirection === 'pull'
              ? 'animate-pulse bg-primary-500/20 font-semibold text-primary-600 dark:text-primary-400'
              : unpulledCommitsCount && unpulledCommitsCount > 0
                ? 'bg-primary-500/15 font-semibold text-primary-500'
                : 'bg-foreground/5 text-foreground/50',
          )}
        >
          {syncingDirection === 'pull'
            ? 'Pulling…'
            : unpulledCommitsCount === null
              ? '…'
              : `${unpulledCommitsCount} ${unpulledCommitsCount === 1 ? 'commit' : 'commits'}`}
        </span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => void onSync('push')}
        className={cn(
          actionClassName,
          syncingDirection === 'push' &&
            'bg-primary-500/10 text-primary-600 opacity-100 dark:text-primary-400',
        )}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {syncingDirection === 'push' && (
            <SpinnerIcon
              title="Pushing"
              className="h-3.5 w-3.5 shrink-0 animate-spin text-primary-500"
            />
          )}
          <span className="truncate">
            {syncingDirection === 'push'
              ? `Pushing to GitHub (${github.branch})…`
              : `Push to GitHub (${github.branch})`}
          </span>
        </span>
        <span
          className={cn(
            'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums',
            syncingDirection === 'push'
              ? 'animate-pulse bg-primary-500/20 font-semibold text-primary-600 dark:text-primary-400'
              : unpushedCommitsCount > 0
                ? 'bg-primary-500/15 font-semibold text-primary-600 dark:text-primary-400'
                : 'bg-foreground/5 text-foreground/50',
          )}
        >
          {syncingDirection === 'push'
            ? 'Pushing…'
            : `${unpushedCommitsCount} ${unpushedCommitsCount === 1 ? 'commit' : 'commits'}`}
        </span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={onOpenBranchDialog}
        className={actionClassName}
      >
        <span className="flex items-center gap-2">
          <GitHubIcon title="GitHub branch" className="h-3.5 w-3.5" />
          Switch branch…
        </span>
        <span className="text-[10px] text-foreground/50">{github.branch}</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={onOpenPullRequestDialog}
        className={actionClassName}
      >
        Create pull request…
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  );
};
