import { API_BASE_URLS, buildApiUrl } from './config';
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
  result?:
    | {
        ContractName?: string;
        ABI?: string;
      }[]
    | string;
}

interface BlockscoutContractResponse {
  name?: string;
  abi?: unknown[];
  implementations?: {
    address_hash?: string;
    name?: string | null;
  }[];
}

interface EtherscanApiConfig {
  baseUrl: string;
  chainId?: string;
}

const etherscanApiConfigs: Record<string, EtherscanApiConfig> = {
  '1': { baseUrl: API_BASE_URLS.etherscan },
  '11155111': { baseUrl: API_BASE_URLS.sepoliaEtherscan },
  '137': { baseUrl: API_BASE_URLS.polygonscan },
  '10': { baseUrl: API_BASE_URLS.optimisticEtherscan },
  '42161': { baseUrl: API_BASE_URLS.arbiscan },
  '8453': { baseUrl: API_BASE_URLS.basescan },
  '56': { baseUrl: API_BASE_URLS.etherscanV2, chainId: '56' },
};

const blockscoutBaseUrls: Record<string, string> = {
  '2020': API_BASE_URLS.roninExplorer,
  '202601': API_BASE_URLS.saigonExplorer,
};

/**
 * Fetches contract name and ABI from block explorer APIs by contract address and network.
 */
export async function fetchContractInfo(
  address: string,
  network: string,
): Promise<ImportedContractInfo> {
  const etherscanConfig = etherscanApiConfigs[network];
  if (etherscanConfig) {
    return fetchEtherscanContractInfo(address, network, etherscanConfig);
  }

  const blockscoutBaseUrl = blockscoutBaseUrls[network];
  if (blockscoutBaseUrl) {
    return fetchBlockscoutContractInfo(address, network, blockscoutBaseUrl);
  }

  throw new Error('Unsupported network for contract fetching.');
}

async function fetchEtherscanContractInfo(
  address: string,
  network: string,
  config: EtherscanApiConfig,
): Promise<ImportedContractInfo> {
  const url = new URL(config.baseUrl);
  if (config.chainId) {
    url.searchParams.set('chainid', config.chainId);
  }
  url.searchParams.set('module', 'contract');
  url.searchParams.set('action', 'getsourcecode');
  url.searchParams.set('address', address);

  const response = await apiRequest(
    { url: url.toString() },
    { proxyOnBrowserBlock: true },
  );
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = response.data as EtherscanSourceCodeResponse;

  if (
    data.status !== '1' ||
    !Array.isArray(data.result) ||
    data.result.length === 0
  ) {
    throw new Error(
      (typeof data.result === 'string' && data.result) ||
        data.message ||
        'Failed to fetch contract info.',
    );
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

async function fetchBlockscoutContract(
  address: string,
  baseUrl: string,
): Promise<BlockscoutContractResponse> {
  const response = await apiRequest(
    {
      url: buildApiUrl(baseUrl, `smart-contracts/${address}`),
    },
    { proxyOnBrowserBlock: true },
  );
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.data as BlockscoutContractResponse;
}

async function fetchBlockscoutContractInfo(
  address: string,
  network: string,
  baseUrl: string,
): Promise<ImportedContractInfo> {
  const proxyContract = await fetchBlockscoutContract(address, baseUrl);
  const implementationAddress =
    proxyContract.implementations?.[0]?.address_hash;

  const contract = implementationAddress
    ? await fetchBlockscoutContract(implementationAddress, baseUrl)
    : proxyContract;

  if (!Array.isArray(contract.abi) || contract.abi.length === 0) {
    throw new Error('Contract ABI is not available from this explorer.');
  }

  return {
    name:
      contract.name ||
      proxyContract.implementations?.[0]?.name ||
      proxyContract.name ||
      'Imported Contract',
    abi: JSON.stringify(contract.abi, null, 2),
    address,
    network,
  };
}
