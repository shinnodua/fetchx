import { describe, expect, test } from 'bun:test';

import {
  convertDecimalStringToHex,
  convertHexStringToDecimal,
  formatContractArgs,
  formatIntegerContractArg,
  formatStringContractArg,
  getArgDecimalsKey,
  getArgValueModeKey,
  isIntegerAbiType,
  isStringAbiType,
  serializeBigInts,
} from '../contractArgs';

describe('contract argument utilities', () => {
  test('builds metadata keys for argument controls', () => {
    expect(getArgDecimalsKey('amount')).toBe('amount__decimals');
    expect(getArgValueModeKey('amount')).toBe('amount__valueMode');
  });

  test('detects integer and string ABI types', () => {
    expect(isIntegerAbiType('uint256')).toBe(true);
    expect(isIntegerAbiType('int8')).toBe(true);
    expect(isIntegerAbiType('uint256[]')).toBe(false);
    expect(isStringAbiType('string')).toBe(true);
    expect(isStringAbiType('bytes32')).toBe(false);
  });

  test('converts decimal and hex integer strings only when valid', () => {
    expect(convertDecimalStringToHex(' 255 ')).toBe('0xff');
    expect(convertDecimalStringToHex('12.5')).toBe('12.5');
    expect(convertHexStringToDecimal(' 0xff ')).toBe('255');
    expect(convertHexStringToDecimal('ff')).toBe('ff');
  });

  test('formats string values when decimal mode is selected', () => {
    expect(formatStringContractArg('255', 'dec')).toBe('0xff');
    expect(formatStringContractArg('hello', 'dec')).toBe('hello');
    expect(formatStringContractArg('255', 'hex')).toBe('255');
  });

  test('formats integer values with optional token decimals', () => {
    expect(formatIntegerContractArg('42', '').toString()).toBe('42');
    expect(formatIntegerContractArg('1.5', '2').toString()).toBe('150');
  });

  test('formats ABI inputs into viem-ready values', () => {
    expect(
      formatContractArgs(
        [
          { name: 'amount', type: 'uint256' },
          { name: 'enabled', type: 'bool' },
          { name: 'tags', type: 'string[]' },
          { name: 'memo', type: 'string' },
        ],
        {
          amount: '1.5',
          [getArgDecimalsKey('amount')]: '2',
          enabled: 'TRUE',
          tags: '["alpha","beta"]',
          memo: '255',
          [getArgValueModeKey('memo')]: 'dec',
        },
      ),
    ).toEqual([150n, true, ['alpha', 'beta'], '0xff']);
  });

  test('throws useful errors for missing and invalid array args', () => {
    expect(() =>
      formatContractArgs([{ name: 'amount', type: 'uint256' }], {}),
    ).toThrow('Parameter "amount" is required.');

    expect(() =>
      formatContractArgs([{ name: 'items', type: 'address[]' }], {
        items: 'not json',
      }),
    ).toThrow('Parameter "items" must be a JSON array.');
  });

  test('serializes bigint values recursively', () => {
    expect(
      serializeBigInts({
        amount: 10n,
        nested: [1n, { count: 2n }],
        ok: true,
      }),
    ).toEqual({
      amount: '10',
      nested: ['1', { count: '2' }],
      ok: true,
    });
  });
});
