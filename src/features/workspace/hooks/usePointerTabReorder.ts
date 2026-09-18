import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TabReorderPlacement } from '../../../store/workspace/tabOrder';

interface TabInsertion {
  placement: TabReorderPlacement;
  tabId: string;
}

const getTabInsertion = (clientX: number, clientY: number) => {
  const tab = document
    .elementFromPoint(clientX, clientY)
    ?.closest<HTMLElement>('[data-workspace-tab-id]');
  const tabId = tab?.dataset.workspaceTabId;
  if (!tab || !tabId) return null;

  const bounds = tab.getBoundingClientRect();
  return {
    tabId,
    placement:
      clientX > bounds.left + bounds.width / 2
        ? ('after' as const)
        : ('before' as const),
  };
};

export const usePointerTabReorder = (
  reorderTabs: (
    draggedTabId: string,
    targetTabId: string,
    placement?: TabReorderPlacement,
  ) => void,
) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [tabInsertion, setTabInsertion] = useState<TabInsertion | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const lastPreviewKeyRef = useRef<string | null>(null);

  const resetTabDrag = useCallback(() => {
    pointerIdRef.current = null;
    lastPreviewKeyRef.current = null;
    setDraggedTabId(null);
    setTabInsertion(null);
  }, []);

  const startTabDrag = (
    tabId: string,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if ((event.target as HTMLElement).closest('button')) return;
    event.preventDefault();
    pointerIdRef.current = event.pointerId;
    lastPreviewKeyRef.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggedTabId(tabId);
  };

  useEffect(() => {
    if (!draggedTabId) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerIdRef.current) return;
      const insertion = getTabInsertion(event.clientX, event.clientY);
      if (!insertion || insertion.tabId === draggedTabId) {
        setTabInsertion(null);
        return;
      }

      setTabInsertion(insertion);
      const previewKey = `${insertion.tabId}:${insertion.placement}`;
      if (previewKey === lastPreviewKeyRef.current) return;

      lastPreviewKeyRef.current = previewKey;
      reorderTabs(draggedTabId, insertion.tabId, insertion.placement);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId === pointerIdRef.current) resetTabDrag();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [draggedTabId, reorderTabs, resetTabDrag]);

  const isTabInsertion = (tabId: string, placement: TabReorderPlacement) =>
    tabInsertion?.tabId === tabId && tabInsertion.placement === placement;

  return { draggedTabId, isTabInsertion, startTabDrag };
};
