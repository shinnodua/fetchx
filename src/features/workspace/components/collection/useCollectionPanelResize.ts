import type React from 'react';
import { useCallback, useState } from 'react';

interface UseCollectionPanelResizeParams {
  collectionsPanelWidth: number;
  setCollectionsPanelWidth: (width: number) => void;
  setCollectionsPanelCollapsed: (collapsed: boolean) => void;
}

export function clampCollectionPanelWidth(width: number): number {
  return Number.isFinite(width) && width > 0
    ? Math.max(200, Math.min(500, width))
    : 320;
}

export function useCollectionPanelResize({
  collectionsPanelWidth,
  setCollectionsPanelWidth,
  setCollectionsPanelCollapsed,
}: UseCollectionPanelResizeParams) {
  const [isDragging, setIsDragging] = useState(false);

  const safeCollectionsPanelWidth = clampCollectionPanelWidth(
    collectionsPanelWidth,
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const startX = e.clientX;
      const startWidth = safeCollectionsPanelWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const newWidth = Math.max(200, Math.min(500, startWidth + deltaX));
        setCollectionsPanelWidth(newWidth);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        setIsDragging(false);
        const finalX = upEvent.clientX;
        const deltaX = finalX - startX;
        if (startWidth + deltaX < 160) {
          setCollectionsPanelCollapsed(true);
          setCollectionsPanelWidth(320);
        }
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [
      safeCollectionsPanelWidth,
      setCollectionsPanelCollapsed,
      setCollectionsPanelWidth,
    ],
  );

  const handleDoubleClick = useCallback(() => {
    setCollectionsPanelCollapsed(true);
  }, [setCollectionsPanelCollapsed]);

  return {
    isDragging,
    safeCollectionsPanelWidth,
    handleMouseDown,
    handleDoubleClick,
  };
}
