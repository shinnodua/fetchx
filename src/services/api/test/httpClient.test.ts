import { describe, expect, test } from 'bun:test';

import {
  buildUrlWithQueryParams,
  getMissingProxyConfigurationMessage,
} from '../httpClient';

describe('HTTP client utilities', () => {
  test('appends encoded query params and skips empty keys', () => {
    expect(
      buildUrlWithQueryParams('https://api.example.com/users', [
        { key: 'limit', value: '3' },
        { key: 'search', value: 'hello world' },
        { key: '', value: 'ignored' },
      ]),
    ).toBe('https://api.example.com/users?limit=3&search=hello+world');
  });

  test('returns original target when query params are empty', () => {
    expect(buildUrlWithQueryParams('https://api.example.com/users', [])).toBe(
      'https://api.example.com/users',
    );
    expect(
      buildUrlWithQueryParams('https://api.example.com/users', undefined),
    ).toBe('https://api.example.com/users');
  });

  test('explains how to restore proxy fallback when it is unconfigured', () => {
    expect(getMissingProxyConfigurationMessage()).toBe(
      'The Fetchx CORS proxy is not configured. Set VITE_API_URL_FETCHX to the API origin that serves /proxy.',
    );
  });
});
