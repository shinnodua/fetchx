import { describe, expect, test } from 'bun:test';

import type {
  CollectionItem,
  RequestItem,
} from '../../../features/workspace/types';
import {
  cloneRequest,
  createAvailableName,
  createCopyName,
  createDefaultAbi,
  createId,
  createNewRequestId,
  createRequest,
  findRequestById,
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
