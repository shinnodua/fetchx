export interface RequestResponse {
  status: string;
  data: unknown;
  duration: number;
  txHash?: string;
  logs: string[];
}

export interface RequestItem {
  id: string;
  name: string;
  type: string; // 'READ' | 'WRITE' | 'GET' | 'POST'
  target: string;
  abi?: string;
  functionName?: string;
  network?: string;
  args?: Record<string, string>;
  headers?: { key: string; value: string }[];
  queryParams?: { key: string; value: string }[];
  body?: string;
  response?: RequestResponse | null;
}

export interface CollectionItem {
  id: string;
  name: string;
  requests: RequestItem[];
}

export interface AbiInput {
  name: string;
  type: string;
}

export interface AbiItem {
  type: string;
  name: string;
  stateMutability?: string;
  constant?: boolean;
  inputs?: AbiInput[];
}
