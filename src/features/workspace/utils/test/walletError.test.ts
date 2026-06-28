import { describe, expect, test } from 'bun:test';

import { getWalletErrorMessage } from '../walletError';

describe('wallet error utilities', () => {
  test('prioritizes short structured messages with meta details', () => {
    expect(
      getWalletErrorMessage({
        message: 'outer',
        shortMessage: 'User rejected request',
        metaMessages: ['Action canceled', '', 123],
      }),
    ).toBe('User rejected request\n\nAction canceled');
  });

  test('walks cause and data before generic outer messages', () => {
    expect(
      getWalletErrorMessage({
        message: 'outer message',
        cause: {
          data: 'execution reverted',
        },
      }),
    ).toBe('execution reverted');
  });

  test('falls back to Error instances and unknown values', () => {
    expect(getWalletErrorMessage(new Error('boom'))).toBe('boom');
    expect(getWalletErrorMessage(42)).toBe('Unknown wallet error.');
  });
});
