import type React from 'react';
import { useState } from 'react';
import { TrashIcon } from '../../../../assets/svgs';
import { Button, Dialog, Input } from '../../../../components';
import { useRpcStore } from '../../../../store';
import { DEFAULT_RPC_OPTIONS } from '../../constants';
import type { CustomRpc } from '../../types';
import { validateChainId, validateRpcUrl } from '../../utils/rpcOptions';

export const ManageRpcsDialog: React.FC = () => {
  const {
    customRpcs,
    manageRpcOpen,
    setManageRpcOpen,
    addCustomRpc,
    deleteCustomRpc,
  } = useRpcStore();
  const [name, setName] = useState('');
  const [chainId, setChainId] = useState('');
  const [url, setUrl] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('');
  const [error, setError] = useState('');
  const [rpcToDelete, setRpcToDelete] = useState<CustomRpc | null>(null);

  const resetForm = () => {
    setName('');
    setChainId('');
    setUrl('');
    setExplorerUrl('');
    setError('');
  };

  const closeDialog = () => {
    setManageRpcOpen(false);
    resetForm();
  };

  const handleAddRpc = () => {
    const trimmedName = name.trim();
    const trimmedChainId = chainId.trim();
    const trimmedUrl = url.trim();
    const trimmedExplorerUrl = explorerUrl.trim();

    if (!trimmedName) {
      setError('RPC name is required.');
      return;
    }
    if (!validateChainId(trimmedChainId)) {
      setError('Chain ID must be a positive number.');
      return;
    }
    if (!validateRpcUrl(trimmedUrl)) {
      setError('RPC URL must start with http:// or https://.');
      return;
    }
    if (trimmedExplorerUrl && !validateRpcUrl(trimmedExplorerUrl)) {
      setError('Explorer URL must start with http:// or https://.');
      return;
    }

    addCustomRpc({
      name: trimmedName,
      chainId: trimmedChainId,
      url: trimmedUrl,
      explorerUrl: trimmedExplorerUrl || undefined,
    });
    resetForm();
  };

  return (
    <>
      <Dialog
        isOpen={manageRpcOpen}
        onClose={closeDialog}
        title="Manage RPCs"
        description="Add custom RPC endpoints for contract reads. Default RPCs are built in and cannot be deleted."
        className="flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col overflow-hidden sm:h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]"
      >
        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto pr-1 lg:grid-cols-[minmax(20rem,28rem)_1fr]">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_7rem] lg:grid-cols-1 xl:grid-cols-[1fr_7rem]">
              <Input
                label="Name"
                placeholder="Alchemy Mainnet"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError('');
                }}
              />
              <Input
                inputMode="numeric"
                label="Chain ID"
                placeholder="1"
                value={chainId}
                onChange={(event) => {
                  setChainId(event.target.value);
                  setError('');
                }}
              />
            </div>
            <Input
              label="RPC URL"
              placeholder="https://..."
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setError('');
              }}
            />
            <Input
              label="Explorer URL (Optional)"
              placeholder="https://etherscan.io"
              value={explorerUrl}
              onChange={(event) => {
                setExplorerUrl(event.target.value);
                setError('');
              }}
            />
            {error && (
              <span className="ml-1 block text-xs font-medium text-primary-600">
                {error}
              </span>
            )}
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleAddRpc}
            >
              Add RPC
            </Button>
          </div>

          <div className="grid min-h-0 gap-5 xl:grid-cols-2">
            <div className="flex min-h-0 flex-col gap-2">
              <span className="ml-1 block text-xs font-semibold text-foreground/70">
                Default RPCs
              </span>
              <div className="grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:max-h-none xl:max-h-full xl:grid-cols-1 2xl:grid-cols-2">
                {DEFAULT_RPC_OPTIONS.map((rpc) => (
                  <div
                    key={rpc.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-background/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {rpc.name}
                      </p>
                      <p className="text-xs text-foreground/50">
                        Chain ID {rpc.chainId}
                      </p>
                      {rpc.explorerUrl && (
                        <p className="truncate text-xs text-foreground/40">
                          Explorer {rpc.explorerUrl}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-medium text-foreground/40">
                      Protected
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-2">
              <span className="ml-1 block text-xs font-semibold text-foreground/70">
                Custom RPCs
              </span>
              {customRpcs.length === 0 ? (
                <p className="rounded-xl border border-foreground/10 bg-background/30 px-3 py-3 text-xs text-foreground/50">
                  No custom RPCs added.
                </p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1 lg:max-h-none xl:max-h-full">
                  {customRpcs.map((rpc) => (
                    <div
                      key={rpc.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-background/40 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {rpc.name}
                        </p>
                        <p className="truncate text-xs text-foreground/50">
                          Chain ID {rpc.chainId} - {rpc.url}
                        </p>
                        {rpc.explorerUrl && (
                          <p className="truncate text-xs text-foreground/40">
                            Explorer {rpc.explorerUrl}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 shrink-0 rounded-lg p-0 text-primary-500/70 hover:text-primary-500"
                        title="Delete custom RPC"
                        onClick={() => setRpcToDelete(rpc)}
                      >
                        <TrashIcon
                          title="Delete custom RPC"
                          className="h-4 w-4 shrink-0"
                        />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={!!rpcToDelete}
        onClose={() => setRpcToDelete(null)}
        title="Delete Custom RPC?"
        description={
          rpcToDelete
            ? `Delete "${rpcToDelete.name}" from your custom RPC list. Requests using it will fall back to the default chain RPC.`
            : ''
        }
      >
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => setRpcToDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (rpcToDelete) {
                deleteCustomRpc(rpcToDelete.id);
                setRpcToDelete(null);
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </>
  );
};
