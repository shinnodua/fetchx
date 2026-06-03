import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { useToast } from '../../components';
import {
  executeReadCall,
  executeRestCall,
  executeWriteCall,
} from '../../services/requestExecutor';
import {
  getRequestIsDirty,
  useWorkspaceStore,
} from '../../store/useWorkspaceStore';
import { ActiveRequestWorkspace } from './components/ActiveRequestWorkspace';
import { CollectionsPanel } from './components/CollectionsPanel';
import { TabsHeader } from './components/TabsHeader';
import { WorkspaceDialogs } from './components/WorkspaceDialogs';
import { WorkspaceEmptyState } from './components/WorkspaceEmptyState';
import type { AbiItem, RequestItem } from './types';
import { createImportedRequestName, parseCurl } from './utils/requestImport';

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
    if (!pastedText.toLowerCase().startsWith('curl')) return;

    event.preventDefault();

    try {
      const parsedCurl = parseCurl(pastedText);
      if (!parsedCurl.target) {
        toast({
          title: 'Import Failed',
          description: 'Could not find a URL in the pasted cURL command.',
          type: 'error',
        });
        return;
      }

      const parsedMethod = parsedCurl.method.toUpperCase();
      const supportedMethod = ['GET', 'POST'].includes(parsedMethod)
        ? parsedMethod
        : parsedCurl.body
          ? 'POST'
          : 'GET';

      updateActiveRequest({
        name: createImportedRequestName(supportedMethod, parsedCurl.target),
        type: supportedMethod,
        target: parsedCurl.target,
        headers: parsedCurl.headers,
        queryParams: parsedCurl.queryParams,
        body: parsedCurl.body,
        abi: '',
        functionName: '',
        args: {},
        response: null,
      });

      toast({
        title: 'cURL Imported',
        description: 'Request URL, method, headers, params, and body updated.',
        type: 'success',
      });
    } catch (err) {
      toast({
        title: 'Import Failed',
        description:
          err instanceof Error
            ? err.message
            : 'Could not parse the pasted cURL command.',
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

    try {
      if (activeRequest.type === 'READ' || activeRequest.type === 'WRITE') {
        if (!activeRequest.target) {
          throw new Error('Contract address is required.');
        }

        let parsedAbi: AbiItem[] = [];
        try {
          parsedAbi = JSON.parse(activeRequest.abi || '[]');
        } catch {
          throw new Error('Invalid ABI format. Make sure it is valid JSON.');
        }

        const selectedFunc = parsedAbi.find(
          (item) =>
            item.type === 'function' &&
            item.name === activeRequest.functionName,
        );

        if (!selectedFunc) {
          throw new Error(
            `Function "${activeRequest.functionName}" not found in ABI.`,
          );
        }

        // Parse function arguments
        const formattedArgs = (selectedFunc.inputs || []).map((input, idx) => {
          const rawVal = activeRequest.args?.[input.name || `arg${idx}`] || '';
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
          `Initiating contract call: ${selectedFunc.name}(${formattedArgs.join(', ')})`,
        );
        addLog(activeTabId, `Target Contract: ${activeRequest.target}`);
        addLog(activeTabId, `Network ID: ${activeRequest.network}`);

        if (activeRequest.type === 'READ') {
          addLog(activeTabId, 'Querying contract state...');
          const result = await executeReadCall(
            activeRequest.target,
            parsedAbi,
            activeRequest.functionName || '',
            formattedArgs,
            publicClient,
          );

          const duration = Date.now() - start;
          addLog(activeTabId, `State call succeeded in ${duration}ms.`);

          // Serialize output safely (BigInt to string)
          const serializedData =
            typeof result === 'bigint' ? result.toString() : result;

          updateActiveRequest({
            response: {
              status: 'Success',
              data: serializedData,
              duration,
              logs: [
                `[${new Date().toLocaleTimeString()}] Query succeeded.`,
                `[${new Date().toLocaleTimeString()}] Result: ${JSON.stringify(serializedData)}`,
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
            activeRequest.target,
            parsedAbi,
            activeRequest.functionName || '',
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
        if (!activeRequest.target) {
          throw new Error('URL / Endpoint is required.');
        }

        addLog(
          activeTabId,
          `Sending HTTP ${activeRequest.type} request to: ${activeRequest.target}`,
        );

        const { statusText, data } = await executeRestCall(
          activeRequest.type,
          activeRequest.target,
          activeRequest.headers,
          activeRequest.queryParams,
          activeRequest.body,
        );

        const duration = Date.now() - start;
        addLog(activeTabId, `HTTP status received: ${statusText}`);

        updateActiveRequest({
          response: {
            status: statusText,
            data,
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

      addLog(activeTabId, `Error occurred: ${errorMsg}`);
      updateActiveRequest({
        response: {
          status: 'Error',
          data: { error: errorMsg },
          duration,
          logs: [
            `[${new Date().toLocaleTimeString()}] Execution failed: ${errorMsg}`,
          ],
        },
      });
      toast({
        title: 'Execution Failed',
        description: errorMsg,
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
    </div>
  );
};
