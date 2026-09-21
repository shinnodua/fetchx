import { describe, expect, test } from 'bun:test';
import type { WorkspaceSyncConflictBlock } from '../../../utils/workspaceSyncState';
import {
  createBulkConflictResolutions,
  describeConflictPath,
  parseCustomConflictValue,
} from '../conflictEditorState';

const block: WorkspaceSyncConflictBlock = {
  id: 'payments:requests/create/name',
  collectionId: 'payments',
  kind: 'value',
  label: 'Payments',
  path: ['requests', 'create', 'name'],
  base: { exists: true, value: 'Create' },
  local: { exists: true, value: 'Create locally' },
  remote: { exists: true, value: 'Create remotely' },
};

describe('conflict editor state', () => {
  test('formats request paths for navigation', () => {
    expect(describeConflictPath(block)).toBe(
      'requests / Request create / name',
    );
  });

  test('accepts JSON custom resolutions and rejects invalid input', () => {
    expect(parseCustomConflictValue('"Merged"')).toEqual({
      value: { exists: true, value: 'Merged' },
    });
    expect(parseCustomConflictValue('{')).toEqual({
      error: 'This resolution is not valid JSON.',
    });
  });

  test('creates a resolution for every block during bulk selection', () => {
    expect(createBulkConflictResolutions([block], 'remote')).toEqual({
      [block.id]: { choice: 'remote' },
    });
  });
});
