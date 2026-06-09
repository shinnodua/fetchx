import { useEffect } from 'react';
import { useWorkspaceStore } from '../../../store';

export const useAutoCollapseSidebar = () => {
  const setCollectionsPanelCollapsed = useWorkspaceStore(
    (state) => state.setCollectionsPanelCollapsed,
  );

  useEffect(() => {
    // On mount, set collapse state based on window width
    if (window.innerWidth < 768) {
      setCollectionsPanelCollapsed(true);
    } else {
      setCollectionsPanelCollapsed(false);
    }

    // On resize, track width transitions
    let prevWidth = window.innerWidth;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (currentWidth < 768 && prevWidth >= 768) {
        setCollectionsPanelCollapsed(true);
      } else if (currentWidth >= 768 && prevWidth < 768) {
        setCollectionsPanelCollapsed(false);
      }
      prevWidth = currentWidth;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setCollectionsPanelCollapsed]);
};
