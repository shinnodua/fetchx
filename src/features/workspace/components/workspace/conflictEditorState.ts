import type {
  WorkspaceConflictResolution,
  WorkspaceConflictValue,
  WorkspaceSyncConflictBlock,
} from '../../utils/workspaceSyncState';

export const formatConflictValue = (value: WorkspaceConflictValue) =>
  value.exists ? JSON.stringify(value.value, null, 2) : '';

export const describeConflictPath = (block: WorkspaceSyncConflictBlock) => {
  if (block.path.length === 0) return 'Collection';
  return block.path
    .map((part, index) =>
      index > 0 && block.path[index - 1] === 'requests'
        ? `Request ${part}`
        : part,
    )
    .join(' / ');
};

export const parseCustomConflictValue = (
  source: string,
): { value?: WorkspaceConflictValue; error?: string } => {
  if (!source.trim()) {
    return { error: 'Enter a valid JSON value.' };
  }
  try {
    return { value: { exists: true, value: JSON.parse(source) as unknown } };
  } catch {
    return { error: 'This resolution is not valid JSON.' };
  }
};

export const createBulkConflictResolutions = (
  blocks: WorkspaceSyncConflictBlock[],
  choice: 'local' | 'remote',
): Record<string, WorkspaceConflictResolution> =>
  Object.fromEntries(blocks.map((block) => [block.id, { choice }]));
