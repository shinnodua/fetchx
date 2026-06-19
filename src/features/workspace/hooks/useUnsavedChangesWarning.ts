import { useEffect } from 'react';
import { useWorkspaceStore } from '../../../store';
import { getWorkspaceHasUnsavedChanges } from '../utils/requestDirty';

export const useUnsavedChangesWarning = () => {
  const { collections, tabs, drafts } = useWorkspaceStore();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const hasUnsaved = getWorkspaceHasUnsavedChanges(
        collections,
        tabs,
        drafts,
      );

      if (hasUnsaved) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [collections, tabs, drafts]);
};
