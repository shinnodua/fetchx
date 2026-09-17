import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import {
  arbitrum,
  base,
  bsc,
  mainnet,
  optimism,
  polygon,
  ronin,
  saigon,
  sepolia,
} from 'wagmi/chains';
import { createCorsProxyFetch } from './services/api/rpcTransport';

const corsProxyFetch = createCorsProxyFetch();

export const config = getDefaultConfig({
  appName: 'FetchX',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [
    mainnet,
    sepolia,
    polygon,
    optimism,
    arbitrum,
    base,
    bsc,
    ronin,
    saigon,
  ],
  transports: {
    [mainnet.id]: http(undefined, { fetchFn: corsProxyFetch }),
    [sepolia.id]: http(undefined, { fetchFn: corsProxyFetch }),
    [polygon.id]: http(undefined, { fetchFn: corsProxyFetch }),
    [optimism.id]: http(undefined, { fetchFn: corsProxyFetch }),
    [arbitrum.id]: http(undefined, { fetchFn: corsProxyFetch }),
    [base.id]: http(undefined, { fetchFn: corsProxyFetch }),
    [bsc.id]: http(undefined, { fetchFn: corsProxyFetch }),
    [ronin.id]: http(undefined, { fetchFn: corsProxyFetch }),
    [saigon.id]: http(undefined, { fetchFn: corsProxyFetch }),
  },
  ssr: false, // Since this is a client-side Vite app
});
