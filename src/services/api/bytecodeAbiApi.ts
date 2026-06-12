import { API_BASE_URLS, buildApiUrl } from './config';
import { apiRequest } from './httpClient';

export interface DecodedBytecodeAbi {
  kind?: string;
  functions?: unknown;
  partialAbi?: unknown;
  unresolvedSelectors?: unknown;
  warnings?: string[];
}

export async function decodeContractBytecode(
  bytecode: string,
): Promise<DecodedBytecodeAbi> {
  const response = await apiRequest({
    url: buildApiUrl(API_BASE_URLS.call3, 'decode-abi'),
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ bytecode }),
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Bytecode decoding failed with status ${response.status}.`);
  }

  if (typeof response.data !== 'object' || response.data === null) {
    throw new Error('Bytecode decoder returned an invalid response.');
  }

  return response.data as DecodedBytecodeAbi;
}

export async function decodeContractBytecodeAbi(
  bytecode: string,
): Promise<string> {
  const decoded = await decodeContractBytecode(bytecode);
  if (!Array.isArray(decoded.partialAbi) || decoded.partialAbi.length === 0) {
    throw new Error('No contract functions could be inferred from bytecode.');
  }

  return JSON.stringify(decoded.partialAbi, null, 2);
}
