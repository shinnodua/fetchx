import { Button } from '@heroui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 border-b border-default-200 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <p className="font-bold text-inherit text-primary-500">FLAMINGO</p>
          <nav className="hidden sm:flex gap-4">
            <Link
              to="/"
              className="[&.active]:font-bold text-sm text-default-600 hover:text-foreground"
            >
              Home
            </Link>
            <Link
              to="/design-system"
              className="[&.active]:font-bold text-sm text-default-600 hover:text-foreground"
            >
              Design System
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onPress={toggleTheme}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </Button>
          <ConnectButton />
        </div>
      </header>

      <main className="flex-grow p-6">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}
