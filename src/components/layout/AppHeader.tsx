import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link } from '@tanstack/react-router';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { trackEvent } from '../../services/analytics/googleAnalytics';
import { Button } from '../ui/Button';

interface AppHeaderProps {
  actions?: React.ReactNode;
  desktopActions?: React.ReactNode;
  environmentSelector?: React.ReactNode;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  actions,
  desktopActions,
  environmentSelector,
  theme,
  onToggleTheme,
}) => {
  const { chain } = useAccount();
  const previousChainId = useRef(chain?.id);

  useEffect(() => {
    if (
      chain?.id &&
      previousChainId.current !== undefined &&
      chain.id !== previousChainId.current
    ) {
      trackEvent({
        screen: 'global',
        action: 'network_switched',
        network: chain.name,
        chainId: chain.id,
      });
    }
    previousChainId.current = chain?.id;
  }, [chain?.id, chain?.name]);

  return (
    <header className="relative shrink-0 flex flex-wrap gap-y-2 items-center justify-between px-4 py-3 md:py-4 border-b border-foreground/10 bg-background/80 backdrop-blur-md z-50">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-bold text-inherit text-primary-500 hover:opacity-80 transition-opacity"
        >
          <img
            src="/favicon.svg"
            alt=""
            aria-hidden="true"
            className="h-5 w-5 shrink-0"
          />
          Call3.dev
        </Link>
        {actions}
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
        {desktopActions}
      </div>
      <div className="flex items-center gap-2">
        {environmentSelector}
        <Button
          variant="glass"
          size="sm"
          className="h-8 px-3 rounded-lg text-xs"
          onClick={() => {
            const nextTheme = theme === 'dark' ? 'light' : 'dark';
            trackEvent({
              screen: 'global',
              action: 'toggle_theme',
              theme: nextTheme,
            });
            onToggleTheme();
          }}
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </Button>
        <ConnectButton.Custom>
          {({
            account,
            chain,
            mounted,
            openAccountModal,
            openChainModal,
            openConnectModal,
          }) => {
            const connected = mounted && account && chain;

            if (!connected) {
              return (
                <Button
                  variant="primary"
                  size="sm"
                  className="h-8 px-3 rounded-lg text-xs"
                  onClick={() => {
                    trackEvent({ screen: 'global', action: 'connect_wallet' });
                    openConnectModal();
                  }}
                >
                  Connect
                </Button>
              );
            }

            if (chain.unsupported) {
              return (
                <Button
                  variant="primary"
                  size="sm"
                  className="h-8 px-3 rounded-lg text-xs"
                  onClick={() => {
                    trackEvent({ screen: 'global', action: 'change_network' });
                    openChainModal();
                  }}
                >
                  Wrong Network
                </Button>
              );
            }

            return (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 rounded-lg text-xs"
                  onClick={() => {
                    trackEvent({ screen: 'global', action: 'change_network' });
                    openChainModal();
                  }}
                >
                  {chain.name}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="h-8 px-3 rounded-lg text-xs"
                  onClick={() => {
                    trackEvent({ screen: 'global', action: 'view_account' });
                    openAccountModal();
                  }}
                >
                  {account.displayName}
                </Button>
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
};
