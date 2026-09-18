import { useCallback, useEffect, useState } from 'react';
import { Button, Dialog, Progress, useToast } from '../../../components';
import {
  checkForDesktopUpdate,
  type DesktopUpdate,
  isDesktopApp,
  relaunchDesktopApp,
} from '../../../services/platform';
import { useWorkspaceStore } from '../../../store';
import { getWorkspaceHasUnsavedChanges } from '../../workspace/utils/requestDirty';

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading';

export function DesktopUpdateManager() {
  const { toast } = useToast();
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [update, setUpdate] = useState<DesktopUpdate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const checkForUpdate = useCallback(
    async (showCurrentMessage: boolean) => {
      setStatus('checking');
      try {
        const nextUpdate = await checkForDesktopUpdate();
        setUpdate(nextUpdate);
        setStatus(nextUpdate ? 'available' : 'idle');
        setDialogOpen(Boolean(nextUpdate));
        if (!nextUpdate && showCurrentMessage) {
          toast({ title: 'Fetchx is up to date', type: 'success' });
        }
      } catch (error) {
        setStatus('idle');
        if (showCurrentMessage) {
          toast({
            title: 'Update check failed',
            description:
              error instanceof Error ? error.message : 'Please try again.',
            type: 'error',
          });
        }
      }
    },
    [toast],
  );

  useEffect(() => {
    if (!isDesktopApp()) return;
    const timeoutId = window.setTimeout(() => checkForUpdate(false), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [checkForUpdate]);

  if (!isDesktopApp()) return null;

  const installUpdate = async () => {
    if (!update) return;
    const { collections, tabs, drafts } = useWorkspaceStore.getState();
    if (getWorkspaceHasUnsavedChanges(collections, tabs, drafts)) {
      toast({
        title: 'Save or discard your changes first',
        description: 'Fetchx needs to restart after installing the update.',
        type: 'warning',
      });
      return;
    }

    setStatus('downloading');
    setProgress(null);
    try {
      await update.downloadAndInstall(setProgress);
      await relaunchDesktopApp();
    } catch (error) {
      setStatus('available');
      toast({
        title: 'Update installation failed',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        type: 'error',
      });
    }
  };

  return (
    <>
      {update && (
        <Button
          variant="secondary"
          size="sm"
          className="mb-1 h-8 cursor-pointer rounded-lg px-5 text-xs font-bold shadow-md shadow-primary-500/20"
          onClick={() => setDialogOpen(true)}
        >
          Update Available
        </Button>
      )}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => status !== 'downloading' && setDialogOpen(false)}
        title={update ? `Fetchx ${update.version} is available` : 'App update'}
        description={
          update?.publishedAt ? `Published ${update.publishedAt}` : undefined
        }
        hideCloseButton={status === 'downloading'}
      >
        <div className="space-y-5">
          {update?.notes && (
            <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm text-foreground/70">
              {update.notes}
            </p>
          )}
          {status === 'downloading' && (
            <div className="space-y-2">
              <Progress value={(progress ?? 0) * 100} />
              <p className="text-xs text-foreground/60">
                {progress === null
                  ? 'Downloading and verifying update…'
                  : `${Math.round(progress * 100)}% downloaded`}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              disabled={status === 'downloading'}
              onClick={() => setDialogOpen(false)}
            >
              Later
            </Button>
            <Button
              variant="primary"
              isLoading={status === 'downloading'}
              onClick={installUpdate}
            >
              Update and restart
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
