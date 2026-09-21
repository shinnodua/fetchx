import { describe, expect, test } from 'bun:test';
import { getTransactionWalletState } from '../transactionWalletState';

describe('getTransactionWalletState', () => {
  test('requires a connection until an account is mounted', () => {
    expect(
      getTransactionWalletState({
        chainId: 1,
        chainUnsupported: false,
        hasAccount: true,
        isMounted: false,
        requestNetwork: '1',
      }),
    ).toBe('connect');
  });

  test('reports an unsupported connected chain', () => {
    expect(
      getTransactionWalletState({
        chainId: 999,
        chainUnsupported: true,
        hasAccount: true,
        isMounted: true,
        requestNetwork: '1',
      }),
    ).toBe('unsupported-network');
  });

  test('reports a request network mismatch before transactions are sent', () => {
    expect(
      getTransactionWalletState({
        chainId: 1,
        chainUnsupported: false,
        hasAccount: true,
        isMounted: true,
        requestNetwork: '8453',
      }),
    ).toBe('network-mismatch');
  });

  test('keeps a matching connected wallet ready for transactions', () => {
    expect(
      getTransactionWalletState({
        chainId: 8453,
        chainUnsupported: false,
        hasAccount: true,
        isMounted: true,
        requestNetwork: '8453',
      }),
    ).toBe('connected');
  });

  test('treats requests without a selected network as ready when connected', () => {
    expect(
      getTransactionWalletState({
        chainId: 1,
        chainUnsupported: false,
        hasAccount: true,
        isMounted: true,
      }),
    ).toBe('connected');
  });
});
