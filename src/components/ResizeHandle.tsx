import React, { useCallback, useState } from 'react';
import { ResizeHandleProps } from './ResizeHandle.types';

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onResize,
  minMapHeight,
  maxMapHeight,
  currentMapHeight,
}) => {
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsResizing(true);
      const startY = e.clientY;
      const startMapHeight = currentMapHeight; // Use the passed current height instead of DOM query

      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - startY;
        const newMapHeight = Math.max(
          minMapHeight,
          Math.min(maxMapHeight, startMapHeight + deltaY)
        );
        onResize(newMapHeight);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';

      e.preventDefault();
    },
    [onResize, minMapHeight, maxMapHeight, currentMapHeight]
  );

  return (
    <div
      className={`resize-handle ${isResizing ? 'resizing' : ''}`}
      onMouseDown={handleMouseDown}
    />
  );
};
