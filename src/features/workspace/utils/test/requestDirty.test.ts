import { describe, expect, test } from 'bun:test';

import type { CollectionItem, RequestItem } from '../../types';
import {
  getRequestIsDirty,
  getWorkspaceHasUnsavedChanges,
} from '../requestDirty';

const baseRequest: RequestItem = {
  id: 'r-1',
  name: 'Untitled Request',
  type: 'GET',
  target: '',
  abi: '',
  functionName: '',
  network: '1',
  args: {},
  headers: [],
  queryParams: [],
  body: '',
  response: null,
};

describe('request dirty utilities', () => {
  test('treats empty default new requests as clean', () => {
    expect(getRequestIsDirty(baseRequest, undefined)).toBe(false);
  });

  test('marks new requests dirty when meaningful fields are present', () => {
    expect(
      getRequestIsDirty(
        { ...baseRequest, target: 'https://api.example' },
        undefined,
      ),
    ).toBe(true);
  });

  test('compares drafts against originals', () => {
    expect(getRequestIsDirty({ ...baseRequest }, baseRequest)).toBe(false);
    expect(
      getRequestIsDirty(
        {
          ...baseRequest,
          headers: [{ key: 'Accept', value: 'application/json' }],
        },
        baseRequest,
      ),
    ).toBe(true);
  });

  test('detects unsaved changes across open tabs', () => {
    const collections: CollectionItem[] = [
      { id: 'c-1', name: 'Collection', requests: [baseRequest] },
    ];
    const draft = { ...baseRequest, body: '{"changed":true}' };

    expect(
      getWorkspaceHasUnsavedChanges(collections, ['r-1'], { 'r-1': draft }),
    ).toBe(true);
    expect(
      getWorkspaceHasUnsavedChanges(collections, ['r-1'], {
        'r-1': baseRequest,
      }),
    ).toBe(false);
  });
});
