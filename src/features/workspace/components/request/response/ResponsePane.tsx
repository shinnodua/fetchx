import type React from 'react';
import { useMemo, useState } from 'react';
import { CopyIcon } from '../../../../../assets/svgs';
import {
  Badge,
  Button,
  Dialog,
  Skeleton,
  useToast,
} from '../../../../../components';
import { useRpcStore, useWorkspaceStore } from '../../../../../store';
import { copyResponse } from '../../../utils/requestExport';
import { findRpcOption, getSelectedRpcId } from '../../../utils/rpcOptions';
import { ResponsePayloadViewer } from './ResponsePayloadViewer';

export const consoleLogsButtonClassName =
  'h-7 rounded-lg px-2 text-[10px] font-semibold uppercase tracking-wider text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200';

export const consoleLogsDialogContentClassName =
  'min-h-0 flex-1 overflow-auto rounded-lg border border-foreground/10 bg-black/5 p-3 font-mono text-[11px] leading-4 text-foreground/70 dark:bg-black/40';

export const responsePaneContentClassName =
  'flex-1 min-h-0 overflow-hidden p-3';

export const ResponsePane: React.FC = () => {
  const { toast } = useToast();
  const { collections, activeTabId, drafts, saveActiveResponse } =
    useWorkspaceStore();
  const customRpcs = useRpcStore((state) => state.customRpcs);
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);

  // Find active request
  const activeRequest = useMemo(() => {
    if (drafts[activeTabId]) return drafts[activeTabId];

    for (const col of collections) {
      const req = col.requests.find((r) => r.id === activeTabId);
      if (req) return req;
    }
    return null;
  }, [collections, activeTabId, drafts]);

  if (!activeRequest) return null;

  const hasResponsePayload =
    activeRequest.response?.data !== undefined &&
    activeRequest.response.data !== null;
  const responseLogs = activeRequest.response?.logs ?? [];
  const selectedRpc = findRpcOption(
    getSelectedRpcId(activeRequest, customRpcs),
    customRpcs,
  );
  const txExplorerUrl =
    activeRequest.response?.txHash && selectedRpc?.explorerUrl
      ? `${selectedRpc.explorerUrl.replace(/\/$/, '')}/tx/${activeRequest.response.txHash}`
      : undefined;

  const handleCopyResponse = async () => {
    const responseText = copyResponse(activeRequest);

    if (!responseText) {
      toast({
        title: 'Copy Failed',
        description: 'No response data available to copy.',
        type: 'warning',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(responseText);
      toast({
        title: 'Copied to Clipboard',
        description: 'Response payload copied successfully.',
        type: 'success',
      });
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy response payload to clipboard.',
        type: 'error',
      });
    }
  };

  const handleSaveResponse = (name: string) => {
    const didSave = saveActiveResponse(name);

    toast({
      title: didSave ? 'Response Saved' : 'Save Failed',
      description: didSave
        ? 'Saved response added under this request.'
        : 'Run the request and make sure it has response payload data first.',
      type: didSave ? 'success' : 'warning',
    });

    return didSave;
  };

  return (
    <div className="w-full lg:w-1/2 flex-1 flex flex-col min-h-0 overflow-hidden border border-foreground/10 rounded-2xl bg-white/5 dark:bg-black/5">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-foreground/10 bg-background/80 px-3 py-1 backdrop-blur">
        <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">
          Response & Logs
        </h3>
        {activeRequest.response && (
          <div className="flex shrink-0 items-center gap-2">
            <Badge
              variant={
                activeRequest.response.status === 'Success' ||
                activeRequest.response.status === 'Confirmed' ||
                (activeRequest.response.status || '').startsWith('2')
                  ? 'secondary'
                  : 'primary'
              }
            >
              {activeRequest.response.status}
            </Badge>
            <Badge variant="outline">
              {activeRequest.response.duration} ms
            </Badge>
            {responseLogs.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsLogsDialogOpen(true)}
                className={consoleLogsButtonClassName}
              >
                Logs ({responseLogs.length})
              </Button>
            )}
            {hasResponsePayload && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyResponse}
                className="h-7 w-7 rounded-lg p-0 text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200 cursor-pointer"
                title="Copy response payload"
              >
                <CopyIcon
                  title="Copy response payload"
                  className="block h-6 w-6 shrink-0"
                  strokeWidth={1.5}
                />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className={responsePaneContentClassName}>
        {!activeRequest.response ? (
          <div className="flex min-h-full flex-col items-center justify-center p-8 text-center text-foreground/40 italic text-xs">
            Configure path parameters and press "Send" to trigger call.
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col gap-3">
            {/* Transaction Receipt Link if WRITE Call */}
            {activeRequest.response.txHash && (
              <div className="p-3 bg-primary-500/5 border border-primary-500/10 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wider block">
                  Transaction Sent
                </span>
                {txExplorerUrl ? (
                  <a
                    href={txExplorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-primary-600 dark:text-primary-400 hover:underline break-all"
                  >
                    {activeRequest.response.txHash}
                  </a>
                ) : (
                  <span className="text-xs font-mono text-primary-600 dark:text-primary-400 break-all">
                    {activeRequest.response.txHash}
                  </span>
                )}
              </div>
            )}

            {/* Response Body Code Preview */}
            {activeRequest.response.status === 'Pending' ? (
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider block">
                  Payload Output
                </span>
                <div className="space-y-2 rounded-xl border border-foreground/10 bg-foreground/5 p-3 animate-pulse">
                  <Skeleton className="h-3 w-[80%] rounded-md bg-foreground/10" />
                  <Skeleton className="h-3 w-[60%] rounded-md bg-foreground/10" />
                  <Skeleton className="h-3 w-[70%] rounded-md bg-foreground/10" />
                </div>
              </div>
            ) : (
              activeRequest.response.data !== undefined &&
              activeRequest.response.data !== null && (
                <ResponsePayloadViewer
                  data={activeRequest.response.data}
                  onSave={handleSaveResponse}
                  explorerUrl={txExplorerUrl}
                />
              )
            )}
          </div>
        )}
      </div>

      <Dialog
        isOpen={isLogsDialogOpen}
        onClose={() => setIsLogsDialogOpen(false)}
        title="Console Logs"
        description={`${responseLogs.length} log ${responseLogs.length === 1 ? 'entry' : 'entries'}`}
        className="flex h-[min(32rem,calc(100vh-2rem))] max-w-3xl flex-col"
      >
        <div className={consoleLogsDialogContentClassName}>
          {responseLogs.map((log, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: logs are append-only static log entries
            <div key={index}>{log}</div>
          ))}
        </div>
      </Dialog>
    </div>
  );
};
