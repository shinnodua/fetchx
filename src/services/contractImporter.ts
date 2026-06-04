export interface ImportedContractInfo {
  name: string;
  abi: string;
  address: string;
  network: string;
}

const baseUrls: Record<string, string> = {
  '1': 'https://api.etherscan.io/api',
  '11155111': 'https://api-sepolia.etherscan.io/api',
  '137': 'https://api.polygonscan.com/api',
  '10': 'https://api-optimistic.etherscan.io/api',
  '42161': 'https://api.arbiscan.io/api',
  '8453': 'https://api.basescan.org/api',
};

/**
 * Fetches contract name and ABI from block explorer APIs by contract address and network.
 */
export async function fetchContractInfo(
  address: string,
  network: string,
): Promise<ImportedContractInfo> {
  const baseUrl = baseUrls[network];
  if (!baseUrl) {
    throw new Error('Unsupported network for contract fetching.');
  }

  // Etherscan getsourcecode returns contract name and ABI in a single call if verified
  const url = `${baseUrl}?module=contract&action=getsourcecode&address=${address}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== '1' || !data.result || data.result.length === 0) {
    throw new Error(data.message || 'Failed to fetch contract info.');
  }

  const contract = data.result[0];

  // If the contract is not verified, result[0].ABI will typically contain a message
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
