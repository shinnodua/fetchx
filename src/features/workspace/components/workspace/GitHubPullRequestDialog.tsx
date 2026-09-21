import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  Input,
  Select,
  Textarea,
} from '../../../../components';
import type { GitHubBranch } from '../../../../services/github';
import { openExternalUrl } from '../../../../services/platform';

export const getPullRequestBaseBranches = (
  branches: GitHubBranch[],
  currentBranch: string,
) => branches.filter((branch) => branch.name !== currentBranch);

export const getInitialPullRequestBase = (
  branches: GitHubBranch[],
  currentBranch: string,
  defaultBranch: string,
) => {
  const baseBranches = getPullRequestBaseBranches(branches, currentBranch);
  return (
    baseBranches.find((branch) => branch.name === defaultBranch)?.name ??
    baseBranches[0]?.name ??
    ''
  );
};

interface GitHubPullRequestDialogProps {
  currentBranch: string;
  defaultBranch: string;
  error: string | null;
  hasUnpushedChanges: boolean;
  isOpen: boolean;
  isLoadingBranches: boolean;
  isWorking: boolean;
  onClose: () => void;
  onCreate: (input: {
    base: string;
    title: string;
    body: string;
  }) => Promise<{ number: number; url: string } | null>;
  onLoadBranches: () => Promise<GitHubBranch[]>;
}

export const GitHubPullRequestDialog = ({
  currentBranch,
  defaultBranch,
  error,
  hasUnpushedChanges,
  isOpen,
  isLoadingBranches,
  isWorking,
  onClose,
  onCreate,
  onLoadBranches,
}: GitHubPullRequestDialogProps) => {
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [base, setBase] = useState(defaultBranch);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const onLoadBranchesRef = useRef(onLoadBranches);

  useEffect(() => {
    onLoadBranchesRef.current = onLoadBranches;
  }, [onLoadBranches]);

  useEffect(() => {
    if (!isOpen) return;
    setBranches([]);
    setBase('');
    setTitle('');
    setBody('');
    void onLoadBranchesRef.current().then((loadedBranches) => {
      setBranches(loadedBranches);
      setBase(
        getInitialPullRequestBase(loadedBranches, currentBranch, defaultBranch),
      );
    });
  }, [currentBranch, defaultBranch, isOpen]);

  const baseBranches = getPullRequestBaseBranches(branches, currentBranch);

  const handleCreate = async () => {
    const pullRequest = await onCreate({
      base: base.trim(),
      title: title.trim(),
      body: body.trim(),
    });
    if (!pullRequest) return;
    await openExternalUrl(pullRequest.url);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create pull request"
      description={`Open a pull request from ${currentBranch}.`}
      className="max-w-md"
    >
      <div className="space-y-3">
        {error && (
          <Alert variant="destructive" title="Pull request failed">
            {error}
          </Alert>
        )}
        {hasUnpushedChanges && (
          <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-3 text-xs text-foreground/75">
            Push the current branch before creating a pull request.
          </div>
        )}
        <Select
          label="Base branch"
          value={base}
          onChange={setBase}
          options={baseBranches.map((branch) => ({
            value: branch.name,
            label:
              branch.name === defaultBranch
                ? `${branch.name} (default)`
                : branch.name,
          }))}
          isLoading={isLoadingBranches && branches.length === 0}
          loadingLabel="Loading branches…"
          placeholder="Select a base branch"
        />
        <Input
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Describe the change"
        />
        <Textarea
          label="Description"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Optional context for reviewers"
          className="min-h-24 text-xs"
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={isWorking}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={
              isWorking ||
              isLoadingBranches ||
              hasUnpushedChanges ||
              !base.trim() ||
              !title.trim() ||
              base.trim() === currentBranch
            }
            onClick={() => void handleCreate()}
          >
            {isWorking ? 'Creating…' : 'Create pull request'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
