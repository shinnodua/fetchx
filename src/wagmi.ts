import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Web3 React App',
  projectId: 'YOUR_PROJECT_ID', // Replaced with a real project ID in production
  chains: [mainnet, sepolia, polygon, optimism, arbitrum, base],
  ssr: false, // Since this is a client-side Vite app
});
