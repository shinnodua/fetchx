import { createFileRoute } from '@tanstack/react-router';
import { ToastProvider } from '../components';
import { DesignSystemPage } from '../features/design-system/DesignSystemPage';

export const Route = createFileRoute('/design-system')({
  component: () => (
    <ToastProvider>
      <DesignSystemPage />
    </ToastProvider>
  ),
});
