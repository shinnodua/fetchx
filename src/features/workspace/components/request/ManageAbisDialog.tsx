import type React from 'react';
import { useState } from 'react';
import { TrashIcon } from '../../../../assets/svgs';
import { Button, Dialog } from '../../../../components';
import { useAbiStore } from '../../../../store';
import type { SavedContractAbi } from '../../types';

const DEFAULT_ABIS = ['ERC20 Preset', 'ERC721 Preset', 'ERC1155 Preset'];

export const ManageAbisDialog: React.FC = () => {
  const { savedAbis, manageAbiOpen, setManageAbiOpen, deleteAbi } =
    useAbiStore();
  const [abiToDelete, setAbiToDelete] = useState<SavedContractAbi | null>(null);

  return (
    <>
      <Dialog
        isOpen={manageAbiOpen}
        onClose={() => setManageAbiOpen(false)}
        title="Manage ABIs"
        description="Review available ABI presets. Standard ABIs are built in and cannot be deleted."
        className="flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col overflow-hidden sm:h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]"
      >
        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto pr-1 lg:grid-cols-2">
          <div className="flex min-h-0 flex-col gap-2">
            <span className="ml-1 block text-xs font-semibold text-foreground/70">
              Standard ABIs
            </span>
            <div className="space-y-2">
              {DEFAULT_ABIS.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-background/40 px-3 py-3"
                >
                  <p className="truncate text-sm font-medium text-foreground">
                    {name}
                  </p>
                  <span className="shrink-0 text-xs font-medium text-foreground/40">
                    Protected
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-2">
            <span className="ml-1 block text-xs font-semibold text-foreground/70">
              Custom ABIs
            </span>
            {savedAbis.length === 0 ? (
              <p className="rounded-xl border border-foreground/10 bg-background/30 px-3 py-3 text-xs text-foreground/50">
                No custom ABIs saved.
              </p>
            ) : (
              <div className="space-y-2 overflow-y-auto pr-1">
                {savedAbis.map((savedAbi) => (
                  <div
                    key={savedAbi.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-background/40 px-3 py-2"
                  >
                    <p
                      className="min-w-0 truncate text-sm font-medium text-foreground"
                      title={savedAbi.name}
                    >
                      {savedAbi.name}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 shrink-0 rounded-lg p-0 text-primary-500/70 hover:text-primary-500"
                      title="Delete custom ABI"
                      onClick={() => setAbiToDelete(savedAbi)}
                    >
                      <TrashIcon
                        title="Delete custom ABI"
                        className="h-4 w-4 shrink-0"
                      />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={!!abiToDelete}
        onClose={() => setAbiToDelete(null)}
        title="Delete Custom ABI?"
        description={
          abiToDelete
            ? `Delete "${abiToDelete.name}" from your saved ABI presets? This action cannot be undone.`
            : ''
        }
      >
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setAbiToDelete(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              if (abiToDelete) {
                deleteAbi(abiToDelete.id);
                setAbiToDelete(null);
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
