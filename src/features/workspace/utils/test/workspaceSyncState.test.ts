import { describe, expect, test } from 'bun:test';
import {
  applyWorkspaceConflictResolutions,
  createWorkspaceChangeIndex,
  createWorkspaceSyncConflict,
  getWorkspaceChangeCount,
} from '../workspaceSyncState';

const baseline = [
  {
    id: 'payments',
    name: 'Payments',
    requests: [
      {
        id: 'create-payment',
        name: 'Create payment',
        type: 'POST',
        target: 'https://api.example.com/payments',
      },
    ],
  },
];

describe('workspace sync state', () => {
  test('indexes renamed requests without changing their collection order', () => {
    const current = [
      {
        ...baseline[0],
        requests: [
          { ...baseline[0].requests[0], name: 'Create checkout payment' },
        ],
      },
    ];

    const changeIndex = createWorkspaceChangeIndex(baseline, current);

    expect(changeIndex.collections).toEqual({ payments: 'modified' });
    expect(changeIndex.requests).toEqual({ 'create-payment': 'modified' });
    expect(getWorkspaceChangeCount(changeIndex)).toBe(1);
  });

  test('marks additions green in the shared change index', () => {
    const current = [
      {
        ...baseline[0],
        requests: [
          ...baseline[0].requests,
          {
            id: 'refund-payment',
            name: 'Refund payment',
            type: 'POST',
            target: 'https://api.example.com/payments/refund',
          },
        ],
      },
    ];

    const changeIndex = createWorkspaceChangeIndex(baseline, current);

    expect(changeIndex.collections).toEqual({ payments: 'modified' });
    expect(changeIndex.requests).toEqual({ 'refund-payment': 'added' });
  });

  test('keeps non-conflicting remote changes and lets the user resolve collisions', () => {
    const local = [
      {
        ...baseline[0],
        name: 'Local payments',
      },
      { id: 'local-only', name: 'Local only', requests: [] },
    ];
    const remote = [
      {
        ...baseline[0],
        name: 'Remote payments',
      },
      { id: 'remote-only', name: 'Remote only', requests: [] },
    ];

    const conflict = createWorkspaceSyncConflict(baseline, local, remote);

    expect(conflict.entries).toMatchObject([
      { id: 'payments', label: 'Local payments' },
    ]);
    expect(
      conflict.mergedCollections.map((collection) => collection.id),
    ).toEqual(['remote-only', 'local-only']);
    expect(
      applyWorkspaceConflictResolutions(conflict, { payments: 'remote' }).map(
        (collection) => collection.name,
      ),
    ).toEqual(['Remote payments', 'Remote only', 'Local only']);
  });
});
