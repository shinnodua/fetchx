export interface RequestResponse {
  status: string;
  data: unknown;
  duration: number;
  txHash?: string;
  logs: string[];
}

export interface SavedResponse {
  id: string;
  name: string;
  createdAt: string;
  response: RequestResponse;
}

export interface RequestItem {
  id: string;
  name: string;
  type: string; // 'READ' | 'WRITE' | REST method
  target: string;
  abi?: string;
  functionName?: string;
  network?: string;
  customRpcId?: string;
  args?: Record<string, string>;
  headers?: { key: string; value: string }[];
  queryParams?: { key: string; value: string }[];
  body?: string;
  response?: RequestResponse | null;
  savedResponses?: SavedResponse[];
  savedResponsesCollapsed?: boolean;
}

export interface CollectionItem {
  id: string;
  name: string;
  requests: RequestItem[];
}

export interface AbiInput {
  name: string;
  type: string;
  indexed?: boolean;
  internalType?: string;
}

export interface AbiItem {
  type: string;
  name?: string;
  stateMutability?: string;
  constant?: boolean;
  payable?: boolean;
  anonymous?: boolean;
  inputs?: AbiInput[];
  outputs?: AbiInput[];
}

export interface RpcOption {
  id: string;
  name: string;
  chainId: string;
  url?: string;
  explorerUrl?: string;
  isDefault: boolean;
}

export interface CustomRpc {
  id: string;
  name: string;
  chainId: string;
  url: string;
  explorerUrl?: string;
}

export interface EncryptedEnvironmentValue {
  ciphertext: string;
  iv: string;
}

export interface SensitiveCryptoConfig {
  algorithm: 'AES-GCM';
  digest: 'SHA-256';
  iterations: number;
  salt: string;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  sensitive: boolean;
  encryptedValue?: EncryptedEnvironmentValue | null;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}
