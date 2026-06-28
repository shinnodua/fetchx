import { describe, expect, test } from 'bun:test';

import {
  findRpcOption,
  getRpcOptions,
  getRpcSelectOptions,
  getSelectedRpcId,
  validateChainId,
  validateRpcUrl,
} from '../rpcOptions';

const customRpcs = [
  {
    id: 'rpc-base-local',
    name: 'Base Local',
    chainId: '8453',
    url: 'https://base.example',
    explorerUrl: 'https://basescan.org',
  },
];

describe('RPC option utilities', () => {
  test('combines default and custom RPC options', () => {
    const options = getRpcOptions(customRpcs);

    expect(options.some((option) => option.id === 'default-1')).toBe(true);
    expect(options.at(-1)).toEqual({
      ...customRpcs[0],
      isDefault: false,
    });
  });

  test('selects a valid custom RPC or falls back to network default', () => {
    expect(
      getSelectedRpcId(
        { customRpcId: 'rpc-base-local', network: '8453' },
        customRpcs,
      ),
    ).toBe('rpc-base-local');
    expect(
      getSelectedRpcId({ customRpcId: 'missing', network: '8453' }, customRpcs),
    ).toBe('default-8453');
    expect(
      getSelectedRpcId({ customRpcId: undefined, network: '' }, customRpcs),
    ).toBe('default-1');
  });

  test('formats select labels and finds options by id', () => {
    expect(getRpcSelectOptions(customRpcs).at(-1)).toEqual({
      value: 'rpc-base-local',
      label: 'Base Local (8453)',
    });
    expect(findRpcOption('rpc-base-local', customRpcs)?.url).toBe(
      'https://base.example',
    );
    expect(findRpcOption('missing', customRpcs)).toBeUndefined();
  });

  test('validates RPC URLs and chain IDs', () => {
    expect(validateRpcUrl('https://rpc.example')).toBe(true);
    expect(validateRpcUrl('http://localhost:8545')).toBe(true);
    expect(validateRpcUrl('wss://rpc.example')).toBe(false);
    expect(validateRpcUrl('not a url')).toBe(false);

    expect(validateChainId(' 8453 ')).toBe(true);
    expect(validateChainId('0')).toBe(false);
    expect(validateChainId('1.5')).toBe(false);
  });
});
