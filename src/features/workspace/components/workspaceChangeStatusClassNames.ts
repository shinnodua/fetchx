import type { WorkspaceChangeStatus } from '../utils/workspaceChangeStatus';

export const workspaceChangeTextClassNames: Record<
  Exclude<WorkspaceChangeStatus, 'unchanged'>,
  string
> = {
  added: 'text-status-added',
  modified: 'text-status-modified',
};

export const workspaceChangeStatusLabels: Record<
  Exclude<WorkspaceChangeStatus, 'unchanged'>,
  string
> = {
  added: 'New since the last GitHub sync',
  modified: 'Modified since the last GitHub sync',
};
