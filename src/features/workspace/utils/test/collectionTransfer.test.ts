import { describe, expect, test } from 'bun:test';

import type { CollectionItem } from '../../types';
import {
  createCollectionsExportPayload,
  parseCollectionsImportPayload,
} from '../collectionTransfer';

const collections: CollectionItem[] = [
  {
    id: 'c-1',
    name: 'Collection',
    requests: [
      {
        id: 'r-1',
        name: 'Request',
        type: 'GET',
        target: 'https://api.example.com',
        response: {
          status: '200 OK',
          data: { ok: true },
          duration: 10,
          logs: ['done'],
        },
      },
    ],
  },
];

describe('collection transfer utilities', () => {
  test('creates normalized export payloads without transient responses', () => {
    const payload = createCollectionsExportPayload(collections);

    expect(payload.version).toBe(1);
    expect(new Date(payload.exportedAt).toString()).not.toBe('Invalid Date');
    expect(payload.collections[0].requests[0]).toMatchObject({
      args: {},
      headers: [],
      queryParams: [],
      body: '',
      response: null,
      savedResponses: [],
      savedResponsesCollapsed: false,
    });
  });

  test('parses native collection payloads and normalizes defaults', () => {
    expect(
      parseCollectionsImportPayload(JSON.stringify({ collections })),
    ).toEqual([
      {
        id: 'c-1',
        name: 'Collection',
        requests: [
          {
            id: 'r-1',
            name: 'Request',
            type: 'GET',
            target: 'https://api.example.com',
            abi: '',
            functionName: '',
            network: '1',
            args: {},
            headers: [],
            queryParams: [],
            body: '',
            response: null,
            savedResponses: [],
            savedResponsesCollapsed: false,
          },
        ],
      },
    ]);
  });

  test('rejects invalid import payloads', () => {
    expect(() => parseCollectionsImportPayload('{"bad":true}')).toThrow(
      'Import file must contain a collections array.',
    );
    expect(() =>
      parseCollectionsImportPayload(
        JSON.stringify([{ id: 'c-1', name: 'Broken', requests: [{ id: 1 }] }]),
      ),
    ).toThrow('Import file contains invalid collection data.');
  });
});
