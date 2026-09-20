import type React from 'react';
import { useState } from 'react';
import { Button, Dialog, useToast } from '../../../../components';
import { removeGitHubStoredCredential } from '../../../../services/github';
import { LOCAL_WORKSPACE_ID, useWorkspaceStore } from '../../../../store';
import type { WorkspaceDescriptor } from '../../../../store/workspace/workspaceStoreTypes';
import { ManagementDialog } from '../shared/ManagementDialog';
import { WorkspaceDetailsPane } from './WorkspaceDetailsPane';
import { WorkspaceListPane } from './WorkspaceListPane';

interface ManageWorkspacesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageWorkspacesDialog: React.FC<ManageWorkspacesDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const {
    workspaces,
    activeWorkspaceId,
    workspaceCollections,
    collections: activeCollections,
    githubConnections,
    switchWorkspace,
    removeWorkspace,
    renameWorkspace,
    moveCollectionToWorkspace,
    removeGitHubConnection,
  } = useWorkspaceStore();

  const [inspectedWorkspaceId, setInspectedWorkspaceId] = useState<string>(
    activeWorkspaceId || LOCAL_WORKSPACE_ID,
  );
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const currentInspectedWorkspace =
    workspaces.find((w) => w.id === inspectedWorkspaceId) ||
    workspaces.find((w) => w.id === activeWorkspaceId) ||
    workspaces[0];

  const effectiveInspectedId =
    currentInspectedWorkspace?.id || LOCAL_WORKSPACE_ID;

  const inspectedCollections =
    effectiveInspectedId === activeWorkspaceId
      ? activeCollections
      : (workspaceCollections[effectiveInspectedId] ?? []);

  const otherWorkspaces = workspaces.filter(
    (w) => w.id !== effectiveInspectedId,
  );

  const handleSwitchWorkspace = (workspace: WorkspaceDescriptor) => {
    switchWorkspace(workspace.id);
    toast({
      title: 'Workspace switched',
      description: `Active workspace is now "${workspace.name}".`,
      type: 'success',
    });
  };

  const handleConfirmDelete = async () => {
    if (!workspaceToDelete) return;
    const { id: idToDelete, name: nameToDelete } = workspaceToDelete;
    const targetWs = workspaces.find((w) => w.id === idToDelete);
    const connectionId = targetWs?.github?.connectionId;
    const connection = githubConnections.find(
      (item) => item.id === connectionId,
    );
    const hasAnotherWorkspaceForConnection = workspaces.some(
      (workspace) =>
        workspace.id !== idToDelete &&
        workspace.kind === 'github' &&
        workspace.github?.connectionId === connectionId,
    );
    if (connection && !hasAnotherWorkspaceForConnection) {
      await removeGitHubStoredCredential(connection.credentialKey).catch(
        () => {},
      );
      removeGitHubConnection(connection.id);
    }
    const success = removeWorkspace(idToDelete);
    if (success) {
      toast({
        title: 'Workspace removed',
        description: `Removed workspace "${nameToDelete}".`,
        type: 'success',
      });
      if (inspectedWorkspaceId === idToDelete) {
        setInspectedWorkspaceId(LOCAL_WORKSPACE_ID);
      }
    } else {
      toast({
        title: 'Removal failed',
        description: 'Could not remove the workspace.',
        type: 'error',
      });
    }
    setWorkspaceToDelete(null);
  };

  const handleMoveCollection = (
    collectionId: string,
    collectionName: string,
    targetWorkspaceId: string,
  ) => {
    const targetWorkspace = workspaces.find((w) => w.id === targetWorkspaceId);
    if (!targetWorkspace) return;

    const success = moveCollectionToWorkspace(
      collectionId,
      effectiveInspectedId,
      targetWorkspaceId,
    );
    if (success) {
      toast({
        title: 'Collection moved',
        description: `Moved "${collectionName}" to "${targetWorkspace.name}".`,
        type: 'success',
      });
    } else {
      toast({
        title: 'Move failed',
        description: 'Could not move collection to the selected workspace.',
        type: 'error',
      });
    }
  };

  return (
    <>
      <ManagementDialog
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Workspaces"
        description="Switch between workspaces, reorganize collections across workspaces, or remove unused workspaces."
      >
        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-6 md:flex-row">
          <WorkspaceListPane
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            inspectedWorkspaceId={effectiveInspectedId}
            workspaceCollections={workspaceCollections}
            activeCollections={activeCollections}
            onSelectWorkspace={setInspectedWorkspaceId}
            onSwitchWorkspace={handleSwitchWorkspace}
            onRequestDeleteWorkspace={setWorkspaceToDelete}
          />

          {currentInspectedWorkspace && (
            <WorkspaceDetailsPane
              currentInspectedWorkspace={currentInspectedWorkspace}
              activeWorkspaceId={activeWorkspaceId}
              inspectedCollections={inspectedCollections}
              otherWorkspaces={otherWorkspaces}
              existingWorkspaceNames={workspaces.map((w) => w.name)}
              githubConnection={githubConnections.find(
                (connection) =>
                  connection.id ===
                  currentInspectedWorkspace.github?.connectionId,
              )}
              connectionWorkspaceCount={
                workspaces.filter(
                  (workspace) =>
                    workspace.github?.connectionId ===
                    currentInspectedWorkspace.github?.connectionId,
                ).length
              }
              onSwitchWorkspace={handleSwitchWorkspace}
              onRequestDeleteWorkspace={setWorkspaceToDelete}
              onRenameWorkspace={renameWorkspace}
              onMoveCollection={handleMoveCollection}
            />
          )}
        </div>

        <div className="mt-4 flex shrink-0 justify-end border-t border-foreground/10 pt-3">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </ManagementDialog>

      <Dialog
        isOpen={Boolean(workspaceToDelete)}
        onClose={() => setWorkspaceToDelete(null)}
        title="Remove Workspace"
        description={
          workspaceToDelete
            ? `Are you sure you want to remove "${workspaceToDelete.name}"? This removes the workspace and its collections from FetchX. It will not delete the remote GitHub repository.`
            : undefined
        }
        className="max-w-md"
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWorkspaceToDelete(null)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleConfirmDelete()}
          >
            Remove Workspace
          </Button>
        </div>
      </Dialog>
    </>
  );
};
