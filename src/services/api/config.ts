export const API_BASE_URLS = {
  call3: import.meta.env.VITE_API_URL_CALL3,
  etherscan: import.meta.env.VITE_API_URL_ETHERSCAN,
  sepoliaEtherscan: import.meta.env.VITE_API_URL_SEPOLIA_ETHERSCAN,
  polygonscan: import.meta.env.VITE_API_URL_POLYGONSCAN,
  optimisticEtherscan: import.meta.env.VITE_API_URL_OPTIMISTIC_ETHERSCAN,
  arbiscan: import.meta.env.VITE_API_URL_ARBISCAN,
  basescan: import.meta.env.VITE_API_URL_BASESCAN,
  etherscanV2: import.meta.env.VITE_API_URL_ETHERSCAN_V2,
  roninExplorer: import.meta.env.VITE_API_URL_RONIN_EXPLORER,
  saigonExplorer: import.meta.env.VITE_API_URL_SAIGON_EXPLORER,
} as const;

export function buildApiUrl(baseUrl: string, path = '') {
  if (!path) return baseUrl;

  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
