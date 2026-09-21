import { Link } from '@tanstack/react-router';
import type React from 'react';
import { trackEvent } from '../../services/analytics/googleAnalytics';
import { Button } from '../ui/Button';

interface AppHeaderProps {
  actions?: React.ReactNode;
  desktopActions?: React.ReactNode;
  environmentSelector?: React.ReactNode;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const headerActionButtonClassName = 'mb-1 h-8 rounded-lg px-3 text-xs';

export const AppHeader: React.FC<AppHeaderProps> = ({
  actions,
  desktopActions,
  environmentSelector,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="relative z-50 flex shrink-0 flex-wrap items-center justify-between gap-y-1.5 border-b border-foreground/10 bg-background/80 px-3 py-2 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-bold text-inherit text-primary-500 hover:opacity-80 transition-opacity"
        >
          <img
            src="/fetchx-icon-192.png"
            alt=""
            aria-hidden="true"
            className="h-5 w-5 shrink-0"
          />
          FetchX
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
          className={headerActionButtonClassName}
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
      </div>
    </header>
  );
};
