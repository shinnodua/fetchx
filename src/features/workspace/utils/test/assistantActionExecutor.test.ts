import { describe, expect, test } from 'bun:test';

import { executeAssistantActionPlan } from '../assistantActionExecutor';

describe('executeAssistantActionPlan', () => {
  test('creates a draft and saves it in a newly created collection', () => {
    const calls: string[] = [];
    const workspace = {
      addCollection: (name: string) => calls.push(`collection:${name}`),
      addCustomRequest: () => calls.push('request'),
      getState: () => ({
        activeTabId: 'draft-1',
        collections: [{ id: 'users', name: 'Users', requests: [] }],
        drafts: {},
      }),
      openTab: () => calls.push('open'),
      saveDraft: (requestId: string, collectionId: string) =>
        calls.push(`save:${requestId}:${collectionId}`),
      setCollectionsPanelCollapsed: () => calls.push('expand'),
      setSearchTerm: () => calls.push('search'),
      updateActiveRequest: () => calls.push('update'),
    };

    expect(
      executeAssistantActionPlan(
        {
          kind: 'create_request',
          collectionName: 'Users',
          request: { name: 'List users', type: 'GET', target: '/users' },
        },
        workspace,
      ),
    ).toEqual({ changed: true });
    expect(calls).toEqual(['request', 'save:draft-1:users']);
  });

  test('filters the sidebar when an opened request cannot be found', () => {
    const calls: string[] = [];
    const workspace = {
      addCollection: () => calls.push('collection'),
      addCustomRequest: () => calls.push('request'),
      getState: () => ({ activeTabId: '', collections: [], drafts: {} }),
      openTab: () => calls.push('open'),
      saveDraft: () => calls.push('save'),
      setCollectionsPanelCollapsed: (collapsed: boolean) =>
        calls.push(`collapsed:${collapsed}`),
      setSearchTerm: (term: string) => calls.push(`search:${term}`),
      updateActiveRequest: () => calls.push('update'),
    };

    expect(
      executeAssistantActionPlan(
        { kind: 'request_not_found', keyword: 'payments' },
        workspace,
      ),
    ).toEqual({ changed: true, requestNotFound: true });
    expect(calls).toEqual(['search:payments', 'collapsed:false']);
  });
});
