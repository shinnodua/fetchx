import { useConnectModal } from '@rainbow-me/rainbowkit';
import { type PublicClient, parseEther } from 'viem';
import {
  useAccount,
  useSendTransaction,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';
import {
  executeNativeTransfer,
  executeReadCall,
  executeSimulateCall,
  executeWriteCall,
} from '../../../services/requestExecutor';
import { useWorkspaceStore } from '../../../store';
import type { EnvironmentVariable, RequestItem } from '../types';
import { parseContractAbi } from '../utils/contractAbi';
import { formatContractArgs, serializeBigInts } from '../utils/contractArgs';
import { redactSensitiveData } from '../utils/environment';
import { getWalletErrorMessage } from '../utils/walletError';

export const useRunContractRequest = (
  publicClient: PublicClient | undefined,
) => {
  const { address, chainId: connectedChainId, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const { chains, switchChainAsync } = useSwitchChain();

  const { updateActiveRequest, addLog } = useWorkspaceStore();

  const ensureSelectedWalletNetwork = async (
    activeNetworkId: number | undefined,
  ) => {
    if (!activeNetworkId || connectedChainId === activeNetworkId) return;

    const selectedChain = chains.find((chain) => chain.id === activeNetworkId);
    if (!selectedChain) {
      throw new Error(
        `The selected network (chain ID ${activeNetworkId}) is not configured for wallet transactions.`,
      );
    }

    try {
      await switchChainAsync({ chainId: selectedChain.id });
    } catch (error) {
      throw new Error(
        `Could not switch to ${selectedChain.name}: ${getWalletErrorMessage(error)}`,
      );
    }
  };

  const runContractRequest = async (
    resolvedRequest: RequestItem,
    redactedRequest: RequestItem,
    activeTabId: string,
    activeVariables: EnvironmentVariable[],
    start: number,
  ) => {
    const activeNetworkId = resolvedRequest.network
      ? Number(resolvedRequest.network)
      : undefined;

    if (resolvedRequest.type === 'SEND') {
      if (!/^0x[a-fA-F0-9]{40}$/.test(resolvedRequest.target)) {
        throw new Error('A valid recipient address is required.');
      }
      if (!isConnected) {
        openConnectModal?.();
        throw new Error('Wallet not connected. Please connect your wallet.');
      }
      await ensureSelectedWalletNetwork(activeNetworkId);

      const rawAmount = resolvedRequest.args?.nativeAmount?.trim() || '';
      if (!rawAmount) {
        throw new Error('Native token amount is required.');
      }

      let value: bigint;
      try {
        value = parseEther(rawAmount);
      } catch {
        throw new Error('Enter a valid native token amount.');
      }
      if (value <= 0n) {
        throw new Error('Native token amount must be greater than zero.');
      }

      addLog(
        activeTabId,
        `Preparing native token transfer to: ${redactedRequest.target}`,
      );
      addLog(
        activeTabId,
        `Amount: ${redactedRequest.args?.nativeAmount || ''}`,
      );
      addLog(activeTabId, `Network ID: ${resolvedRequest.network}`);
      addLog(activeTabId, 'Requesting transaction signature from wallet...');

      const { txHash, receipt } = await executeNativeTransfer(
        resolvedRequest.target,
        value,
        sendTransactionAsync,
        publicClient,
        activeNetworkId,
      );

      addLog(activeTabId, `Transaction sent successfully. Hash: ${txHash}`);
      const duration = Date.now() - start;

      if (receipt) {
        addLog(
          activeTabId,
          `Transaction confirmed in block ${receipt.blockNumber.toString()}`,
        );
        addLog(activeTabId, `Gas used: ${receipt.gasUsed.toString()}`);
        updateActiveRequest({
          response: {
            status: 'Confirmed',
            data: {
              transactionHash: receipt.transactionHash,
              blockNumber: receipt.blockNumber.toString(),
              status: receipt.status === 'success' ? 'SUCCESS' : 'FAILED',
              gasUsed: receipt.gasUsed.toString(),
              amount: rawAmount,
              recipient: resolvedRequest.target,
            },
            duration,
            txHash,
            logs: [
              `[${new Date().toLocaleTimeString()}] Native transfer confirmed.`,
              `[${new Date().toLocaleTimeString()}] Block: ${receipt.blockNumber.toString()}`,
              `[${new Date().toLocaleTimeString()}] Status: ${receipt.status.toUpperCase()}`,
            ],
          },
        });
      } else {
        updateActiveRequest({
          response: {
            status: 'Sent',
            data: {
              transactionHash: txHash,
              amount: rawAmount,
              recipient: resolvedRequest.target,
            },
            duration,
            txHash,
            logs: [
              `[${new Date().toLocaleTimeString()}] Native transfer sent.`,
            ],
          },
        });
      }
    } else if (
      resolvedRequest.type === 'READ' ||
      resolvedRequest.type === 'WRITE'
    ) {
      if (!resolvedRequest.target) {
        throw new Error('Contract address is required.');
      }

      const parsedAbi = parseContractAbi(resolvedRequest.abi || '');
      if (!parsedAbi) {
        throw new Error(
          'Invalid ABI format. Paste ABI JSON or human-readable ABI signatures.',
        );
      }

      const selectedFunc = parsedAbi.find(
        (item) =>
          item.type === 'function' &&
          item.name === resolvedRequest.functionName,
      );

      if (!selectedFunc) {
        throw new Error(
          `Function "${resolvedRequest.functionName}" not found in ABI.`,
        );
      }

      // Parse function arguments
      const formattedArgs = formatContractArgs(
        selectedFunc.inputs,
        resolvedRequest.args,
      );

      addLog(
        activeTabId,
        `Initiating contract call: ${selectedFunc.name}(${(
          selectedFunc.inputs || []
        )
          .map(
            (input, idx) =>
              redactedRequest.args?.[input.name || `arg${idx}`] || '',
          )
          .join(', ')})`,
      );
      addLog(activeTabId, `Target Contract: ${redactedRequest.target}`);
      addLog(activeTabId, `Network ID: ${resolvedRequest.network}`);

      if (resolvedRequest.type === 'READ') {
        addLog(activeTabId, 'Querying contract state...');
        const result = await executeReadCall(
          resolvedRequest.target,
          parsedAbi,
          resolvedRequest.functionName || '',
          formattedArgs,
          publicClient,
        );

        const duration = Date.now() - start;
        addLog(activeTabId, `State call succeeded in ${duration}ms.`);

        // Serialize output safely (BigInt to string)
        const serializedData =
          typeof result === 'bigint' ? result.toString() : result;
        const redactedSerializedData = redactSensitiveData(
          serializedData,
          activeVariables,
        );

        updateActiveRequest({
          response: {
            status: 'Success',
            data: redactedSerializedData,
            duration,
            logs: [
              `[${new Date().toLocaleTimeString()}] Query succeeded.`,
              `[${new Date().toLocaleTimeString()}] Result: ${JSON.stringify(redactedSerializedData)}`,
            ],
          },
        });
      } else {
        // WRITE CALL
        if (!isConnected) {
          openConnectModal?.();
          throw new Error('Wallet not connected. Please connect your wallet.');
        }
        await ensureSelectedWalletNetwork(activeNetworkId);

        addLog(activeTabId, 'Requesting transaction signature from wallet...');
        const { txHash, receipt } = await executeWriteCall(
          resolvedRequest.target,
          parsedAbi,
          resolvedRequest.functionName || '',
          formattedArgs,
          writeContractAsync,
          publicClient,
          activeNetworkId,
        );

        addLog(activeTabId, `Transaction sent successfully. Hash: ${txHash}`);

        if (receipt) {
          const duration = Date.now() - start;
          addLog(
            activeTabId,
            `Transaction confirmed in block ${receipt.blockNumber.toString()}`,
          );
          addLog(activeTabId, `Gas used: ${receipt.gasUsed.toString()}`);

          updateActiveRequest({
            response: {
              status: 'Confirmed',
              data: {
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber.toString(),
                status: receipt.status === 'success' ? 'SUCCESS' : 'FAILED',
                gasUsed: receipt.gasUsed.toString(),
              },
              duration,
              txHash,
              logs: [
                `[${new Date().toLocaleTimeString()}] Transaction Confirmed!`,
                `[${new Date().toLocaleTimeString()}] Block: ${receipt.blockNumber.toString()}`,
                `[${new Date().toLocaleTimeString()}] Status: ${receipt.status.toUpperCase()}`,
              ],
            },
          });
        } else {
          const duration = Date.now() - start;
          updateActiveRequest({
            response: {
              status: 'Sent',
              data: { transactionHash: txHash },
              duration,
              txHash,
              logs: [
                `[${new Date().toLocaleTimeString()}] Transaction Sent. Bypassed confirmation tracking.`,
              ],
            },
          });
        }
      }
    }
  };

  const simulateContractRequest = async (
    resolvedRequest: RequestItem,
    redactedRequest: RequestItem,
    activeTabId: string,
    activeVariables: EnvironmentVariable[],
    start: number,
  ) => {
    if (resolvedRequest.type !== 'WRITE') return;

    if (!resolvedRequest.target) {
      throw new Error('Contract address is required.');
    }

    const parsedAbi = parseContractAbi(resolvedRequest.abi || '');
    if (!parsedAbi) {
      throw new Error(
        'Invalid ABI format. Paste ABI JSON or human-readable ABI signatures.',
      );
    }

    const selectedFunc = parsedAbi.find(
      (item) =>
        item.type === 'function' && item.name === resolvedRequest.functionName,
    );

    if (!selectedFunc) {
      throw new Error(
        `Function "${resolvedRequest.functionName}" not found in ABI.`,
      );
    }

    // Parse function arguments
    const formattedArgs = formatContractArgs(
      selectedFunc.inputs,
      resolvedRequest.args,
    );

    addLog(
      activeTabId,
      `[Simulation] Initiating contract dry-run: ${selectedFunc.name}(${(
        selectedFunc.inputs || []
      )
        .map(
          (input, idx) =>
            redactedRequest.args?.[input.name || `arg${idx}`] || '',
        )
        .join(', ')})`,
    );
    addLog(
      activeTabId,
      `[Simulation] Target Contract: ${redactedRequest.target}`,
    );
    addLog(activeTabId, `[Simulation] Network ID: ${resolvedRequest.network}`);
    if (address) {
      addLog(activeTabId, `[Simulation] Sender account: ${address}`);
    } else {
      addLog(
        activeTabId,
        '[Simulation] No wallet connected. Simulating with default sender.',
      );
    }

    addLog(activeTabId, '[Simulation] Simulating transaction...');

    const simulateResult = await executeSimulateCall(
      resolvedRequest.target,
      parsedAbi,
      resolvedRequest.functionName || '',
      formattedArgs,
      publicClient,
      address,
    );

    const duration = Date.now() - start;
    addLog(
      activeTabId,
      `[Simulation] Transaction dry-run succeeded in ${duration}ms.`,
    );

    // Format return result if simulation returned something (simulateContract returns { result, request })
    const resultData = simulateResult.result;
    const serializedData =
      typeof resultData === 'bigint'
        ? resultData.toString()
        : resultData === undefined
          ? { simulation: 'SUCCESS' }
          : serializeBigInts(resultData);
    const redactedSerializedData = redactSensitiveData(
      serializedData,
      activeVariables,
    );

    updateActiveRequest({
      response: {
        status: 'Success',
        data: redactedSerializedData,
        duration,
        logs: [
          `[${new Date().toLocaleTimeString()}] Simulation succeeded.`,
          `[${new Date().toLocaleTimeString()}] Result: ${JSON.stringify(redactedSerializedData)}`,
        ],
      },
    });
  };

  return {
    isConnected,
    openConnectModal,
    runContractRequest,
    simulateContractRequest,
  };
};
