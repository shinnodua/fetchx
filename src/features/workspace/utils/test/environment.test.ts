import { describe, expect, test } from 'bun:test';

import type { EnvironmentVariable } from '../../types';
import {
  getLockedSensitiveVariableNames,
  redactSensitiveData,
  redactSensitiveValues,
  replaceVariables,
  resolveVariables,
} from '../environment';

const variables: EnvironmentVariable[] = [
  {
    id: 'v-api-url',
    key: 'API_URL',
    value: 'https://api.fetchx.dev',
    enabled: true,
    sensitive: false,
  },
  {
    id: 'v-token',
    key: 'TOKEN',
    value: 'secret token',
    enabled: true,
    sensitive: true,
  },
  {
    id: 'v-disabled',
    key: 'DISABLED',
    value: 'nope',
    enabled: false,
    sensitive: false,
  },
];

describe('environment utilities', () => {
  test('resolves enabled variables and redacts sensitive placeholders', () => {
    expect(
      resolveVariables(
        'GET {{ API_URL }} with {{TOKEN}} and {{DISABLED}}',
        variables,
      ),
    ).toEqual({
      value: 'GET https://api.fetchx.dev with secret token and {{DISABLED}}',
      redacted: 'GET https://api.fetchx.dev with [REDACTED] and {{DISABLED}}',
    });
    expect(replaceVariables('{{API_URL}}', variables)).toBe(
      'https://api.fetchx.dev',
    );
  });

  test('redacts sensitive values and encoded variants from text', () => {
    expect(
      redactSensitiveValues(
        'raw=secret token encoded=secret%20token plus=secret+token b64=c2VjcmV0IHRva2Vu',
        variables,
      ),
    ).toBe('raw=[REDACTED] encoded=[REDACTED] plus=[REDACTED] b64=[REDACTED]');
  });

  test('redacts sensitive values recursively in data structures', () => {
    expect(
      redactSensitiveData(
        {
          token: 'secret token',
          nested: ['secret%20token', { safe: 'visible' }],
        },
        variables,
      ),
    ).toEqual({
      token: '[REDACTED]',
      nested: ['[REDACTED]', { safe: 'visible' }],
    });
  });

  test('lists locked sensitive variable names referenced by text', () => {
    const lockedVariables: EnvironmentVariable[] = [
      ...variables,
      {
        id: 'v-locked',
        key: 'LOCKED_TOKEN',
        value: '',
        enabled: true,
        sensitive: true,
      },
    ];

    expect(
      getLockedSensitiveVariableNames(
        ['Authorization: Bearer {{ LOCKED_TOKEN }}', '{{TOKEN}}'],
        lockedVariables,
      ),
    ).toEqual(['LOCKED_TOKEN']);
  });
});
