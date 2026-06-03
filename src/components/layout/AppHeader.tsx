import { ConnectButton } from '@rainbow-me/rainbowkit';
import type React from 'react';
import { Button } from '../ui/Button';

interface AppHeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  theme,
  onToggleTheme,
}) => (
  <header className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-foreground/10 bg-background/80 backdrop-blur-md z-50">
    <div className="flex items-center gap-6">
      <p className="text-sm font-bold text-inherit text-primary-500">
        Call3.dev
      </p>
    </div>
    <div className="flex items-center gap-2">
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
