import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { useToast } from '../../components';
import {
  executeReadCall,
  executeRestCall,
  executeWriteCall,
} from '../../services/requestExecutor';
import { useEnvironmentStore } from '../../store/useEnvironmentStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { ActiveRequestWorkspace } from './components/ActiveRequestWorkspace';
import { CollectionsPanel } from './components/CollectionsPanel';
import { EnvironmentDialog } from './components/EnvironmentDialog';
import { TabsHeader } from './components/TabsHeader';
import { WorkspaceDialogs } from './components/WorkspaceDialogs';
import { WorkspaceEmptyState } from './components/WorkspaceEmptyState';
import type { AbiItem, RequestItem } from './types';
import {
  getLockedSensitiveVariableNames,
  redactSensitiveData,
  redactSensitiveValues,
  resolveVariables,
} from './utils/environment';
import { getRequestIsDirty } from './utils/requestDirty';
import {
  createImportedRequestName,
  parseRequestImportContent,
} from './utils/requestImport';

export const WorkspacePage: React.FC = () => {
  const { isConnected } = useAccount();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();

  const [isLoading, setIsLoading] = useState(false);

  // Store bindings
  const {
    collections,
    tabs,
    activeTabId,
    drafts,
    collectionsPanelCollapsed,
    setNewColOpen,
    addNewTab,
    updateActiveRequest,
    addLog,
    saveDraft,
    initializeDraft,
  } = useWorkspaceStore();

  const { environments, activeEnvironmentId } = useEnvironmentStore();

  const [selectedColId, setSelectedColId] = useState('');

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

  const validTabs = useMemo(() => {
    return tabs.filter((tabId) => {
      if (drafts[tabId]) return true;
      for (const col of collections) {
        if (col.requests.some((r) => r.id === tabId)) return true;
      }
      return false;
    });
  }, [tabs, drafts, collections]);

  // Auto-initialize draft on mount or activeTabId change
  useEffect(() => {
    if (activeTabId && !drafts[activeTabId]) {
      initializeDraft(activeTabId);
    }
  }, [activeTabId, drafts, initializeDraft]);

  // Find active request (prioritize drafts)
  const activeRequest = useMemo(() => {
    if (drafts[activeTabId]) return drafts[activeTabId];

    for (const col of collections) {
      const req = col.requests.find((r) => r.id === activeTabId);
      if (req) return req;
    }
    return null;
  }, [collections, activeTabId, drafts]);

  // Helper to determine if current tab is dirty
  const activeTabIsDirty = useMemo(() => {
    const draft = drafts[activeTabId];
    let original: RequestItem | undefined;
    for (const col of collections) {
      const found = col.requests.find((r) => r.id === activeTabId);
      if (found) {
        original = found;
        break;
      }
    }
    return getRequestIsDirty(draft, original);
  }, [collections, activeTabId, drafts]);

  // Public client lookup based on active request chain ID
  const activeNetworkId = activeRequest?.network
    ? Number(activeRequest.network)
    : undefined;
  const publicClient = usePublicClient({ chainId: activeNetworkId });

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
      const supportedMethod = ['GET', 'POST'].includes(parsedMethod)
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

  // Execute request
  const handleRunRequest = async () => {
    if (!activeRequest) return;
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

    // Get current active environment variables
    const activeEnv = environments.find((e) => e.id === activeEnvironmentId);
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

      if (resolvedRequest.type === 'READ' || resolvedRequest.type === 'WRITE') {
        if (!resolvedRequest.target) {
          throw new Error('Contract address is required.');
        }

        let parsedAbi: AbiItem[] = [];
        try {
          parsedAbi = JSON.parse(resolvedRequest.abi || '[]');
        } catch {
          throw new Error('Invalid ABI format. Make sure it is valid JSON.');
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
        const formattedArgs = (selectedFunc.inputs || []).map((input, idx) => {
          const rawVal =
            resolvedRequest.args?.[input.name || `arg${idx}`] || '';
          if (!rawVal.trim()) {
            throw new Error(
              `Parameter "${input.name || `arg${idx}`}" is required.`,
            );
          }

          if (input.type.includes('[]')) {
            try {
              return JSON.parse(rawVal);
            } catch {
              throw new Error(
                `Parameter "${input.name}" must be a JSON array.`,
              );
            }
          }
          if (input.type.startsWith('uint') || input.type.startsWith('int')) {
            return BigInt(rawVal);
          }
          if (input.type === 'bool') {
            return rawVal.toLowerCase() === 'true';
          }
          return rawVal;
        });

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
            throw new Error(
              'Wallet not connected. Please connect your wallet.',
            );
          }

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
        // REST CALL (GET / POST)
        if (!resolvedRequest.target) {
          throw new Error('URL / Endpoint is required.');
        }

        addLog(
          activeTabId,
          `Sending HTTP ${resolvedRequest.type} request to: ${redactedRequest.target}`,
        );

        const { statusText, data } = await executeRestCall(
          resolvedRequest.type,
          resolvedRequest.target,
          resolvedRequest.headers || [],
          resolvedRequest.queryParams || [],
          resolvedRequest.body || '',
        );

        const duration = Date.now() - start;
        const redactedData = redactSensitiveData(data, activeVariables);
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
      let errorMsg =
        err instanceof Error ? err.message : 'Unknown execution error.';
      if (
        err instanceof Error &&
        err.message &&
        err.message.includes('Failed to fetch')
      ) {
        errorMsg =
          'Failed to fetch (CORS block or host unreachable). Ensure URL is correct.';
      }

      const redactedErrorMsg = redactSensitiveValues(errorMsg, activeVariables);

      addLog(activeTabId, `Error occurred: ${redactedErrorMsg}`);
      updateActiveRequest({
        response: {
          status: 'Error',
          data: { error: redactedErrorMsg },
          duration,
          logs: [
            `[${new Date().toLocaleTimeString()}] Execution failed: ${redactedErrorMsg}`,
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

  return (
    <div className="flex flex-1 w-full min-h-0 h-full overflow-hidden bg-background text-foreground">
      {/* LEFT Sidebar Panel */}
      {!collectionsPanelCollapsed && <CollectionsPanel />}

      {/* RIGHT Workspace Details */}
      <main className="flex-grow flex flex-col min-h-0 min-w-0 bg-background">
        {validTabs.length === 0 ? (
          <WorkspaceEmptyState onNewRequest={addNewTab} />
        ) : (
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <TabsHeader />

            {activeRequest && (
              <ActiveRequestWorkspace
                activeRequest={activeRequest}
                activeTabId={activeTabId}
                activeTabIsDirty={activeTabIsDirty}
                collections={collections}
                isLoading={isLoading}
                selectedColId={selectedColId}
                onCreateCollection={() => setNewColOpen(true)}
                onRunRequest={handleRunRequest}
                onSave={handleSaveActiveRequest}
                onSelectedCollectionChange={setSelectedColId}
                onTargetPaste={handleTargetPaste}
                onUpdateActiveRequest={updateActiveRequest}
              />
            )}
          </div>
        )}
      </main>

      <WorkspaceDialogs />
      <EnvironmentDialog />
    </div>
  );
};
