import { useConnectModal } from '@rainbow-me/rainbowkit';
import type React from 'react';
import { useAccount } from 'wagmi';
import { Button, Input, Select } from '../../../../components';
import { useRpcStore } from '../../../../store';
import { cn } from '../../../../utils/cn';
import { METHOD_OPTIONS } from '../../constants';
import type { CollectionItem, RequestItem } from '../../types';
import { getSelectedRpcId } from '../../utils/rpcOptions';
import { EnvironmentAwareInput } from '../environment/EnvironmentAwareField';
import { ResponsePane } from './response/ResponsePane';
import { RequestSettings } from './settings/RequestSettings';
import { RpcSelectField } from './settings/RpcSelectField';

interface ActiveRequestWorkspaceProps {
  activeRequest: RequestItem;
  activeTabId: string;
  activeTabIsDirty: boolean;
  collections: CollectionItem[];
  isLoading: boolean;
  selectedColId: string;
  onCreateCollection: () => void;
  onRunRequest: () => void;
  onSimulateRequest?: () => void;
  onSave: () => void;
  onSelectedCollectionChange: (collectionId: string) => void;
  onTargetPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  onUpdateActiveRequest: (fields: Partial<RequestItem>) => void;
}

export const ActiveRequestWorkspace: React.FC<ActiveRequestWorkspaceProps> = ({
  activeRequest,
  activeTabId,
  activeTabIsDirty,
  collections,
  isLoading,
  selectedColId,
  onCreateCollection,
  onRunRequest,
  onSimulateRequest,
  onSave,
  onSelectedCollectionChange,
  onTargetPaste,
  onUpdateActiveRequest,
}) => {
  const customRpcs = useRpcStore((state) => state.customRpcs);
  const selectedRpcId = getSelectedRpcId(activeRequest, customRpcs);
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  return (
    <div className="flex-grow flex flex-col min-h-0 min-w-0 p-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-foreground/5 pb-4">
        <div className="min-w-0 flex-grow w-full max-w-lg">
          <Input
            value={activeRequest.name}
            onChange={(event) =>
              onUpdateActiveRequest({ name: event.target.value })
            }
            className="h-auto text-xl font-bold bg-transparent border-transparent hover:border-foreground/10 focus-visible:border-primary-500 rounded-lg px-2 py-0.5 -ml-2 shadow-none"
            placeholder="Request Name"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
          {activeTabId.startsWith('r-new-') && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/50 font-medium shrink-0">
                Collection:
              </span>
              <div className="w-48 shrink-0">
                <Select
                  options={collections.map((collection) => ({
                    label: collection.name,
                    value: collection.id,
                  }))}
                  value={selectedColId || collections[0]?.id || ''}
                  onChange={onSelectedCollectionChange}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-2.5 rounded-xl text-xs shrink-0 flex items-center justify-center cursor-pointer border-foreground/10 hover:border-foreground/20"
                onClick={onCreateCollection}
                title="Create New Collection"
              >
                + New
              </Button>
            </div>
          )}

          <Button
            variant={activeTabIsDirty ? 'primary' : 'ghost'}
            size="sm"
            className={cn(
              'cursor-pointer h-10 px-4 rounded-xl font-semibold transition-all border border-transparent',
              activeTabIsDirty
                ? 'shadow-md shadow-primary-500/10'
                : 'opacity-50 pointer-events-none border-foreground/10',
            )}
            onClick={onSave}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="w-full sm:w-44">
          <Select
            options={METHOD_OPTIONS}
            dropdownClassName="max-h-none overflow-visible"
            value={activeRequest.type}
            onChange={(value) =>
              onUpdateActiveRequest({
                type: value,
              })
            }
          />
        </div>

        <div className="flex-grow">
          <EnvironmentAwareInput
            placeholder={
              activeRequest.type === 'READ' || activeRequest.type === 'WRITE'
                ? 'Contract Address (0x...)'
                : activeRequest.type === 'SEND'
                  ? 'Recipient Address (0x...)'
                  : 'URL Endpoint (https://...)'
            }
            value={activeRequest.target}
            onChange={(event) =>
              onUpdateActiveRequest({ target: event.target.value })
            }
            onPaste={onTargetPaste}
          />
        </div>

        {(activeRequest.type === 'READ' ||
          activeRequest.type === 'WRITE' ||
          activeRequest.type === 'SEND') && (
          <div className="w-full sm:w-56">
            <RpcSelectField
              value={selectedRpcId}
              onChange={onUpdateActiveRequest}
            />
          </div>
        )}

        {activeRequest.type === 'WRITE' && (
          <Button
            variant="secondary"
            className="h-12 px-6 cursor-pointer border border-foreground/10 hover:border-foreground/20"
            onClick={onSimulateRequest}
            isLoading={isLoading}
          >
            Simulate
          </Button>
        )}

        <Button
          variant={
            activeRequest.type === 'WRITE' || activeRequest.type === 'SEND'
              ? 'primary'
              : 'secondary'
          }
          className="h-12 px-8 cursor-pointer"
          onClick={
            (activeRequest.type === 'WRITE' || activeRequest.type === 'SEND') &&
            !isConnected
              ? () => openConnectModal?.()
              : onRunRequest
          }
          isLoading={isLoading}
        >
          {(activeRequest.type === 'WRITE' || activeRequest.type === 'SEND') &&
          !isConnected
            ? 'Connect Wallet'
            : 'Send'}
        </Button>
      </div>

      <div className="flex-grow flex flex-col lg:flex-row min-h-0 gap-6">
        <RequestSettings />
        <ResponsePane />
      </div>
    </div>
  );
};
