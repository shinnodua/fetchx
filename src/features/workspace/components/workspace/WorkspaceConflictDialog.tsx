import { useEffect, useState } from 'react';
import { Alert, Button, Dialog } from '../../../../components';
import type { WorkspaceSyncConflict } from '../../utils/workspaceSyncState';

interface WorkspaceConflictDialogProps {
  conflict: WorkspaceSyncConflict | null;
  onClose: () => void;
  onResolve: (resolutions: Record<string, 'local' | 'remote'>) => void;
}

export const WorkspaceConflictDialog = ({
  conflict,
  onClose,
  onResolve,
}: WorkspaceConflictDialogProps) => {
  const [resolutions, setResolutions] = useState<
    Record<string, 'local' | 'remote'>
  >({});

  useEffect(() => {
    setResolutions(
      Object.fromEntries(
        (conflict?.entries ?? []).map((entry) => [entry.id, 'local']),
      ),
    );
  }, [conflict]);

  if (!conflict) return null;

  const chooseAll = (choice: 'local' | 'remote') =>
    setResolutions(
      Object.fromEntries(conflict.entries.map((entry) => [entry.id, choice])),
    );

  return (
    <Dialog
      isOpen
      onClose={onClose}
      title="Resolve GitHub changes"
      description="Both this workspace and GitHub changed since the last sync. Choose the version to keep for each collection."
      className="max-h-[calc(100dvh-1.5rem)] overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <Alert variant="warning" title="Concurrent changes detected">
          {conflict.entries.length} collection
          {conflict.entries.length === 1 ? '' : 's'} need your decision.
        </Alert>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => chooseAll('local')}
          >
            Keep all local
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => chooseAll('remote')}
          >
            Use all remote
          </Button>
        </div>
        <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
          {conflict.entries.map((entry) => {
            const choice = resolutions[entry.id] ?? 'local';
            return (
              <div
                key={entry.id}
                className="rounded-xl border border-foreground/10 p-3"
              >
                <p className="truncate text-sm font-semibold">{entry.label}</p>
                <p className="mt-1 text-xs text-foreground/55">
                  Local: {entry.local?.name ?? 'Deleted'} · GitHub:{' '}
                  {entry.remote?.name ?? 'Deleted'}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant={choice === 'local' ? 'primary' : 'outline'}
                    onClick={() =>
                      setResolutions((current) => ({
                        ...current,
                        [entry.id]: 'local',
                      }))
                    }
                  >
                    Keep local
                  </Button>
                  <Button
                    size="sm"
                    variant={choice === 'remote' ? 'secondary' : 'outline'}
                    onClick={() =>
                      setResolutions((current) => ({
                        ...current,
                        [entry.id]: 'remote',
                      }))
                    }
                  >
                    Use GitHub
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 border-t border-foreground/10 pt-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onResolve(resolutions)}>
            Apply resolution
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
