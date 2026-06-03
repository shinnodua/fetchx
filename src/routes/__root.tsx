import { ConnectButton } from '@rainbow-me/rainbowkit';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Button } from '../components';
import { useStore } from '../store';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { theme, toggleTheme } = useStore();

  if (typeof window !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground">
      <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-default-200 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-6">
          <p className="font-bold text-inherit text-primary-500">Call3.dev</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </Button>
          <ConnectButton />
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}
