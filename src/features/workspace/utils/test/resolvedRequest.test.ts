import { describe, expect, test } from 'bun:test';

import { resolveRequestForExecution } from '../resolvedRequest';

describe('resolveRequestForExecution', () => {
  test('resolves request fields while retaining a redacted execution record', () => {
    const result = resolveRequestForExecution(
      {
        id: 'request-1',
        name: 'Users',
        type: 'GET',
        target: 'https://example.com/{{TOKEN}}',
        headers: [{ key: 'Authorization', value: 'Bearer {{TOKEN}}' }],
        args: { token: '{{TOKEN}}' },
      },
      [
        {
          id: 'token',
          key: 'TOKEN',
          value: 'secret',
          enabled: true,
          sensitive: true,
        },
      ],
    );

    expect(result.resolved.target).toBe('https://example.com/secret');
    expect(result.resolved.headers).toEqual([
      { key: 'Authorization', value: 'Bearer secret' },
    ]);
    expect(result.redacted.target).not.toContain('secret');
    expect(result.redacted.headers?.[0]?.value).not.toContain('secret');
  });
});
