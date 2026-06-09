import { useEffect } from 'react';
import { useWorkspaceStore } from '../../../store';
import type { RequestItem } from '../types';
import { getRequestIsDirty } from '../utils/requestDirty';

export const useUnsavedChangesWarning = () => {
  const { collections, tabs, drafts } = useWorkspaceStore();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const hasUnsaved = tabs.some((tabId) => {
        const draft = drafts[tabId];
        let original: RequestItem | undefined;
        for (const col of collections) {
          const found = col.requests.find((r) => r.id === tabId);
          if (found) {
            original = found;
            break;
          }
        }
        return getRequestIsDirty(draft, original);
      });

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
