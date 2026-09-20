import type React from 'react';
import { CopyIcon } from '../../../../assets/svgs';
import { Button, useToast } from '../../../../components';

interface GitHubDeviceAuthCardProps {
  userCode: string;
  authorizationStatus: string;
  isChecking: boolean;
  onCheckNow: () => void;
}

export const GitHubDeviceAuthCard: React.FC<GitHubDeviceAuthCardProps> = ({
  userCode,
  authorizationStatus,
  isChecking,
  onCheckNow,
}) => {
  const { toast } = useToast();

  const copyDeviceCode = async () => {
    try {
      await navigator.clipboard.writeText(userCode);
      toast({
        title: 'Device code copied',
        description: 'Paste it into GitHub to continue authorization.',
        type: 'success',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not copy the GitHub device code.',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-foreground/10 bg-foreground/[0.03] p-3">
      <p className="text-xs leading-relaxed text-foreground/70">
        {authorizationStatus ||
          'Enter this one-time code in GitHub. FetchX checks its status automatically.'}
      </p>
      <div className="relative rounded-lg border border-primary-500/25 bg-primary-500/10 px-4 py-3 text-center">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
          GitHub device code
        </span>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          className="absolute right-1.5 top-1.5 rounded-md text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
          onClick={() => void copyDeviceCode()}
          title="Copy GitHub device code"
          aria-label="Copy GitHub device code"
        >
          <CopyIcon
            title="Copy GitHub device code"
            className="shrink-0"
            strokeWidth={1.5}
          />
        </Button>
        <code className="mt-1 block font-mono text-2xl font-semibold tracking-[0.2em] text-foreground">
          {userCode}
        </code>
      </div>
      <Button
        variant="primary"
        size="sm"
        className="w-full whitespace-nowrap"
        isLoading={isChecking}
        disabled={isChecking}
        onClick={onCheckNow}
      >
        Check now
      </Button>
    </div>
  );
};
