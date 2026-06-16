import { API_BASE_URLS, buildApiUrl } from './config';
import { getApiErrorMessage } from './errors';
import { apiRequest } from './httpClient';

export interface DecodedBytecodeAbi {
  kind?: string;
  abi?: unknown;
  functions?: unknown;
  partialAbi?: unknown;
  unresolvedSelectors?: unknown;
  warnings?: string[];
}

export async function decodeContractBytecode(
  bytecode: string,
  address: string,
  network: string,
): Promise<DecodedBytecodeAbi> {
  const response = await apiRequest({
    url: buildApiUrl(API_BASE_URLS.call3, 'decode-abi'),
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ bytecode, address, network, ai: true }),
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      getApiErrorMessage(response.data) ||
        `Bytecode decoding failed with status ${response.status}.`,
    );
  }

  if (typeof response.data !== 'object' || response.data === null) {
    throw new Error('Bytecode decoder returned an invalid response.');
  }

  return response.data as DecodedBytecodeAbi;
}

export async function decodeContractBytecodeAbi(
  bytecode: string,
  address: string,
  network: string,
): Promise<string> {
  const decoded = await decodeContractBytecode(bytecode, address, network);
  const abi = Array.isArray(decoded.abi) ? decoded.abi : decoded.partialAbi;
  if (!Array.isArray(abi) || abi.length === 0) {
    throw new Error('No contract functions could be inferred from bytecode.');
  }

  return JSON.stringify(abi, null, 2);
}
