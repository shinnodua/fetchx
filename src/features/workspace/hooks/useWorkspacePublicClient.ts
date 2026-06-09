import { useMemo } from 'react';
import { createPublicClient, http } from 'viem';
import { usePublicClient } from 'wagmi';
import { useRpcStore } from '../../../store';
import type { RequestItem } from '../types';

export const useWorkspacePublicClient = (activeRequest: RequestItem | null) => {
  const customRpcs = useRpcStore((state) => state.customRpcs);

  const activeNetworkId = activeRequest?.network
    ? Number(activeRequest.network)
    : undefined;

  const defaultPublicClient = usePublicClient({ chainId: activeNetworkId });

  const activeCustomRpc = activeRequest?.customRpcId
    ? customRpcs.find((rpc) => rpc.id === activeRequest.customRpcId)
    : undefined;

  const customPublicClient = useMemo(() => {
    if (!activeCustomRpc?.url) return undefined;

    return createPublicClient({
      transport: http(activeCustomRpc.url),
    });
  }, [activeCustomRpc?.url]);

  return customPublicClient ?? defaultPublicClient;
};
