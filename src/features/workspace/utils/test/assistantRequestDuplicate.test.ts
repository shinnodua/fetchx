import { describe, expect, test } from 'bun:test';

import {
  findRequestByTarget,
  normalizeRequestTarget,
} from '../assistantRequestDuplicate';

describe('assistant request duplicate utilities', () => {
  test('finds a saved request with the same trimmed target URL', () => {
    const request = {
      id: 'users',
      name: 'List users',
      type: 'GET',
      target: 'https://api.example.com/users',
    };

    expect(
      findRequestByTarget(
        [{ id: 'api', name: 'API', requests: [request] }],
        ' https://api.example.com/users ',
      ),
    ).toBe(request);
  });

  test('does not treat an empty target as a duplicate', () => {
    expect(findRequestByTarget([], '  ')).toBeUndefined();
  });

  test('finds requests created from equivalent cURL commands', () => {
    const request = {
      id: 'users',
      name: 'List users',
      type: 'GET',
      target: 'https://api.example.com/users',
    };

    expect(
      findRequestByTarget(
        [{ id: 'api', name: 'API', requests: [request] }],
        'curl -H "Accept: application/json" "https://api.example.com/users?limit=10"',
      ),
    ).toBe(request);
    expect(
      normalizeRequestTarget('https://api.example.com/users?limit=10'),
    ).toBe('https://api.example.com/users');
  });

  test('finds an unsaved assistant draft with the same cURL target', () => {
    const draft = {
      id: 'new-request',
      name: 'Technic trending',
      type: 'GET',
      target: 'https://api.technicpack.net/trending',
      queryParams: [{ key: 'build', value: '1143' }],
    };

    expect(
      findRequestByTarget(
        [],
        'curl "https://api.technicpack.net/trending?build=1143"',
        { [draft.id]: draft },
      ),
    ).toBe(draft);
  });
});
