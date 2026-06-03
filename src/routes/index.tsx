import { createFileRoute } from '@tanstack/react-router';
import { ToastProvider } from '../components';
import { WorkspacePage } from '../features/workspace/WorkspacePage';

export const Route = createFileRoute('/')({
  component: () => (
    <ToastProvider>
      <WorkspacePage />
    </ToastProvider>
  ),
});
