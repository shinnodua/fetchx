import type { AbiItem, RequestItem } from '../types';
import { parseContractAbi } from './contractAbi';
import { formatContractArgs } from './contractArgs';

interface PreparedContractCall {
  formattedArgs: unknown[];
  parsedAbi: AbiItem[];
  selectedFunction: AbiItem;
}

export function prepareContractCall(
  request: RequestItem,
): PreparedContractCall {
  if (!request.target) throw new Error('Contract address is required.');

  const parsedAbi = parseContractAbi(request.abi || '');
  if (!parsedAbi) {
    throw new Error(
      'Invalid ABI format. Paste ABI JSON or human-readable ABI signatures.',
    );
  }

  const selectedFunction = parsedAbi.find(
    (item) => item.type === 'function' && item.name === request.functionName,
  );
  if (!selectedFunction) {
    throw new Error(`Function "${request.functionName}" not found in ABI.`);
  }

  return {
    formattedArgs: formatContractArgs(selectedFunction.inputs, request.args),
    parsedAbi,
    selectedFunction,
  };
}
