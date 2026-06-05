export const API_BASE_URLS = {
  call3: 'https://api.call3.dev',
  etherscan: 'https://api.etherscan.io/api',
  sepoliaEtherscan: 'https://api-sepolia.etherscan.io/api',
  polygonscan: 'https://api.polygonscan.com/api',
  optimisticEtherscan: 'https://api-optimistic.etherscan.io/api',
  arbiscan: 'https://api.arbiscan.io/api',
  basescan: 'https://api.basescan.org/api',
} as const;

export function buildApiUrl(baseUrl: string, path = '') {
  if (!path) return baseUrl;

  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
