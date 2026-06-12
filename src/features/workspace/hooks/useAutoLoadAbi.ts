import { useEffect, useRef } from 'react';
import { useToast } from '../../../components';
import { fetchContractInfo } from '../../../services/api';
import { useEnvironmentStore, useWorkspaceStore } from '../../../store';
import type { RequestItem } from '../types';
import { resolveVariables } from '../utils/environment';

export const useAutoLoadAbi = (
  activeRequest: RequestItem | null,
  activeTabId: string,
) => {
  const { toast } = useToast();
  const updateActiveRequest = useWorkspaceStore(
    (state) => state.updateActiveRequest,
  );
  const setAbiLoading = useWorkspaceStore((state) => state.setAbiLoading);
  const activeEnvironmentId = useEnvironmentStore(
    (state) => state.activeEnvironmentId,
  );

  const lastFetchedRef = useRef<Record<string, string>>({});

  const activeRequestTarget = activeRequest?.target;
  const activeRequestNetwork = activeRequest?.network;
  const activeRequestType = activeRequest?.type;
  const activeRequestName = activeRequest?.name;

  useEffect(() => {
    if (
      !activeRequestTarget ||
      (activeRequestType !== 'READ' && activeRequestType !== 'WRITE')
    ) {
      return;
    }

    const network = activeRequestNetwork || '1';

    // Get current active variables
    const envStore = useEnvironmentStore.getState();
    const activeEnv = envStore.environments.find(
      (e) => e.id === activeEnvironmentId,
    );
    const activeVariables = activeEnv ? activeEnv.variables : [];

    // Resolve target in case it contains environment variables
    const resolvedTarget = resolveVariables(
      activeRequestTarget,
      activeVariables,
    ).value.trim();

    // Check if resolved target is a valid hex address
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(resolvedTarget);
    if (!isValidAddress) {
      return;
    }

    const fetchKey = `${activeTabId}-${resolvedTarget}-${network}`;
    if (lastFetchedRef.current[activeTabId] === fetchKey) {
      return;
    }

    // Mark as fetched/attempted
    lastFetchedRef.current[activeTabId] = fetchKey;

    // Fetch the contract info
    const loadAbi = async () => {
      setAbiLoading(true);
      try {
        const info = await fetchContractInfo(resolvedTarget, network);
        if (info.abi) {
          updateActiveRequest({
            abi: info.abi,
            name:
              activeRequestName === 'Untitled Request'
                ? info.name
                : activeRequestName,
            contractName: info.name,
          });
          toast({
            title: 'ABI Auto-Loaded',
            description: `Successfully loaded ABI for "${info.name}".`,
            type: 'success',
          });
        } else {
          toast({
            title: 'ABI Not Found',
            description:
              'Contract is not verified on this network. You can paste the ABI manually.',
            type: 'warning',
          });
        }
      } catch (err) {
        console.warn('Failed to auto-load ABI:', err);
      } finally {
        setAbiLoading(false);
      }
    };

    void loadAbi();
  }, [
    activeTabId,
    activeRequestTarget,
    activeRequestNetwork,
    activeRequestType,
    activeRequestName,
    activeEnvironmentId,
    updateActiveRequest,
    setAbiLoading,
    toast,
  ]);
};
