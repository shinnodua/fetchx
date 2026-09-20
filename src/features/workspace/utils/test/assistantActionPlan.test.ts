import { describe, expect, test } from 'bun:test';

import { createAssistantActionPlan } from '../assistantActionPlan';

const request = {
  id: 'request-1',
  name: 'List users',
  type: 'GET',
  target: 'https://example.com/users',
};

describe('createAssistantActionPlan', () => {
  test('creates a focused request-creation plan', () => {
    expect(
      createAssistantActionPlan(
        {
          action: 'create_request',
          message: 'Created the request.',
          request: { name: 'Create user', type: 'POST', target: '/users' },
          collection: { name: 'Users' },
        },
        { activeRequest: null, collections: [] },
      ),
    ).toEqual({
      createdRequest: true,
      plan: {
        kind: 'create_request',
        collectionName: 'Users',
        request: { name: 'Create user', type: 'POST', target: '/users' },
      },
    });
  });

  test('does not update when there is no active request', () => {
    expect(
      createAssistantActionPlan(
        {
          action: 'update_request',
          message: 'Updated it.',
          request: { type: 'POST' },
        },
        { activeRequest: null, collections: [] },
      ),
    ).toEqual({ createdRequest: false, plan: { kind: 'none' } });
  });

  test('opens a matching saved request and reports an unmatched one', () => {
    const snapshot = {
      activeRequest: null,
      collections: [{ id: 'collection-1', name: 'Users', requests: [request] }],
    };

    expect(
      createAssistantActionPlan(
        {
          action: 'open_request',
          message: 'Opened it.',
          search: { keyword: 'users' },
        },
        snapshot,
      ).plan,
    ).toEqual({
      kind: 'open_request',
      keyword: 'users',
      requestId: 'request-1',
    });
    expect(
      createAssistantActionPlan(
        {
          action: 'run_request',
          message: 'Could not find it.',
          search: { keyword: 'payments' },
        },
        snapshot,
      ).plan,
    ).toEqual({ kind: 'request_not_found', keyword: 'payments' });
  });
});
