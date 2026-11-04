import { describe, expect, test } from 'bun:test';
import type { StateCreator } from 'zustand';
import { createRequestActions } from '../requestActions';
import type { WorkspaceState } from '../workspaceStoreTypes';
import { createRequest } from '../workspaceStoreUtils';

type WorkspaceSet = Parameters<StateCreator<WorkspaceState>>[0];

const setup = () => {
  const request = createRequest('r-1', 'Users', 'GET', {
    savedResponses: [
      {
        id: 'response-1',
        name: 'Example',
        response: {
          status: '200',
          data: { ok: true },
          duration: 10,
          logs: [],
        },
      },
    ],
  });
  const sibling = createRequest('r-2', 'Sibling', 'POST');
  const existing = createRequest('r-3', 'Users', 'GET');
  let state = {
    collections: [
      { id: 'source', name: 'Source', requests: [request, sibling] },
      { id: 'target', name: 'Target', requests: [existing] },
      { id: 'empty', name: 'Empty', requests: [] },
    ],
    drafts: {
      [request.id]: { ...request, target: 'https://edited.example.com' },
    },
    tabs: [request.id, sibling.id],
    activeTabId: request.id,
    collapsedCollectionIds: ['source', 'target'],
  } as unknown as WorkspaceState;
  const set: WorkspaceSet = (partial) => {
    state = {
      ...state,
      ...(typeof partial === 'function' ? partial(state) : partial),
    };
  };
  const actions = createRequestActions(set, () => state);
  return { actions, get: () => state, request, sibling, existing };
};

describe('moveRequest', () => {
  test('moves the saved request and preserves drafts, tabs, responses, and names', () => {
    const { actions, get, request, sibling, existing } = setup();
    const before = get();
    actions.moveRequest(request.id, 'target');
    const after = get();
    expect(after.collections[0].requests).toEqual([sibling]);
    expect(after.collections[1].requests).toEqual([existing, request]);
    expect(after.collections[1].requests[1]).toBe(request);
    expect(after.collections[2]).toBe(before.collections[2]);
    expect(after.drafts).toBe(before.drafts);
    expect(after.drafts[request.id].target).toBe('https://edited.example.com');
    expect(after.tabs).toBe(before.tabs);
    expect(after.activeTabId).toBe(before.activeTabId);
    expect(after.collapsedCollectionIds).toEqual(['source']);
    expect(before.collections[0].requests).toEqual([request, sibling]);
  });

  test('can move a closed request to an empty collection', () => {
    const { actions, get, sibling } = setup();
    actions.moveRequest(sibling.id, 'empty');
    expect(get().collections[2].requests).toEqual([sibling]);
    expect(get().drafts[sibling.id]).toBeUndefined();
  });

  test.each([
    ['r-1', 'source'],
    ['r-1', 'missing'],
    ['missing', 'target'],
    ['r-new-unsaved', 'target'],
  ])('ignores invalid or unchanged moves: %s to %s', (requestId, collectionId) => {
    const { actions, get } = setup();
    const before = get();
    actions.moveRequest(requestId, collectionId);
    expect(get()).toEqual(before);
    expect(get().collections).toBe(before.collections);
  });
});
