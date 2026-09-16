import { useEffect, useRef, useState } from 'react';
import type { PublicClient } from 'viem';
import { useToast } from '../../../components';
import { useEnvironmentStore, useWorkspaceStore } from '../../../store';
import { isRestMethod } from '../constants';
import type { EnvironmentVariable, RequestItem } from '../types';
import {
  getLockedSensitiveVariableNames,
  redactSensitiveValues,
  resolveVariables,
} from '../utils/environment';
import {
  createImportedRequestName,
  createPastedUrlRequestUpdate,
  parseRequestImportContent,
} from '../utils/requestImport';
import { getWalletErrorMessage } from '../utils/walletError';
import { useRunContractRequest } from './useRunContractRequest';
import { useRunRestRequest } from './useRunRestRequest';

export const useRequestRunner = (
  activeRequest: RequestItem | null,
  activeTabId: string,
  publicClient: PublicClient | undefined,
) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColId, setSelectedColId] = useState('');
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);

  const { collections, updateActiveRequest, addLog, saveDraft } =
    useWorkspaceStore();

  const { runRestRequest } = useRunRestRequest();
  const { runContractRequest, simulateContractRequest } =
    useRunContractRequest(publicClient);

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
    const isUrl =
      lowerText.startsWith('http://') || lowerText.startsWith('https://');

    if (!isCurl && !isFetch && !isUrl) return;

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

      if (isUrl) {
        updateActiveRequest(
          createPastedUrlRequestUpdate(
            activeRequest?.type || 'GET',
            pastedText,
          ),
        );
        toast({
          title: 'Request Imported',
          description: 'URL, title, and query parameters updated successfully.',
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

  const prepareResolvedRequest = (
    req: RequestItem,
    activeVariables: EnvironmentVariable[],
  ) => {
    const resolvedTarget = resolveVariables(req.target, activeVariables);
    const resolvedBody = resolveVariables(req.body || '', activeVariables);
    const resolvedHeaders = (req.headers || []).map((h) => ({
      key: resolveVariables(h.key, activeVariables),
      value: resolveVariables(h.value, activeVariables),
    }));
    const resolvedQueryParams = (req.queryParams || []).map((qp) => ({
      key: resolveVariables(qp.key, activeVariables),
      value: resolveVariables(qp.value, activeVariables),
    }));
    const resolvedArgs = Object.fromEntries(
      Object.entries(req.args || {}).map(([k, v]) => [
        k,
        resolveVariables(v, activeVariables),
      ]),
    );

    const resolved = {
      ...req,
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

    const redacted = {
      ...req,
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

    return { resolved, redacted };
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
    const { resolved, redacted } = prepareResolvedRequest(
      activeRequest,
      activeVariables,
    );

    try {
      if (lockedSensitiveNames.length > 0) {
        throw new Error(
          `Unlock sensitive variables before sending this request: ${lockedSensitiveNames.join(', ')}.`,
        );
      }

      if (isRestMethod(resolved.type)) {
        await runRestRequest(
          resolved,
          redacted,
          activeTabId,
          activeVariables,
          start,
        );
      } else {
        await runContractRequest(
          resolved,
          redacted,
          activeTabId,
          activeVariables,
          start,
        );
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
        isRestMethod(resolved.type) ? originalErrorMsg : errorMsg,
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

  const handleSimulateRequest = async () => {
    if (!activeRequest) return;
    if (activeRequest.type !== 'WRITE') return;

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
    const { resolved, redacted } = prepareResolvedRequest(
      activeRequest,
      activeVariables,
    );

    try {
      if (lockedSensitiveNames.length > 0) {
        throw new Error(
          `Unlock sensitive variables before simulating this request: ${lockedSensitiveNames.join(', ')}.`,
        );
      }

      await simulateContractRequest(
        resolved,
        redacted,
        activeTabId,
        activeVariables,
        start,
      );
    } catch (err: unknown) {
      const duration = Date.now() - start;
      const errorMsg = getWalletErrorMessage(err);

      const redactedErrorMsg = redactSensitiveValues(errorMsg, activeVariables);
      const redactedLogErrorMsg = redactSensitiveValues(
        errorMsg,
        activeVariables,
      );

      addLog(
        activeTabId,
        `[Simulation] Error occurred: ${redactedLogErrorMsg}`,
      );
      updateActiveRequest({
        response: {
          status: 'Error',
          data: { error: redactedErrorMsg },
          duration,
          logs: [
            `[${new Date().toLocaleTimeString()}] Simulation failed: ${redactedLogErrorMsg}`,
          ],
        },
      });
      toast({
        title: 'Simulation Failed',
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
    handleSimulateRequest,
  };
};
