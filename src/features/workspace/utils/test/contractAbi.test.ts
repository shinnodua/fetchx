import { describe, expect, test } from 'bun:test';

import type { AbiItem } from '../../types';
import {
  formatContractAbi,
  isContractBytecode,
  isReadContractFunction,
  isWriteContractFunction,
  parseContractAbi,
} from '../contractAbi';

const balanceOfAbiItem: AbiItem = {
  type: 'function',
  name: 'balanceOf',
  stateMutability: 'view',
  inputs: [{ name: 'account', type: 'address' }],
  outputs: [{ name: '', type: 'uint256' }],
};

describe('contract ABI utilities', () => {
  test('parses ABI arrays and wrapped ABI payloads', () => {
    expect(parseContractAbi(JSON.stringify([balanceOfAbiItem]))).toEqual([
      balanceOfAbiItem,
    ]);
    expect(
      parseContractAbi(JSON.stringify({ result: { abi: [balanceOfAbiItem] } })),
    ).toEqual([balanceOfAbiItem]);
  });

  test('parses human-readable ABI signatures', () => {
    const parsed = parseContractAbi(`
      function balanceOf(address account) view returns (uint256)
      function transfer(address to, uint256 amount) returns (bool)
    `);

    expect(parsed?.map((item) => item.name)).toEqual(['balanceOf', 'transfer']);
  });

  test('formats parsed ABI as pretty JSON', () => {
    expect(formatContractAbi(JSON.stringify([balanceOfAbiItem]))).toBe(
      JSON.stringify([balanceOfAbiItem], null, 2),
    );
    expect(formatContractAbi('not an abi')).toBeNull();
  });

  test('detects bytecode-looking input', () => {
    expect(isContractBytecode(`0x${'ab'.repeat(21)}`)).toBe(true);
    expect(isContractBytecode('0x1234')).toBe(false);
    expect(isContractBytecode(`0x${'zz'.repeat(21)}`)).toBe(false);
  });

  test('classifies read and write functions', () => {
    expect(isReadContractFunction(balanceOfAbiItem)).toBe(true);
    expect(isWriteContractFunction(balanceOfAbiItem)).toBe(false);

    const payable: AbiItem = {
      type: 'function',
      name: 'deposit',
      stateMutability: 'payable',
      inputs: [],
      outputs: [],
    };
    expect(isReadContractFunction(payable)).toBe(false);
    expect(isWriteContractFunction(payable)).toBe(true);

    const legacyConstant: AbiItem = {
      type: 'function',
      name: 'name',
      constant: true,
      inputs: [],
      outputs: [{ name: '', type: 'string' }],
    };
    expect(isReadContractFunction(legacyConstant)).toBe(true);
    expect(isWriteContractFunction(legacyConstant)).toBe(false);
  });
});
