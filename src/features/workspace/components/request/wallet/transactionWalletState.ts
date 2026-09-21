export type TransactionWalletState =
  | 'connect'
  | 'connected'
  | 'network-mismatch'
  | 'unsupported-network';

interface TransactionWalletStateInput {
  chainId?: number;
  chainUnsupported: boolean;
  hasAccount: boolean;
  isMounted: boolean;
  requestNetwork?: string;
}

export function getTransactionWalletState({
  chainId,
  chainUnsupported,
  hasAccount,
  isMounted,
  requestNetwork,
}: TransactionWalletStateInput): TransactionWalletState {
  if (!isMounted || !hasAccount) return 'connect';
  if (chainUnsupported) return 'unsupported-network';

  const requestedChainId = Number(requestNetwork);
  if (
    Number.isFinite(requestedChainId) &&
    requestedChainId > 0 &&
    chainId !== requestedChainId
  ) {
    return 'network-mismatch';
  }

  return 'connected';
}
