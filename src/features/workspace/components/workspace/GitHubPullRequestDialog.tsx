import { useEffect, useState } from 'react';
import { Button, Dialog, Input, Textarea } from '../../../../components';
import { openExternalUrl } from '../../../../services/platform';

interface GitHubPullRequestDialogProps {
  currentBranch: string;
  defaultBranch: string;
  hasUnpushedChanges: boolean;
  isOpen: boolean;
  isWorking: boolean;
  onClose: () => void;
  onCreate: (input: {
    base: string;
    title: string;
    body: string;
  }) => Promise<{ number: number; url: string } | null>;
}

export const GitHubPullRequestDialog = ({
  currentBranch,
  defaultBranch,
  hasUnpushedChanges,
  isOpen,
  isWorking,
  onClose,
  onCreate,
}: GitHubPullRequestDialogProps) => {
  const [base, setBase] = useState(defaultBranch);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setBase(defaultBranch);
    setTitle('');
    setBody('');
  }, [defaultBranch, isOpen]);

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
        {hasUnpushedChanges && (
          <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-3 text-xs text-foreground/75">
            Push the current branch before creating a pull request.
          </div>
        )}
        <Input
          label="Base branch"
          value={base}
          onChange={(event) => setBase(event.target.value)}
          placeholder="main"
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
