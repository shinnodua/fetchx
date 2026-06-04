import type React from 'react';
import { useMemo } from 'react';
import { CopyIcon } from '../../../../assets/svgs';
import { Badge, Button, Skeleton, useToast } from '../../../../components';
import { useWorkspaceStore } from '../../../../store';
import { copyResponse } from '../../utils/requestExport';

export const ResponsePane: React.FC = () => {
  const { toast } = useToast();
  const { collections, activeTabId, drafts } = useWorkspaceStore();

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

  return (
    <div className="w-full lg:w-1/2 flex-1 flex flex-col min-h-0 border border-foreground/10 rounded-2xl bg-white/5 dark:bg-black/5 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">
          Response & Logs
        </h3>
        {activeRequest.response && (
          <div className="flex gap-2">
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

      {!activeRequest.response ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-foreground/40 italic text-xs">
          Configure path parameters and press "Send" to trigger call.
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          {/* Transaction Receipt Link if WRITE Call */}
          {activeRequest.response.txHash && (
            <div className="p-3 bg-primary-500/5 border border-primary-500/10 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wider block">
                Transaction Sent
              </span>
              <a
                href={
                  activeRequest.network === '11155111'
                    ? `https://sepolia.etherscan.io/tx/${activeRequest.response.txHash}`
                    : `https://etherscan.io/tx/${activeRequest.response.txHash}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-primary-600 dark:text-primary-400 hover:underline break-all"
              >
                {activeRequest.response.txHash}
              </a>
            </div>
          )}

          {/* Response Body Code Preview */}
          {activeRequest.response.status === 'Pending' ? (
            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider block">
                Payload Output
              </span>
              <div className="bg-foreground/5 p-4 rounded-xl space-y-2.5 border border-foreground/10 animate-pulse">
                <Skeleton className="h-3 w-[80%] rounded-md bg-foreground/10" />
                <Skeleton className="h-3 w-[60%] rounded-md bg-foreground/10" />
                <Skeleton className="h-3 w-[70%] rounded-md bg-foreground/10" />
              </div>
            </div>
          ) : (
            activeRequest.response.data !== undefined &&
            activeRequest.response.data !== null && (
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider block">
                  Payload Output
                </span>
                <pre className="bg-foreground/5 p-4 rounded-xl overflow-x-auto text-xs font-mono text-foreground/80 max-h-80 border border-foreground/10">
                  <code>
                    {typeof activeRequest.response.data === 'object'
                      ? JSON.stringify(activeRequest.response.data, null, 2)
                      : String(activeRequest.response.data)}
                  </code>
                </pre>
              </div>
            )
          )}

          {/* Debug Execution Logs */}
          {activeRequest.response.logs &&
            activeRequest.response.logs.length > 0 && (
              <div className="space-y-1 flex-1 flex flex-col min-h-[150px]">
                <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider block">
                  Console Logs
                </span>
                <div className="bg-black/5 dark:bg-black/40 border border-foreground/10 text-[11px] font-mono p-3 rounded-xl flex-1 overflow-y-auto space-y-1 min-h-[120px] max-h-48 text-foreground/70">
                  {activeRequest.response.logs.map((log, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: logs are append-only static log entries
                    <div key={idx}>{log}</div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};
