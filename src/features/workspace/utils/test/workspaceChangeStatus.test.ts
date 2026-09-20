import { describe, expect, test } from 'bun:test';
import {
  getCollectionChangeStatus,
  getRequestChangeStatus,
} from '../workspaceChangeStatus';

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

describe('workspace change status', () => {
  test('marks collections and requests added after the synced snapshot', () => {
    const addedCollection = { id: 'users', name: 'Users', requests: [] };
    const addedRequest = {
      id: 'refund-payment',
      name: 'Refund payment',
      type: 'POST',
      target: 'https://api.example.com/payments/refund',
    };

    expect(getCollectionChangeStatus(addedCollection, baseline)).toBe('added');
    expect(getRequestChangeStatus(addedRequest, 'payments', baseline)).toBe(
      'added',
    );
  });

  test('marks edited content modified while ignoring live responses', () => {
    const changedRequest = {
      ...baseline[0].requests[0],
      target: 'https://api.example.com/v2/payments',
    };
    const collectionWithChangedRequest = {
      ...baseline[0],
      requests: [changedRequest],
    };
    const requestWithResponse = {
      ...baseline[0].requests[0],
      response: {
        status: '200',
        data: { id: 'payment-1' },
        duration: 4,
        logs: [],
      },
    };

    expect(
      getCollectionChangeStatus(collectionWithChangedRequest, baseline),
    ).toBe('modified');
    expect(getRequestChangeStatus(changedRequest, 'payments', baseline)).toBe(
      'modified',
    );
    expect(
      getRequestChangeStatus(requestWithResponse, 'payments', baseline),
    ).toBe('unchanged');
  });

  test('marks a saved request rename modified', () => {
    const renamedRequest = {
      ...baseline[0].requests[0],
      name: 'Create checkout payment',
    };

    expect(getRequestChangeStatus(renamedRequest, 'payments', baseline)).toBe(
      'modified',
    );
  });

  test('does not display a change state without a GitHub sync baseline', () => {
    expect(getCollectionChangeStatus(baseline[0])).toBe('unchanged');
    expect(getRequestChangeStatus(baseline[0].requests[0], 'payments')).toBe(
      'unchanged',
    );
  });
});
