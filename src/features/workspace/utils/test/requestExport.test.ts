import { describe, expect, test } from 'bun:test';

import type { RequestItem } from '../../types';
import {
  copyAsCurlBash,
  copyAsCurlCmd,
  copyAsCurlPowerShell,
  copyAsFetch,
  copyLinkAddress,
  copyRequestHeaders,
  copyResponse,
} from '../requestExport';

const restRequest: RequestItem = {
  id: 'r-1',
  name: 'Create Post',
  type: 'POST',
  target: 'https://api.example.com/posts',
  headers: [
    { key: 'Content-Type', value: 'application/json' },
    { key: '', value: 'ignored' },
  ],
  queryParams: [
    { key: 'limit', value: '3' },
    { key: 'search', value: 'hello world' },
  ],
  body: '{"title":"Hello"}',
  response: {
    status: '200 OK',
    data: { ok: true },
    duration: 120,
    logs: [],
  },
};

describe('request export utilities', () => {
  test('copies URLs with active query params', () => {
    expect(copyLinkAddress(restRequest)).toBe(
      'https://api.example.com/posts?limit=3&search=hello%20world',
    );
  });

  test('exports fetch snippets with headers and body', () => {
    expect(copyAsFetch(restRequest)).toContain(
      'fetch("https://api.example.com/posts?limit=3&search=hello%20world"',
    );
    expect(copyAsFetch(restRequest)).toContain('"method": "POST"');
    expect(copyAsFetch(restRequest)).toContain(
      '"body": "{\\"title\\":\\"Hello\\"}"',
    );
  });

  test('exports curl snippets for common shells', () => {
    expect(copyAsCurlBash(restRequest)).toContain('curl \\\n  -X POST');
    expect(copyAsCurlBash(restRequest)).toContain(
      "-H 'Content-Type: application/json'",
    );
    expect(copyAsCurlCmd(restRequest)).toContain('curl ^\n  -X POST');
    expect(copyAsCurlPowerShell(restRequest)).toContain(
      'curl.exe `\n  -X POST',
    );
  });

  test('exports headers and responses', () => {
    expect(copyRequestHeaders(restRequest)).toBe(
      'Content-Type: application/json',
    );
    expect(copyResponse(restRequest)).toBe('{\n  "ok": true\n}');
    expect(copyResponse({ ...restRequest, response: null })).toBe('');
    expect(
      copyResponse({
        ...restRequest,
        response: { status: '200 OK', data: 'raw', duration: 1, logs: [] },
      }),
    ).toBe('raw');
  });

  test('exports contract request fallbacks as comments', () => {
    expect(
      copyAsCurlBash({
        ...restRequest,
        type: 'READ',
        functionName: 'balanceOf',
        target: '0x1234',
      }),
    ).toContain('# Contract READ Call');
  });
});
