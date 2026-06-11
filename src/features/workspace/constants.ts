import { ERC20_ABI } from './constants/erc20';
import { ERC721_ABI } from './constants/erc721';
import { ERC1155_ABI } from './constants/erc1155';
import type { CollectionItem, RpcOption } from './types';

export { ERC20_ABI, ERC721_ABI, ERC1155_ABI };

export const DEFAULT_COLLECTIONS: CollectionItem[] = [
  {
    id: 'c-1',
    name: '[Example] Uniswap Token V2 (ERC-20)',
    requests: [
      {
        id: 'r-1',
        name: 'Get Total Supply',
        type: 'READ',
        target: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        abi: JSON.stringify(ERC20_ABI, null, 2),
        functionName: 'totalSupply',
        network: '1',
        args: {},
        headers: [],
        queryParams: [],
        body: '',
        response: null,
      },
      {
        id: 'r-2',
        name: 'Check UNI Balance',
        type: 'READ',
        target: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        abi: JSON.stringify(ERC20_ABI, null, 2),
        functionName: 'balanceOf',
        network: '1',
        args: { account: '0x1a5250447E45C90d5fE1F74e6222d41bC1b6efcf' },
        headers: [],
        queryParams: [],
        body: '',
        response: null,
      },
      {
        id: 'r-3',
        name: 'Transfer UNI (Simulate)',
        type: 'WRITE',
        target: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        abi: JSON.stringify(ERC20_ABI, null, 2),
        functionName: 'transfer',
        network: '1',
        args: {
          recipient: '0x0000000000000000000000000000000000000000',
          amount: '1000000000000000000',
        },
        headers: [],
        queryParams: [],
        body: '',
        response: null,
      },
    ],
  },
  {
    id: 'c-2',
    name: '[Example] Public JSON APIs',
    requests: [
      {
        id: 'r-4',
        name: 'Get User List',
        type: 'GET',
        target: 'https://jsonplaceholder.typicode.com/users',
        abi: '',
        functionName: '',
        network: '',
        args: {},
        headers: [{ key: 'Accept', value: 'application/json' }],
        queryParams: [{ key: '_limit', value: '3' }],
        body: '',
        response: null,
      },
      {
        id: 'r-5',
        name: 'Create Post Request',
        type: 'POST',
        target: 'https://jsonplaceholder.typicode.com/posts',
        abi: '',
        functionName: '',
        network: '',
        args: {},
        headers: [{ key: 'Content-Type', value: 'application/json' }],
        queryParams: [],
        body: JSON.stringify(
          {
            title: 'Flamingo Premium Post',
            body: 'Constructing dynamic interfaces with Antigravity.',
            userId: 1,
          },
          null,
          2,
        ),
        response: null,
      },
    ],
  },
];

export const NETWORK_OPTIONS = [
  { value: '1', label: 'Ethereum Mainnet' },
  { value: '11155111', label: 'Sepolia Testnet' },
  { value: '137', label: 'Polygon Mainnet' },
  { value: '10', label: 'Optimism Mainnet' },
  { value: '42161', label: 'Arbitrum One' },
  { value: '8453', label: 'Base' },
  { value: '56', label: 'BNB Smart Chain' },
  { value: '2020', label: 'Ronin Mainnet' },
  { value: '202601', label: 'Saigon Testnet' },
];

const DEFAULT_EXPLORER_URLS: Record<string, string> = {
  '1': 'https://etherscan.io',
  '11155111': 'https://sepolia.etherscan.io',
  '137': 'https://polygonscan.com',
  '10': 'https://optimistic.etherscan.io',
  '42161': 'https://arbiscan.io',
  '8453': 'https://basescan.org',
  '56': 'https://bscscan.com',
  '2020': 'https://explorer.roninchain.com',
  '202601': 'https://saigon-explorer.roninchain.com',
};

export const DEFAULT_RPC_OPTIONS: RpcOption[] = NETWORK_OPTIONS.map(
  (network) => ({
    id: `default-${network.value}`,
    name: network.label,
    chainId: network.value,
    explorerUrl: DEFAULT_EXPLORER_URLS[network.value],
    isDefault: true,
  }),
);

export const METHOD_OPTIONS = [
  { value: 'READ', label: 'READ (Contract)' },
  { value: 'WRITE', label: 'WRITE (Contract)' },
  { value: 'SEND', label: 'SEND (Native Token)' },
  { value: 'GET', label: 'GET (REST)' },
  { value: 'POST', label: 'POST (REST)' },
  { value: 'PUT', label: 'PUT (REST)' },
  { value: 'PATCH', label: 'PATCH (REST)' },
  { value: 'DELETE', label: 'DELETE (REST)' },
];

const NATIVE_TOKEN_SYMBOLS: Record<string, string> = {
  '1': 'ETH',
  '11155111': 'ETH',
  '137': 'POL',
  '10': 'ETH',
  '42161': 'ETH',
  '8453': 'ETH',
  '56': 'BNB',
  '2020': 'RON',
  '202601': 'RON',
};

export function getNativeTokenSymbol(network: string | undefined) {
  return (network && NATIVE_TOKEN_SYMBOLS[network]) || 'native token';
}

export const REST_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
export const REST_METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH', 'DELETE'];

export function isRestMethod(type: string | undefined) {
  return !!type && REST_METHODS.includes(type);
}

export function methodSupportsBody(type: string | undefined) {
  return !!type && REST_METHODS_WITH_BODY.includes(type);
}
