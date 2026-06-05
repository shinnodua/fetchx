import { DEFAULT_RPC_OPTIONS } from '../constants';
import type { CustomRpc, RequestItem, RpcOption } from '../types';

export function getRpcOptions(customRpcs: CustomRpc[]): RpcOption[] {
  return [
    ...DEFAULT_RPC_OPTIONS,
    ...customRpcs.map((rpc) => ({
      id: rpc.id,
      name: rpc.name,
      chainId: rpc.chainId,
      url: rpc.url,
      explorerUrl: rpc.explorerUrl,
      isDefault: false,
    })),
  ];
}

export function getSelectedRpcId(
  request: Pick<RequestItem, 'customRpcId' | 'network'>,
  customRpcs: CustomRpc[],
) {
  if (
    request.customRpcId &&
    customRpcs.some((rpc) => rpc.id === request.customRpcId)
  ) {
    return request.customRpcId;
  }

  return `default-${request.network || '1'}`;
}

export function getRpcSelectOptions(customRpcs: CustomRpc[]) {
  return getRpcOptions(customRpcs).map((rpc) => ({
    value: rpc.id,
    label: rpc.isDefault ? rpc.name : `${rpc.name} (${rpc.chainId})`,
  }));
}

export function findRpcOption(id: string | undefined, customRpcs: CustomRpc[]) {
  return getRpcOptions(customRpcs).find((rpc) => rpc.id === id);
}

export function validateRpcUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateChainId(value: string) {
  return /^\d+$/.test(value.trim()) && Number(value.trim()) > 0;
}
