import { useState } from 'react';
import { Alert, Badge, Button, Textarea } from '../../../../components';
import type {
  WorkspaceConflictResolution,
  WorkspaceSyncConflict,
  WorkspaceSyncConflictBlock,
} from '../../utils/workspaceSyncState';
import { ManagementDialog } from '../shared/ManagementDialog';
import {
  createBulkConflictResolutions,
  describeConflictPath,
  formatConflictValue,
  parseCustomConflictValue,
} from './conflictEditorState';

export const conflictListClassName =
  'h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-foreground/10 bg-foreground/[0.015]';

interface WorkspaceConflictDialogProps {
  conflict: WorkspaceSyncConflict | null;
  onClose: () => void;
  onResolve: (resolutions: Record<string, WorkspaceConflictResolution>) => void;
}

const ConflictValue = ({
  title,
  block,
  side,
}: {
  title: string;
  block: WorkspaceSyncConflictBlock;
  side: 'local' | 'remote';
}) => {
  const value = block[side];
  return (
    <div className="min-w-0 rounded-xl border border-foreground/10 bg-foreground/[0.025] p-3">
      <p className="mb-2 text-xs font-semibold text-foreground/65">{title}</p>
      {value.exists ? (
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5">
          {formatConflictValue(value)}
        </pre>
      ) : (
        <p className="text-xs italic text-foreground/45">Deleted</p>
      )}
    </div>
  );
};

export const WorkspaceConflictDialog = ({
  conflict,
  onClose,
  onResolve,
}: WorkspaceConflictDialogProps) => {
  const [resolutions, setResolutions] = useState<
    Record<string, WorkspaceConflictResolution>
  >({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!conflict) return null;

  const chooseAll = (choice: 'local' | 'remote') => {
    setResolutions(createBulkConflictResolutions(conflict.entries, choice));
    setErrors({});
  };
  const resolvedCount = Object.keys(resolutions).length;
  const canApply =
    resolvedCount === conflict.entries.length &&
    Object.keys(errors).length === 0;
  const groups = Object.entries(
    conflict.entries.reduce<Record<string, WorkspaceSyncConflictBlock[]>>(
      (current, entry) => {
        current[entry.collectionId] ??= [];
        current[entry.collectionId].push(entry);
        return current;
      },
      {},
    ),
  );

  const choose = (
    block: WorkspaceSyncConflictBlock,
    choice: 'local' | 'remote',
  ) => {
    setResolutions((current) => ({ ...current, [block.id]: { choice } }));
    setErrors((current) => {
      const next = { ...current };
      delete next[block.id];
      return next;
    });
  };

  const edit = (block: WorkspaceSyncConflictBlock, source: string) => {
    setDrafts((current) => ({ ...current, [block.id]: source }));
    const parsed = parseCustomConflictValue(source);
    if (parsed.error || !parsed.value) {
      setErrors((current) => ({
        ...current,
        [block.id]: parsed.error ?? 'Invalid value.',
      }));
      setResolutions((current) => {
        const next = { ...current };
        delete next[block.id];
        return next;
      });
      return;
    }
    setErrors((current) => {
      const next = { ...current };
      delete next[block.id];
      return next;
    });
    setResolutions((current) => ({
      ...current,
      [block.id]: { choice: 'custom', custom: parsed.value },
    }));
  };

  return (
    <ManagementDialog
      isOpen
      onClose={onClose}
      title="Resolve GitHub changes"
      description="Review each collision. Non-overlapping changes have already been merged."
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
          <Alert variant="warning" title="Concurrent changes detected">
            {conflict.entries.length} conflict
            {conflict.entries.length === 1 ? '' : 's'} need your decision.
          </Alert>
          <Badge variant={canApply ? 'secondary' : 'ghost'}>
            {resolvedCount} of {conflict.entries.length} resolved
          </Badge>
        </div>
        <div className="mb-3 flex shrink-0 gap-2">
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
        <section aria-label="Conflict list" className={conflictListClassName}>
          {groups.map(([collectionId, blocks]) => (
            <section
              key={collectionId}
              className="border-b border-foreground/10 last:border-b-0"
            >
              <div className="sticky top-0 z-10 border-b border-foreground/10 bg-background/95 px-4 py-2 backdrop-blur">
                <p className="text-sm font-semibold">{blocks?.[0]?.label}</p>
                <p className="text-xs text-foreground/50">
                  {blocks?.length} conflicting changes
                </p>
              </div>
              <div className="divide-y divide-foreground/10">
                {(blocks ?? []).map((block) => {
                  const resolution = resolutions[block.id];
                  const draft =
                    drafts[block.id] ??
                    formatConflictValue(
                      block.local.exists ? block.local : block.remote,
                    );
                  return (
                    <article key={block.id} className="space-y-3 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-xs font-semibold">
                            {describeConflictPath(block)}
                          </p>
                          <p className="mt-1 text-xs text-foreground/50">
                            {block.kind === 'edit-delete'
                              ? 'Edit and deletion overlap'
                              : 'Both versions changed this value'}
                          </p>
                        </div>
                        <Badge variant={resolution ? 'secondary' : 'outline'}>
                          {resolution?.choice ?? 'Unresolved'}
                        </Badge>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <ConflictValue
                          title="Local workspace"
                          block={block}
                          side="local"
                        />
                        <ConflictValue
                          title="GitHub"
                          block={block}
                          side="remote"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={
                            resolution?.choice === 'local'
                              ? 'primary'
                              : 'outline'
                          }
                          onClick={() => choose(block, 'local')}
                        >
                          {block.local.exists ? 'Keep local' : 'Keep deletion'}
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            resolution?.choice === 'remote'
                              ? 'secondary'
                              : 'outline'
                          }
                          onClick={() => choose(block, 'remote')}
                        >
                          {block.remote.exists ? 'Use GitHub' : 'Use deletion'}
                        </Button>
                      </div>
                      <Textarea
                        label="Custom resolution (JSON)"
                        value={draft}
                        error={errors[block.id]}
                        className="min-h-28 font-mono leading-5"
                        onChange={(event) => edit(block, event.target.value)}
                      />
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </section>
        <div className="flex shrink-0 justify-end gap-2 border-t border-foreground/10 pt-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!canApply}
            onClick={() => onResolve(resolutions)}
          >
            Apply resolution
          </Button>
        </div>
      </div>
    </ManagementDialog>
  );
};
