import type React from 'react';
import { useMemo } from 'react';
import { useWorkspaceStore } from '../../../../../store';
import { isRestMethod } from '../../../constants';
import { ContractRequestSettings } from './ContractRequestSettings';
import { RestRequestSettings } from './RestRequestSettings';

interface RequestSettingsProps {
  onSimulateRequest?: () => void;
  isLoading?: boolean;
}

export const RequestSettings: React.FC<RequestSettingsProps> = ({
  onSimulateRequest,
  isLoading,
}) => {
  const { collections, activeTabId, drafts } = useWorkspaceStore();

  // Find active request
  const activeRequest = useMemo(() => {
    if (drafts[activeTabId]) return drafts[activeTabId];

    for (const col of collections) {
      const req = col.requests.find((r) => r.id === activeTabId);
      if (req) return req;
    }
    return null;
  }, [collections, activeTabId, drafts]);

  if (!activeRequest) return null;

  const isRestRequest = isRestMethod(activeRequest.type);

  return (
    <div className="w-full lg:w-1/2 flex-1 flex flex-col min-h-0 overflow-hidden border border-foreground/10 rounded-2xl bg-white/5 dark:bg-black/5">
      {isRestRequest ? (
        <RestRequestSettings activeRequest={activeRequest} />
      ) : (
        <ContractRequestSettings
          activeRequest={activeRequest}
          onSimulateRequest={onSimulateRequest}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
