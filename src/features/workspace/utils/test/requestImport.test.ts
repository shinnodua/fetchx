import { describe, expect, test } from 'bun:test';

import {
  createImportedRequestName,
  createPastedUrlRequestUpdate,
  parseCurl,
  parseRequestImportContent,
} from '../requestImport';

describe('request import utilities', () => {
  test('creates concise imported request names from URLs', () => {
    expect(
      createImportedRequestName('GET', 'https://api.example.com/users'),
    ).toBe('GET api.example.com/users');
    expect(
      createImportedRequestName(
        'GET',
        'https://api.example.com/a/very/long/path/that/should/be/trimmed',
      ),
    ).toBe('GET api.example.com');
    expect(createImportedRequestName('GET', 'not a url')).toBe(
      'Imported Request',
    );
  });

  test('parses curl commands with headers, body, auth, and query params', () => {
    expect(
      parseCurl(
        'curl -H "Accept: application/json" -H "User-Agent: browser" -u "me:secret" -d \'{"ok":true}\' "api.example.com/users?limit=3"',
      ),
    ).toEqual({
      method: 'POST',
      target: 'https://api.example.com/users',
      headers: [
        { key: 'Accept', value: 'application/json' },
        { key: 'Authorization', value: 'Basic bWU6c2VjcmV0' },
      ],
      queryParams: [{ key: 'limit', value: '3' }],
      body: '{"ok":true}',
    });
  });

  test('imports plain URLs and fetch snippets', () => {
    expect(
      parseRequestImportContent('https://api.example.com/users?limit=2'),
    ).toMatchObject({
      name: 'GET api.example.com/users',
      type: 'GET',
      target: 'https://api.example.com/users',
      queryParams: [{ key: 'limit', value: '2' }],
    });

    expect(
      parseRequestImportContent(`
        fetch("https://api.example.com/posts?page=1", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "token" },
          body: "title=Hello"
        })
      `),
    ).toMatchObject({
      name: 'POST api.example.com/posts',
      type: 'POST',
      target: 'https://api.example.com/posts',
      headers: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'token' },
      ],
      queryParams: [{ key: 'page', value: '1' }],
      body: 'title=Hello',
    });
  });

  test('generates a name when a URL is pasted into an existing REST request', () => {
    expect(
      createPastedUrlRequestUpdate(
        'POST',
        'https://api.example.com/users?include=roles',
      ),
    ).toEqual({
      name: 'POST api.example.com/users',
      target: 'https://api.example.com/users',
      queryParams: [{ key: 'include', value: 'roles' }],
    });

    expect(
      createPastedUrlRequestUpdate('GET', 'https://api.example.com/health'),
    ).toEqual({
      name: 'GET api.example.com/health',
      target: 'https://api.example.com/health',
      queryParams: [],
    });
  });

  test('imports request JSON and filters invalid nested fields', () => {
    expect(
      parseRequestImportContent(
        JSON.stringify({
          name: 'Update profile',
          type: 'patch',
          target: 'https://api.example.com/profile',
          args: { id: '1', count: 2 },
          headers: [
            { key: 'Accept', value: 'application/json' },
            { bad: true },
          ],
          queryParams: [{ key: 'expand', value: 'team' }, null],
          body: '{"name":"Ada"}',
        }),
      ),
    ).toMatchObject({
      name: 'Update profile',
      type: 'PATCH',
      target: 'https://api.example.com/profile',
      args: { id: '1' },
      headers: [{ key: 'Accept', value: 'application/json' }],
      queryParams: [{ key: 'expand', value: 'team' }],
      body: '{"name":"Ada"}',
    });
  });

  test('throws useful errors for invalid imports', () => {
    expect(() =>
      parseRequestImportContent('curl -H "Accept: text/plain"'),
    ).toThrow('Failed to parse URL from curl command.');
    expect(() =>
      parseRequestImportContent('{"name":"Bad","type":"TRACE"}'),
    ).toThrow('Method must be one of:');
  });
});
