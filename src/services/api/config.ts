export const API_BASE_URLS = {
  call3: import.meta.env.VITE_API_URL_CALL3,
  etherscan:
    import.meta.env.VITE_API_URL_ETHERSCAN || 'https://api.etherscan.io/api',
  sepoliaEtherscan:
    import.meta.env.VITE_API_URL_SEPOLIA_ETHERSCAN ||
    'https://api-sepolia.etherscan.io/api',
  polygonscan:
    import.meta.env.VITE_API_URL_POLYGONSCAN ||
    'https://api.polygonscan.com/api',
  optimisticEtherscan:
    import.meta.env.VITE_API_URL_OPTIMISTIC_ETHERSCAN ||
    'https://api-optimistic.etherscan.io/api',
  arbiscan:
    import.meta.env.VITE_API_URL_ARBISCAN || 'https://api.arbiscan.io/api',
  basescan:
    import.meta.env.VITE_API_URL_BASESCAN || 'https://api.basescan.org/api',
  roninExplorer:
    import.meta.env.VITE_API_URL_RONIN_EXPLORER ||
    'https://explorer.roninchain.com/api/v2',
  saigonExplorer:
    import.meta.env.VITE_API_URL_SAIGON_EXPLORER ||
    'https://saigon-explorer.roninchain.com/api/v2',
} as const;

export function buildApiUrl(baseUrl: string, path = '') {
  if (!path) return baseUrl;

  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
