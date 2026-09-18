export type TabReorderPlacement = 'before' | 'after';

export const reorderTabIds = (
  tabs: string[],
  draggedTabId: string,
  targetTabId: string,
  placement: TabReorderPlacement = 'before',
) => {
  const sourceIndex = tabs.indexOf(draggedTabId);
  const targetIndex = tabs.indexOf(targetTabId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return tabs;
  }

  const reorderedTabs = [...tabs];
  const [draggedTab] = reorderedTabs.splice(sourceIndex, 1);
  const insertionIndex =
    placement === 'before'
      ? sourceIndex < targetIndex
        ? targetIndex - 1
        : targetIndex
      : sourceIndex < targetIndex
        ? targetIndex
        : targetIndex + 1;
  reorderedTabs.splice(insertionIndex, 0, draggedTab);

  return reorderedTabs;
};
