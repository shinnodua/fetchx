import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useEffect, useRef, useState } from 'react';
import { type PublicClient, parseEther } from 'viem';
import {
  useAccount,
  useSendTransaction,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';
import { useToast } from '../../../components';
import {
  executeNativeTransfer,
  executeReadCall,
  executeRestCall,
  executeWriteCall,
} from '../../../services/requestExecutor';
import { useEnvironmentStore, useWorkspaceStore } from '../../../store';
import { isRestMethod } from '../constants';
import type { RequestItem } from '../types';
import { parseContractAbi } from '../utils/contractAbi';
import { formatContractArgs } from '../utils/contractArgs';
import {
  getLockedSensitiveVariableNames,
  redactSensitiveData,
  redactSensitiveValues,
  resolveVariables,
} from '../utils/environment';
import {
  createImportedRequestName,
  parseRequestImportContent,
} from '../utils/requestImport';
import { getWalletErrorMessage } from '../utils/walletError';

export const useRequestRunner = (
  activeRequest: RequestItem | null,
  activeTabId: string,
  publicClient: PublicClient | undefined,
) => {
  const { chainId: connectedChainId, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const { chains, switchChainAsync } = useSwitchChain();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedColId, setSelectedColId] = useState('');
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);

  const { collections, updateActiveRequest, addLog, saveDraft } =
    useWorkspaceStore();

  const activeNetworkId = activeRequest?.network
    ? Number(activeRequest.network)
    : undefined;

  const ensureSelectedWalletNetwork = async () => {
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

  // Selected collection ID sync
  const prevLengthRef = useRef(collections.length);
  useEffect(() => {
    if (collections.length > 0) {
      if (collections.length > prevLengthRef.current) {
        setSelectedColId(collections[collections.length - 1].id);
      } else if (
        !selectedColId ||
        !collections.some((c) => c.id === selectedColId)
      ) {
        setSelectedColId(collections[0].id);
      }
    } else {
      setSelectedColId('');
    }
    prevLengthRef.current = collections.length;
  }, [collections, selectedColId]);

  const handleTargetPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData('text').trim();
    const lowerText = pastedText.toLowerCase();

    const isCurl = lowerText.startsWith('curl');
    const isFetch = lowerText.startsWith('fetch');
    const isUrlWithParams =
      (lowerText.startsWith('http://') || lowerText.startsWith('https://')) &&
      pastedText.includes('?');

    if (!isCurl && !isFetch && !isUrlWithParams) return;

    event.preventDefault();

    try {
      const parsed = parseRequestImportContent(pastedText);
      if (!parsed.target) {
        toast({
          title: 'Import Failed',
          description: 'Could not find a URL in the pasted content.',
          type: 'error',
        });
        return;
      }

      if (isUrlWithParams) {
        updateActiveRequest({
          target: parsed.target,
          queryParams: parsed.queryParams || [],
        });
        toast({
          title: 'URL Parameters Parsed',
          description: 'URL and query parameters updated successfully.',
          type: 'success',
        });
        return;
      }

      const parsedMethod = (parsed.type || 'GET').toUpperCase();
      const supportedMethod = isRestMethod(parsedMethod)
        ? parsedMethod
        : parsed.body
          ? 'POST'
          : 'GET';

      updateActiveRequest({
        name: createImportedRequestName(supportedMethod, parsed.target),
        type: supportedMethod,
        target: parsed.target,
        headers: parsed.headers || [],
        queryParams: parsed.queryParams || [],
        body: parsed.body || '',
        abi: '',
        functionName: '',
        args: {},
        response: null,
      });

      toast({
        title: 'Request Imported',
        description: `Imported from ${isCurl ? 'cURL' : 'fetch'} command successfully.`,
        type: 'success',
      });
    } catch (err) {
      toast({
        title: 'Import Failed',
        description:
          err instanceof Error
            ? err.message
            : 'Could not parse the pasted command.',
        type: 'error',
      });
    }
  };

  const handleSaveActiveRequest = () => {
    if (!activeRequest) return;

    const targetCol = selectedColId || collections[0]?.id || '';
    if (activeTabId.startsWith('r-new-') && !targetCol) {
      toast({
        title: 'Cannot Save',
        description: 'Create a collection in the sidebar first.',
        type: 'error',
      });
      return;
    }

    saveDraft(activeTabId, targetCol);
    toast({
      title: 'Changes Saved',
      description: `Saved request "${activeRequest.name}" successfully.`,
      type: 'success',
    });
  };

  const handleRunRequest = async () => {
    if (!activeRequest) return;

    // Get current active environment variables from the freshest state to avoid stale closures
    const envStore = useEnvironmentStore.getState();
    const activeEnv = envStore.environments.find(
      (e) => e.id === envStore.activeEnvironmentId,
    );
    const activeVariables = activeEnv ? activeEnv.variables : [];
    const requestTexts = [
      activeRequest.target,
      activeRequest.body || '',
      ...(activeRequest.headers || []).flatMap((h) => [h.key, h.value]),
      ...(activeRequest.queryParams || []).flatMap((qp) => [qp.key, qp.value]),
      ...Object.values(activeRequest.args || {}),
    ];
    const lockedSensitiveNames = getLockedSensitiveVariableNames(
      requestTexts,
      activeVariables,
    );

    if (lockedSensitiveNames.length > 0) {
      setUnlockDialogOpen(true);
      return;
    }

    setIsLoading(true);

    // Reset response status
    updateActiveRequest({
      response: {
        status: 'Pending',
        data: null,
        duration: 0,
        logs: [],
      },
    });

    const start = Date.now();

    // Resolve variables in request fields before execution
    const resolvedTarget = resolveVariables(
      activeRequest.target,
      activeVariables,
    );
    const resolvedBody = resolveVariables(
      activeRequest.body || '',
      activeVariables,
    );
    const resolvedHeaders = (activeRequest.headers || []).map((h) => ({
      key: resolveVariables(h.key, activeVariables),
      value: resolveVariables(h.value, activeVariables),
    }));
    const resolvedQueryParams = (activeRequest.queryParams || []).map((qp) => ({
      key: resolveVariables(qp.key, activeVariables),
      value: resolveVariables(qp.value, activeVariables),
    }));
    const resolvedArgs = Object.fromEntries(
      Object.entries(activeRequest.args || {}).map(([k, v]) => [
        k,
        resolveVariables(v, activeVariables),
      ]),
    );
    const resolvedRequest = {
      ...activeRequest,
      target: resolvedTarget.value,
      body: resolvedBody.value,
      headers: resolvedHeaders.map((h) => ({
        key: h.key.value,
        value: h.value.value,
      })),
      queryParams: resolvedQueryParams.map((qp) => ({
        key: qp.key.value,
        value: qp.value.value,
      })),
      args: Object.fromEntries(
        Object.entries(resolvedArgs).map(([key, value]) => [key, value.value]),
      ),
    };
    const redactedRequest = {
      ...activeRequest,
      target: resolvedTarget.redacted,
      body: resolvedBody.redacted,
      headers: resolvedHeaders.map((h) => ({
        key: h.key.redacted,
        value: h.value.redacted,
      })),
      queryParams: resolvedQueryParams.map((qp) => ({
        key: qp.key.redacted,
        value: qp.value.redacted,
      })),
      args: Object.fromEntries(
        Object.entries(resolvedArgs).map(([key, value]) => [
          key,
          value.redacted,
        ]),
      ),
    };

    try {
      if (lockedSensitiveNames.length > 0) {
        throw new Error(
          `Unlock sensitive variables before sending this request: ${lockedSensitiveNames.join(', ')}.`,
        );
      }

      if (resolvedRequest.type === 'SEND') {
        if (!/^0x[a-fA-F0-9]{40}$/.test(resolvedRequest.target)) {
          throw new Error('A valid recipient address is required.');
        }
        if (!isConnected) {
          openConnectModal?.();
          throw new Error('Wallet not connected. Please connect your wallet.');
        }
        await ensureSelectedWalletNetwork();

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
            throw new Error(
              'Wallet not connected. Please connect your wallet.',
            );
          }
          await ensureSelectedWalletNetwork();

          addLog(
            activeTabId,
            'Requesting transaction signature from wallet...',
          );
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
      } else {
        // REST CALL
        if (!resolvedRequest.target) {
          throw new Error('URL / Endpoint is required.');
        }

        addLog(
          activeTabId,
          `Sending HTTP ${resolvedRequest.type} request to: ${redactedRequest.target}`,
        );

        const { statusText, data, proxied } = await executeRestCall(
          resolvedRequest.type,
          resolvedRequest.target,
          resolvedRequest.headers || [],
          resolvedRequest.queryParams || [],
          resolvedRequest.body || '',
        );

        const duration = Date.now() - start;
        const redactedData = redactSensitiveData(data, activeVariables);
        if (proxied) {
          addLog(
            activeTabId,
            'Direct browser request was blocked. Retried through Call3 proxy.',
          );
        }
        addLog(activeTabId, `HTTP status received: ${statusText}`);

        updateActiveRequest({
          response: {
            status: statusText,
            data: redactedData,
            duration,
            logs: [
              `[${new Date().toLocaleTimeString()}] Response received.`,
              `[${new Date().toLocaleTimeString()}] Status: ${statusText}`,
              `[${new Date().toLocaleTimeString()}] Duration: ${duration}ms`,
            ],
          },
        });
      }
    } catch (err: unknown) {
      const duration = Date.now() - start;
      let errorMsg = getWalletErrorMessage(err);
      const originalErrorMsg =
        err instanceof Error && err.message ? err.message : errorMsg;
      if (
        err instanceof Error &&
        err.message &&
        err.message.includes('Failed to fetch')
      ) {
        errorMsg =
          'Failed to fetch (CORS block or host unreachable). Ensure URL is correct.';
      }
      const redactedErrorMsg = redactSensitiveValues(errorMsg, activeVariables);
      const redactedLogErrorMsg = redactSensitiveValues(
        isRestMethod(resolvedRequest.type) ? originalErrorMsg : errorMsg,
        activeVariables,
      );

      addLog(activeTabId, `Error occurred: ${redactedLogErrorMsg}`);
      updateActiveRequest({
        response: {
          status: 'Error',
          data: { error: redactedErrorMsg },
          duration,
          logs: [
            `[${new Date().toLocaleTimeString()}] Execution failed: ${redactedLogErrorMsg}`,
          ],
        },
      });
      toast({
        title: 'Execution Failed',
        description: redactedErrorMsg,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    selectedColId,
    unlockDialogOpen,
    setUnlockDialogOpen,
    setSelectedColId,
    handleTargetPaste,
    handleSaveActiveRequest,
    handleRunRequest,
  };
};
