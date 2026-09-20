import type React from 'react';
import { useState } from 'react';
import { FolderIcon } from '../../../../assets/svgs';
import { Button, Input, Select, useToast } from '../../../../components';
import { LOCAL_WORKSPACE_ID } from '../../../../store';
import type {
  GitHubConnectionDescriptor,
  WorkspaceDescriptor,
} from '../../../../store/workspace/workspaceStoreTypes';
import type { CollectionItem } from '../../types';

interface WorkspaceDetailsPaneProps {
  currentInspectedWorkspace: WorkspaceDescriptor;
  activeWorkspaceId: string;
  inspectedCollections: CollectionItem[];
  otherWorkspaces: WorkspaceDescriptor[];
  existingWorkspaceNames: string[];
  githubConnection?: GitHubConnectionDescriptor;
  connectionWorkspaceCount: number;
  onSwitchWorkspace: (workspace: WorkspaceDescriptor) => void;
  onRequestDeleteWorkspace: (workspace: { id: string; name: string }) => void;
  onRenameWorkspace: (workspaceId: string, newName: string) => boolean;
  onMoveCollection: (
    collectionId: string,
    collectionName: string,
    targetWorkspaceId: string,
  ) => void;
}

export const WorkspaceDetailsPane: React.FC<WorkspaceDetailsPaneProps> = ({
  currentInspectedWorkspace,
  activeWorkspaceId,
  inspectedCollections,
  otherWorkspaces,
  existingWorkspaceNames,
  githubConnection,
  connectionWorkspaceCount,
  onSwitchWorkspace,
  onRequestDeleteWorkspace,
  onRenameWorkspace,
  onMoveCollection,
}) => {
  const { toast } = useToast();
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  const handleStartRename = () => {
    setRenameValue(currentInspectedWorkspace.name);
    setRenameError(null);
  };

  const handleSaveRename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameError('Workspace name cannot be empty.');
      return;
    }
    const nameExists = existingWorkspaceNames.some(
      (name) =>
        name.toLowerCase() === trimmed.toLowerCase() &&
        name.toLowerCase() !== currentInspectedWorkspace.name.toLowerCase(),
    );
    if (nameExists) {
      setRenameError(`A workspace named "${trimmed}" already exists.`);
      return;
    }
    const success = onRenameWorkspace(currentInspectedWorkspace.id, trimmed);
    if (success) {
      toast({
        title: 'Workspace renamed',
        description: `Renamed to "${trimmed}".`,
        type: 'success',
      });
      setRenameValue('');
      setRenameError(null);
    } else {
      setRenameError('Could not rename workspace.');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-foreground/10 bg-background/50 p-4">
      {/* Workspace Header & Rename */}
      <div className="flex flex-col gap-2 border-b border-foreground/10 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {currentInspectedWorkspace.name}
            </h3>
            <p className="text-xs text-foreground/50">
              {currentInspectedWorkspace.kind === 'github' &&
              currentInspectedWorkspace.github
                ? `GitHub Workspace linked to ${currentInspectedWorkspace.github.repository} (${currentInspectedWorkspace.github.branch})`
                : 'Local Workspace stored in local desktop state'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentInspectedWorkspace.id !== activeWorkspaceId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSwitchWorkspace(currentInspectedWorkspace)}
              >
                Set as Active Workspace
              </Button>
            )}
            {currentInspectedWorkspace.id !== LOCAL_WORKSPACE_ID && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-500 hover:bg-primary-500/10 hover:text-primary-600"
                onClick={() =>
                  onRequestDeleteWorkspace({
                    id: currentInspectedWorkspace.id,
                    name: currentInspectedWorkspace.name,
                  })
                }
              >
                Remove Workspace
              </Button>
            )}
          </div>
        </div>

        {/* Rename Form */}
        <div className="mt-2 flex items-center gap-2">
          {renameValue !== '' ? (
            <div className="flex flex-1 items-center gap-2">
              <Input
                value={renameValue}
                onChange={(e) => {
                  setRenameValue(e.target.value);
                  setRenameError(null);
                }}
                placeholder="Workspace name"
                className="h-8 text-xs"
              />
              <Button
                variant="primary"
                size="sm"
                className="h-8 text-xs"
                onClick={handleSaveRename}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setRenameValue('');
                  setRenameError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs text-foreground/70"
              onClick={handleStartRename}
            >
              Rename workspace
            </Button>
          )}
        </div>
        {renameError && (
          <span className="text-xs text-primary-600 dark:text-primary-400">
            {renameError}
          </span>
        )}
      </div>

      {githubConnection && (
        <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold text-foreground">
                GitHub connection
              </h4>
              <p className="mt-1 text-xs text-foreground/65">
                {githubConnection.accountLogin} ·{' '}
                {githubConnection.mode === 'create'
                  ? 'Create repository'
                  : 'Connect existing'}
              </p>
              <p className="mt-1 text-[11px] text-foreground/45">
                {githubConnection.authType === 'oauth'
                  ? 'GitHub App authorization refreshes automatically.'
                  : 'Personal access token'}{' '}
                · Used by {connectionWorkspaceCount}{' '}
                {connectionWorkspaceCount === 1 ? 'workspace' : 'workspaces'}
              </p>
            </div>
            <span className="rounded bg-secondary-500/10 px-2 py-0.5 text-[10px] font-medium text-secondary-600 dark:text-secondary-400">
              Connected
            </span>
          </div>
        </div>
      )}

      {/* Collections Section */}
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Collections in this Workspace ({inspectedCollections.length})
          </h4>
          <span className="text-[11px] text-foreground/45">
            Move any collection to transfer it to another workspace
          </span>
        </div>

        {inspectedCollections.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-foreground/15 p-8 text-center">
            <FolderIcon
              title="Empty collections"
              className="h-10 w-10 text-foreground/20 mb-2"
            />
            <p className="text-xs font-medium text-foreground/60">
              No collections in this workspace.
            </p>
            <p className="text-[11px] text-foreground/40 mt-1 max-w-sm">
              You can move collections here from other workspaces, or switch to
              this workspace to create collections.
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {inspectedCollections.map((col) => (
              <div
                key={col.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3 transition-colors hover:bg-foreground/[0.04]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FolderIcon
                      title="Collection"
                      className="h-4 w-4 shrink-0 text-primary-500/80"
                    />
                    <span className="truncate text-xs font-medium text-foreground">
                      {col.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-foreground/45 mt-0.5 block">
                    {col.requests.length}{' '}
                    {col.requests.length === 1 ? 'request' : 'requests'}
                  </span>
                </div>

                {otherWorkspaces.length > 0 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-foreground/50 hidden sm:inline">
                      Move to:
                    </span>
                    <div className="w-40 sm:w-44">
                      <Select
                        value=""
                        onChange={(targetId) => {
                          if (targetId) {
                            onMoveCollection(col.id, col.name, targetId);
                          }
                        }}
                        placeholder="Select workspace…"
                        options={otherWorkspaces.map((w) => ({
                          value: w.id,
                          label: w.name,
                        }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
