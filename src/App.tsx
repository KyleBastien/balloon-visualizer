import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapComponent } from './components/MapComponent';
import { ResizeHandle } from './components/ResizeHandle';
import { Timeline } from './components/Timeline';
import { events } from './events';
import { EventData } from './types/EventData';

export const App: React.FC = () => {
  const data = useMemo(() => {
    return [...events].sort((a, b) => a.best_location_when - b.best_location_when);
  }, []);

  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [windowHeight, setWindowHeight] = useState<number>(window.innerHeight);
  const [manualMapHeight, setManualMapHeight] = useState<number | null>(null);

  const timelineHeight = useMemo(() => {
    return 45; // Fixed height for timeline - now strictly enforced
  }, []);

  const resizeHandleHeight = 10; // Height of resize handle (h-2.5 = 10px)

  const mapHeight = useMemo(() => {
    // Use manual height if set, otherwise calculate to fill available space
    const calculatedHeight = manualMapHeight ?? windowHeight - timelineHeight - resizeHandleHeight;
    // Ensure we never go below minimum
    return Math.max(200, calculatedHeight);
  }, [windowHeight, timelineHeight, manualMapHeight]);

  const maxMapHeight = useMemo(() => {
    // Ensure timeline always has its required space
    return Math.max(200, windowHeight - timelineHeight - resizeHandleHeight);
  }, [windowHeight, timelineHeight]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newWindowHeight = window.innerHeight;
      setWindowHeight(newWindowHeight);

      // Adjust manual map height if it exceeds the new maximum
      const newMaxMapHeight = Math.max(200, newWindowHeight - timelineHeight - resizeHandleHeight);
      if (manualMapHeight && manualMapHeight > newMaxMapHeight) {
        setManualMapHeight(newMaxMapHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [manualMapHeight, timelineHeight]);

  const handleEventSelect = useCallback((event: EventData) => {
    setSelectedEvent(event);
  }, []);

  const handleMapResize = useCallback((newHeight: number) => {
    setManualMapHeight(newHeight);
  }, []);

  return (
    <div className='flex h-screen flex-col overflow-hidden'>
      <MapComponent
        data={data}
        selectedEvent={selectedEvent}
        onEventSelect={handleEventSelect}
        height={mapHeight}
      />
      <ResizeHandle
        onResize={handleMapResize}
        minMapHeight={200}
        maxMapHeight={maxMapHeight}
        currentMapHeight={mapHeight}
      />
      <Timeline
        data={data}
        selectedEvent={selectedEvent}
        onEventSelect={handleEventSelect}
        height={timelineHeight}
      />
    </div>
  );
};
