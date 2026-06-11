import { getDefaultConfig } from '@rainbow-me/rainbowkit';
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

export const config = getDefaultConfig({
  appName: 'Call3.dev',
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
  ssr: false, // Since this is a client-side Vite app
});
