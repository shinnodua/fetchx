import { executeRestCall } from '../../../services/requestExecutor';
import { useWorkspaceStore } from '../../../store';
import type { EnvironmentVariable, RequestItem } from '../types';
import { redactSensitiveData } from '../utils/environment';

export const useRunRestRequest = () => {
  const { updateActiveRequest, addLog } = useWorkspaceStore();

  const runRestRequest = async (
    resolvedRequest: RequestItem,
    redactedRequest: RequestItem,
    activeTabId: string,
    activeVariables: EnvironmentVariable[],
    start: number,
  ) => {
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
      resolvedRequest.bodyType || 'raw',
      resolvedRequest.formData || [],
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
  };

  return { runRestRequest };
};
