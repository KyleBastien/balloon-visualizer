import React, { useCallback, useMemo, useState, useEffect } from "react";
import { MapComponent } from "./components/MapComponent";
import { Timeline } from "./components/Timeline";
import { ResizeHandle } from "./components/ResizeHandle";
import { EventData } from "./types/EventData";
import { events } from "./events";

export const App: React.FC = () => {
  const data = useMemo(() => {
    return [...events].sort(
      (a, b) => a.best_location_when - b.best_location_when
    );
  }, []);

  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [windowHeight, setWindowHeight] = useState<number>(window.innerHeight);
  const [manualMapHeight, setManualMapHeight] = useState<number | null>(null);

  const timelineHeight = useMemo(() => {
    return 45; // Fixed height for timeline
  }, []);

  const resizeHandleHeight = 10; // Height of resize handle

  const mapHeight = useMemo(() => {
    // Use manual height if set, otherwise calculate to fill available space
    return manualMapHeight ?? (windowHeight - timelineHeight - resizeHandleHeight);
  }, [windowHeight, timelineHeight, manualMapHeight]);

  const maxMapHeight = useMemo(() => {
    return windowHeight - timelineHeight - resizeHandleHeight - 20; // Leave small buffer for minimum timeline
  }, [windowHeight, timelineHeight]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newWindowHeight = window.innerHeight;
      setWindowHeight(newWindowHeight);
      
      // Adjust map height if it's too large for the new window size
      const newMaxMapHeight = newWindowHeight - timelineHeight - resizeHandleHeight;
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
    <div className="container">
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
