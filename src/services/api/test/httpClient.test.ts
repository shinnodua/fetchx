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

  test('delegates direct execution through custom direct request executor', async () => {
    const { apiRequest } = await import('../httpClient');
    const mockExecutor = async () => ({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: { result: 'native-success' },
      proxied: false,
    });

    const response = await apiRequest(
      { url: 'https://api.pilauncher.org/v1/public/servers/community' },
      { executeDirectRequest: mockExecutor },
    );

    expect(response.status).toBe(200);
    expect(response.proxied).toBe(false);
    expect(response.data).toEqual({ result: 'native-success' });
  });
});
