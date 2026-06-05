import type { Abi, TransactionReceipt } from 'viem';
import type { AbiItem } from '../features/workspace/types';
import { executeRestApiCall } from './api';

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
  return await executeRestApiCall(type, target, headers, queryParams, body);
}
