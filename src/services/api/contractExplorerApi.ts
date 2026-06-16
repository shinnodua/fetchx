import { buildCall3ApiUrl } from './config';
import { getApiErrorMessage } from './errors';
import { apiRequest } from './httpClient';

export interface ImportedContractInfo {
  name: string;
  abi: string;
  address: string;
  network: string;
}

interface ContractInfoResponse {
  name?: unknown;
  abi?: unknown;
  address?: unknown;
  network?: unknown;
}

/**
 * Fetches normalized contract metadata through call3-service.
 */
export async function fetchContractInfo(
  address: string,
  network: string,
): Promise<ImportedContractInfo> {
  const url = buildCall3ApiUrl('contract-info');
  if (!url) {
    throw new Error('Call3 API URL is not configured.');
  }

  const response = await apiRequest({
    url,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ address, network, ai: true }),
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      getApiErrorMessage(response.data) ||
        `Contract lookup failed with status ${response.status}.`,
    );
  }

  const data = response.data as ContractInfoResponse;
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof data.name !== 'string' ||
    typeof data.address !== 'string' ||
    typeof data.network !== 'string' ||
    (data.abi !== null && !Array.isArray(data.abi))
  ) {
    throw new Error('Contract info service returned an invalid response.');
  }

  return {
    name: data.name,
    abi: data.abi ? JSON.stringify(data.abi, null, 2) : '',
    address: data.address,
    network: data.network,
  };
}
