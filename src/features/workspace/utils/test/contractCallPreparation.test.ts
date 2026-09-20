import { describe, expect, test } from 'bun:test';

import { prepareContractCall } from '../contractCallPreparation';

describe('prepareContractCall', () => {
  test('validates and prepares a contract function call', () => {
    const prepared = prepareContractCall({
      id: 'request-1',
      name: 'Balance',
      type: 'READ',
      target: '0x123',
      abi: '[{"type":"function","name":"balanceOf","inputs":[{"name":"owner","type":"address"}]}]',
      functionName: 'balanceOf',
      args: { owner: '0x0000000000000000000000000000000000000001' },
    });

    expect(prepared.selectedFunction.name).toBe('balanceOf');
    expect(prepared.formattedArgs).toEqual([
      '0x0000000000000000000000000000000000000001',
    ]);
  });
});
