import { useEffect, useRef, useState } from 'react';
import { Button, Dialog } from '../../../components';
import { isDesktopApp } from '../../../services/platform';
import { useWorkspaceStore } from '../../../store';
import { getWorkspaceHasUnsavedChanges } from '../../workspace/utils/requestDirty';

export function DesktopCloseGuard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const allowCloseRef = useRef(false);

  useEffect(() => {
    if (!isDesktopApp()) return;

    let unlisten: (() => void) | undefined;
    void import('@tauri-apps/api/window').then(async ({ getCurrentWindow }) => {
      unlisten = await getCurrentWindow().onCloseRequested((event) => {
        if (allowCloseRef.current) return;
        const { collections, tabs, drafts } = useWorkspaceStore.getState();
        if (!getWorkspaceHasUnsavedChanges(collections, tabs, drafts)) return;
        event.preventDefault();
        setDialogOpen(true);
      });
    });

    return () => unlisten?.();
  }, []);

  if (!isDesktopApp()) return null;

  const closeApp = async () => {
    allowCloseRef.current = true;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  };

  return (
    <Dialog
      isOpen={dialogOpen}
      onClose={() => setDialogOpen(false)}
      title="Close with unsaved changes?"
      description="Some request changes have not been saved to their collections."
    >
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => setDialogOpen(false)}>
          Keep working
        </Button>
        <Button variant="primary" onClick={closeApp}>
          Close
        </Button>
      </div>
    </Dialog>
  );
}
