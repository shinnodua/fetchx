import { ERC20_ABI } from './constants/erc20';
import { ERC721_ABI } from './constants/erc721';
import { ERC1155_ABI } from './constants/erc1155';
import type { CollectionItem } from './types';

export { ERC20_ABI, ERC721_ABI, ERC1155_ABI };

export const DEFAULT_COLLECTIONS: CollectionItem[] = [
  {
    id: 'c-1',
    name: 'Uniswap Token V2 (ERC-20)',
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
    name: 'Public JSON APIs',
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
];

export const METHOD_OPTIONS = [
  { value: 'READ', label: 'READ (Contract)' },
  { value: 'WRITE', label: 'WRITE (Contract)' },
  { value: 'GET', label: 'GET (REST)' },
  { value: 'POST', label: 'POST (REST)' },
];
