import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { Button, Dialog } from '../../../../../components';
import { trackEvent } from '../../../../../services/analytics/googleAnalytics';
import { NETWORK_OPTIONS } from '../../../constants';
import { getTransactionWalletState } from './transactionWalletState';

interface TransactionWalletControlProps {
  requestNetwork?: string;
}

function getNetworkLabel(network: string | undefined) {
  return NETWORK_OPTIONS.find((option) => option.value === network)?.label;
}

export const TransactionWalletControl = ({
  requestNetwork,
}: TransactionWalletControlProps) => {
  const { chain } = useAccount();
  const previousChainId = useRef(chain?.id);
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const requestedNetworkLabel = getNetworkLabel(requestNetwork);

  useEffect(() => {
    if (
      chain?.id &&
      previousChainId.current !== undefined &&
      chain.id !== previousChainId.current
    ) {
      trackEvent({
        screen: 'workspace',
        action: 'network_switched',
        network: chain.name,
        chainId: chain.id,
      });
    }
    previousChainId.current = chain?.id;
  }, [chain?.id, chain?.name]);

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain: connectedChain,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const walletState = getTransactionWalletState({
          chainId: connectedChain?.id,
          chainUnsupported: Boolean(connectedChain?.unsupported),
          hasAccount: Boolean(account),
          isMounted: mounted,
          requestNetwork,
        });

        if (walletState === 'connect') {
          return (
            <Button
              variant="primary"
              className="h-10 shrink-0 px-6"
              onClick={() => {
                trackEvent({ screen: 'workspace', action: 'connect_wallet' });
                openConnectModal();
              }}
            >
              Connect wallet
            </Button>
          );
        }

        if (
          walletState === 'unsupported-network' ||
          walletState === 'network-mismatch'
        ) {
          const networkLabel =
            walletState === 'unsupported-network'
              ? 'Wrong network'
              : `Switch to ${requestedNetworkLabel ?? 'request network'}`;

          return (
            <Button
              variant="primary"
              className="h-10 shrink-0 px-4"
              onClick={() => {
                trackEvent({
                  screen: 'workspace',
                  action: 'change_network',
                  network: requestNetwork,
                });
                openChainModal();
              }}
            >
              {networkLabel}
            </Button>
          );
        }

        return (
          <>
            <Button
              variant="glass"
              size="sm"
              className="h-10 max-w-40 shrink-0 truncate px-3"
              aria-label={`View wallet details for ${account?.displayName ?? ''}`}
              onClick={() => {
                trackEvent({ screen: 'workspace', action: 'view_account' });
                setIsWalletDialogOpen(true);
              }}
            >
              Wallet · {account?.displayName}
            </Button>

            <Dialog
              isOpen={isWalletDialogOpen}
              onClose={() => setIsWalletDialogOpen(false)}
              title="Connected wallet"
              description="Review your active account and network before sending a transaction."
              className="max-w-md"
            >
              <div className="space-y-4">
                <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-3">
                  <p className="text-xs font-medium text-foreground/60">
                    Account
                  </p>
                  <p className="mt-1 break-all text-sm font-semibold text-foreground">
                    {account?.address}
                  </p>
                  <p className="mt-1 text-xs text-foreground/60">
                    {account?.displayName}
                  </p>
                </div>

                <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-3">
                  <p className="text-xs font-medium text-foreground/60">
                    Network
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {connectedChain?.name}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      trackEvent({
                        screen: 'workspace',
                        action: 'change_network',
                        network: connectedChain?.name,
                        chainId: connectedChain?.id,
                      });
                      setIsWalletDialogOpen(false);
                      openChainModal();
                    }}
                  >
                    Change network
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setIsWalletDialogOpen(false);
                      openAccountModal();
                    }}
                  >
                    Manage wallet
                  </Button>
                </div>
              </div>
            </Dialog>
          </>
        );
      }}
    </ConnectButton.Custom>
  );
};
