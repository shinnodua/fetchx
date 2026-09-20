import { useLocation } from '@tanstack/react-router';
import type React from 'react';
import { useEffect } from 'react';
import { DesktopUpdateManager } from '../../features/desktop/components';
import {
  CollectionTransferButtons,
  EnvironmentSelector,
  WorkspaceSelector,
} from '../../features/workspace/components';
import { useStore } from '../../store';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { theme, toggleTheme } = useStore();
  const location = useLocation();
  const isRootPage = location.pathname === '/';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground">
      <AppHeader
        actions={isRootPage ? <CollectionTransferButtons /> : undefined}
        desktopActions={
          isRootPage ? <WorkspaceSelector /> : <DesktopUpdateManager />
        }
        environmentSelector={isRootPage ? <EnvironmentSelector /> : undefined}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {children}
      </main>
      <AppFooter />
    </div>
  );
};
