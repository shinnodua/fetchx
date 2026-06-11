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
  simulateContract: (parameters: {
    address: `0x${string}`;
    abi: Abi;
    functionName: string;
    args: unknown[];
    account?: `0x${string}`;
  }) => Promise<{ result: unknown }>;
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

type SendTransactionAsync = (parameters: {
  to: `0x${string}`;
  value: bigint;
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
 * Simulates a contract transaction execution (dry-run).
 */
export async function executeSimulateCall(
  target: string,
  parsedAbi: AbiItem[],
  functionName: string,
  formattedArgs: unknown[],
  publicClient: ContractClient | undefined,
  accountAddress: `0x${string}` | undefined,
) {
  if (!publicClient) {
    throw new Error('Public client not available. Select a supported network.');
  }
  return await publicClient.simulateContract({
    address: target as `0x${string}`,
    abi: parsedAbi as unknown as Abi,
    functionName,
    args: formattedArgs,
    account: accountAddress,
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
 * Sends native currency through the connected wallet and waits for confirmation.
 */
export async function executeNativeTransfer(
  target: string,
  value: bigint,
  sendTransactionAsync: SendTransactionAsync | undefined,
  publicClient: ContractClient | undefined,
  chainId: number | undefined,
) {
  if (!sendTransactionAsync) {
    throw new Error('Wallet connection / sendTransaction not available.');
  }

  const txHash = await sendTransactionAsync({
    to: target as `0x${string}`,
    value,
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
 * Executes a REST API client call.
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
