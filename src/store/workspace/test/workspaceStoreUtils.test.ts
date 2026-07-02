import { describe, expect, test } from 'bun:test';

import type {
  CollectionItem,
  RequestItem,
} from '../../../features/workspace/types';
import {
  clearWorkspaceResponseLogs,
  cloneRequest,
  createAvailableName,
  createCopyName,
  createDefaultAbi,
  createId,
  createNewRequestId,
  createRequest,
  findRequestById,
  mergeResponseLogs,
  resetDraftForClosedTab,
} from '../workspaceStoreUtils';

const request: RequestItem = createRequest('r-1', 'Original', 'GET', {
  target: 'https://api.example.com',
  headers: [{ key: 'Accept', value: 'application/json' }],
});

const collections: CollectionItem[] = [
  { id: 'c-1', name: 'Collection', requests: [request] },
];

describe('workspace store utilities', () => {
  test('creates IDs with expected prefixes', () => {
    expect(createId('c')).toStartWith('c-');
    expect(createNewRequestId()).toStartWith('r-new-');
  });

  test('creates default ABIs for contract request types only', () => {
    expect(createDefaultAbi('READ')).toContain('"name": "balanceOf"');
    expect(createDefaultAbi('WRITE')).toContain('"name": "transfer"');
    expect(createDefaultAbi('GET')).toBe('');
  });

  test('creates normalized requests with overrides', () => {
    expect(
      createRequest('r-2', 'Fetch Users', 'GET', { target: '/users' }),
    ).toMatchObject({
      id: 'r-2',
      name: 'Fetch Users',
      type: 'GET',
      target: '/users',
      network: '1',
      args: {},
      response: null,
      savedResponses: [],
      savedResponsesCollapsed: false,
    });
  });

  test('creates available copy names case-insensitively', () => {
    expect(createCopyName('Request', ['Request Copy'])).toBe('Request Copy 2');
    expect(createAvailableName('  Collection  ', ['collection'])).toBe(
      'Collection Copy',
    );
    expect(createAvailableName('   ', [])).toBe('Imported Collection');
  });

  test('clones and finds requests without sharing references', () => {
    const clone = cloneRequest(request);
    clone.headers?.push({ key: 'X-Test', value: '1' });

    expect(request.headers).toEqual([
      { key: 'Accept', value: 'application/json' },
    ]);
    expect(findRequestById(collections, 'r-1')).toBe(request);
    expect(findRequestById(collections, 'missing')).toBeUndefined();
  });

  test('merges response logs across request runs', () => {
    const mergedResponse = mergeResponseLogs(
      {
        status: 'Pending',
        data: null,
        duration: 0,
        logs: ['[10:00:00] Sending request'],
      },
      {
        status: '200 OK',
        data: { ok: true },
        duration: 25,
        logs: ['[10:00:01] Response received'],
      },
    );

    expect(mergedResponse).toMatchObject({
      status: '200 OK',
      data: { ok: true },
      duration: 25,
      logs: ['[10:00:00] Sending request', '[10:00:01] Response received'],
    });
  });

  test('clears response logs from persisted workspace state', () => {
    const draft = createRequest('r-2', 'Draft', 'GET', {
      response: {
        status: '200 OK',
        data: null,
        duration: 1,
        logs: ['persisted draft log'],
      },
    });
    const savedRequest = createRequest('r-3', 'Saved', 'GET', {
      response: {
        status: '200 OK',
        data: null,
        duration: 1,
        logs: ['persisted saved log'],
      },
    });

    const loglessWorkspace = clearWorkspaceResponseLogs(
      [{ id: 'c-2', name: 'Collection', requests: [savedRequest] }],
      { [draft.id]: draft },
    );

    expect(loglessWorkspace.drafts[draft.id].response?.logs).toEqual([]);
    expect(loglessWorkspace.collections[0].requests[0].response?.logs).toEqual(
      [],
    );
  });

  test('resets drafts when tabs close', () => {
    const drafts: Record<string, RequestItem> = {
      'r-new-1': createRequest('r-new-1', 'New', 'GET'),
      'r-1': createRequest('r-1', 'Changed', 'GET'),
      missing: createRequest('missing', 'Missing', 'GET'),
    };

    resetDraftForClosedTab('r-new-1', collections, drafts);
    resetDraftForClosedTab('r-1', collections, drafts);
    resetDraftForClosedTab('missing', collections, drafts);

    expect(drafts['r-new-1']).toBeUndefined();
    expect(drafts['r-1']).toEqual(request);
    expect(drafts.missing).toBeUndefined();
  });
});
