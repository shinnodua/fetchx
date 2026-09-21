import { useEffect, useRef, useState } from 'react';
import { Button, Dialog, Input, Select } from '../../../../components';
import type { GitHubBranch } from '../../../../services/github';

interface GitHubBranchDialogProps {
  currentBranch: string;
  isDirty: boolean;
  isOpen: boolean;
  isWorking: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<GitHubBranch | null>;
  onLoad: () => Promise<GitHubBranch[]>;
  onSwitch: (branch: string, discardChanges?: boolean) => Promise<boolean>;
}

export const GitHubBranchDialog = ({
  currentBranch,
  isDirty,
  isOpen,
  isWorking,
  onClose,
  onCreate,
  onLoad,
  onSwitch,
}: GitHubBranchDialogProps) => {
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(currentBranch);
  const [newBranch, setNewBranch] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const onLoadRef = useRef(onLoad);

  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedBranch(currentBranch);
    setConfirmDiscard(false);
    void onLoadRef.current().then(setBranches);
  }, [isOpen, currentBranch]);

  const handleSwitch = async (discardChanges = false) => {
    const switched = await onSwitch(selectedBranch, discardChanges);
    if (switched) onClose();
  };

  const handleCreate = async () => {
    const created = await onCreate(newBranch);
    if (!created) return;
    setNewBranch('');
    setBranches((current) =>
      [
        ...current.filter((branch) => branch.name !== created.name),
        created,
      ].sort((left, right) => left.name.localeCompare(right.name)),
    );
    setSelectedBranch(created.name);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Switch branch"
      description="Switching loads this branch’s FetchX workspace files."
      className="max-w-md"
    >
      <div className="space-y-4">
        <Select
          label="Branch"
          value={selectedBranch}
          onChange={setSelectedBranch}
          options={branches.map((branch) => ({
            value: branch.name,
            label:
              branch.name === currentBranch
                ? `${branch.name} (current)`
                : branch.name,
          }))}
          isLoading={isWorking && branches.length === 0}
          loadingLabel="Loading branches…"
          placeholder="Select a branch"
        />
        <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
          <p className="text-xs font-medium text-foreground">Create branch</p>
          <p className="mt-1 text-[11px] text-foreground/55">
            The new branch starts from {currentBranch}.
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              value={newBranch}
              onChange={(event) => setNewBranch(event.target.value)}
              placeholder="feature/request-updates"
              density="sm"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={isWorking || !newBranch.trim()}
              onClick={() => void handleCreate()}
            >
              Create
            </Button>
          </div>
        </div>
        {confirmDiscard && (
          <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-3 text-xs text-foreground/75">
            You have unpushed changes. Switching will discard those local
            changes. Push this branch first to keep them.
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={isWorking}
            onClick={onClose}
          >
            Cancel
          </Button>
          {confirmDiscard ? (
            <Button
              variant="primary"
              size="sm"
              disabled={isWorking}
              onClick={() => void handleSwitch(true)}
            >
              Discard and switch
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              disabled={isWorking || selectedBranch === currentBranch}
              onClick={() => {
                if (isDirty) setConfirmDiscard(true);
                else void handleSwitch();
              }}
            >
              Switch branch
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
};
