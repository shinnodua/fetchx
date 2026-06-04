import type { Abi, TransactionReceipt } from 'viem';
import type { AbiItem } from '../features/workspace/types';

interface ContractClient {
  readContract: (parameters: {
    address: `0x${string}`;
    abi: Abi;
    functionName: string;
    args: unknown[];
  }) => Promise<unknown>;
  waitForTransactionReceipt: (parameters: {
    hash: `0x${string}`;
  }) => Promise<TransactionReceipt>;
}

type WriteContractAsync = (parameters: {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args: unknown[];
  chainId: number | undefined;
}) => Promise<`0x${string}`>;

/**
 * Executes a contract state read call (view/pure function).
 */
export async function executeReadCall(
  target: string,
  parsedAbi: AbiItem[],
  functionName: string,
  formattedArgs: unknown[],
  publicClient: ContractClient | undefined,
) {
  if (!publicClient) {
    throw new Error('Public client not available. Select a supported network.');
  }
  return await publicClient.readContract({
    address: target as `0x${string}`,
    abi: parsedAbi as unknown as Abi,
    functionName,
    args: formattedArgs,
  });
}

/**
 * Triggers a contract state write call, prompts user wallet, and waits for block confirmation.
 */
export async function executeWriteCall(
  target: string,
  parsedAbi: AbiItem[],
  functionName: string,
  formattedArgs: unknown[],
  writeContractAsync: WriteContractAsync | undefined,
  publicClient: ContractClient | undefined,
  chainId: number | undefined,
) {
  if (!writeContractAsync) {
    throw new Error('Wallet connection / writeContract not available.');
  }
  const txHash = await writeContractAsync({
    address: target as `0x${string}`,
    abi: parsedAbi as unknown as Abi,
    functionName,
    args: formattedArgs,
    chainId,
  });

  if (!publicClient) {
    return { txHash, receipt: null };
  }

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
  return { txHash, receipt };
}

/**
 * Executes a REST API client call (GET / POST).
 */
export async function executeRestCall(
  type: string,
  target: string,
  headers: { key: string; value: string }[] | undefined,
  queryParams: { key: string; value: string }[] | undefined,
  body: string | undefined,
) {
  const query = new URLSearchParams();
  if (queryParams) {
    for (const q of queryParams) {
      if (q.key) query.append(q.key, q.value);
    }
  }
  const queryString = query.toString();
  const url = queryString ? `${target}?${queryString}` : target;

  const headersObj: Record<string, string> = {};
  if (headers) {
    for (const h of headers) {
      if (h.key) headersObj[h.key] = h.value;
    }
  }

  const fetchOptions: RequestInit = {
    method: type,
    headers: headersObj,
  };

  if (type === 'POST' && body) {
    fetchOptions.body = body;
  }

  const response = await fetch(url, fetchOptions);
  const contentType = response.headers.get('content-type');

  let responseData: unknown;
  if (contentType?.includes('application/json')) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  return {
    statusText: `${response.status} ${response.statusText}`,
    data: responseData,
  };
}
