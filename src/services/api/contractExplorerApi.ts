import { API_BASE_URLS } from './config';
import { apiRequest } from './httpClient';

export interface ImportedContractInfo {
  name: string;
  abi: string;
  address: string;
  network: string;
}

interface EtherscanSourceCodeResponse {
  status: string;
  message?: string;
  result?: {
    ContractName?: string;
    ABI?: string;
  }[];
}

const explorerBaseUrls: Record<string, string> = {
  '1': API_BASE_URLS.etherscan,
  '11155111': API_BASE_URLS.sepoliaEtherscan,
  '137': API_BASE_URLS.polygonscan,
  '10': API_BASE_URLS.optimisticEtherscan,
  '42161': API_BASE_URLS.arbiscan,
  '8453': API_BASE_URLS.basescan,
};

/**
 * Fetches contract name and ABI from block explorer APIs by contract address and network.
 */
export async function fetchContractInfo(
  address: string,
  network: string,
): Promise<ImportedContractInfo> {
  const baseUrl = explorerBaseUrls[network];
  if (!baseUrl) {
    throw new Error('Unsupported network for contract fetching.');
  }

  const url = new URL(baseUrl);
  url.searchParams.set('module', 'contract');
  url.searchParams.set('action', 'getsourcecode');
  url.searchParams.set('address', address);

  const response = await apiRequest({ url: url.toString() });
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = response.data as EtherscanSourceCodeResponse;

  if (data.status !== '1' || !data.result || data.result.length === 0) {
    throw new Error(data.message || 'Failed to fetch contract info.');
  }

  const contract = data.result[0];
  const name = contract.ContractName || 'Imported Contract';
  let abi = contract.ABI || '';

  if (abi === 'Contract source code not verified' || !abi) {
    abi = '';
  }

  return {
    name,
    abi,
    address,
    network,
  };
}
