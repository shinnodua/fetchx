import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link } from '@tanstack/react-router';
import type React from 'react';
import { Button } from '../ui/Button';

interface AppHeaderProps {
  actions?: React.ReactNode;
  environmentSelector?: React.ReactNode;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  actions,
  environmentSelector,
  theme,
  onToggleTheme,
}) => (
  <header className="relative shrink-0 flex flex-wrap gap-y-2 items-center justify-between px-4 py-3 md:py-4 border-b border-foreground/10 bg-background/80 backdrop-blur-md z-50">
    <div className="flex items-center gap-3">
      <Link
        to="/"
        className="text-sm font-bold text-inherit text-primary-500 hover:opacity-80 transition-opacity"
      >
        Call3.dev
      </Link>
      {actions}
    </div>
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
      <span className="rounded-md border border-primary-500/20 bg-primary-500/10 px-2.5 py-1 text-[11px] font-semibold text-primary-600 shadow-sm shadow-primary-500/10 dark:text-primary-300">
        Web In Development
      </span>
    </div>
    <div className="flex items-center gap-2">
      {environmentSelector}
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3 rounded-lg text-xs"
        onClick={onToggleTheme}
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
                onClick={openConnectModal}
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
                onClick={openChainModal}
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
                onClick={openChainModal}
              >
                {chain.name}
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="h-8 px-3 rounded-lg text-xs"
                onClick={openAccountModal}
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
