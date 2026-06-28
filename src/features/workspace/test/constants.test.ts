import { describe, expect, test } from 'bun:test';

import {
  DEFAULT_RPC_OPTIONS,
  getNativeTokenSymbol,
  isRestMethod,
  methodSupportsBody,
} from '../constants';

describe('workspace constants helpers', () => {
  test('maps default RPC options from network options', () => {
    expect(
      DEFAULT_RPC_OPTIONS.find((option) => option.chainId === '1'),
    ).toMatchObject({
      id: 'default-1',
      name: 'Ethereum Mainnet',
      explorerUrl: 'https://etherscan.io',
      isDefault: true,
    });
  });

  test('returns native token symbols with a generic fallback', () => {
    expect(getNativeTokenSymbol('1')).toBe('ETH');
    expect(getNativeTokenSymbol('56')).toBe('BNB');
    expect(getNativeTokenSymbol(undefined)).toBe('native token');
    expect(getNativeTokenSymbol('999')).toBe('native token');
  });

  test('classifies REST methods and body support', () => {
    expect(isRestMethod('GET')).toBe(true);
    expect(isRestMethod('READ')).toBe(false);
    expect(methodSupportsBody('POST')).toBe(true);
    expect(methodSupportsBody('GET')).toBe(false);
    expect(methodSupportsBody(undefined)).toBe(false);
  });
});
