import React, { useState } from 'react';
import { TimelineProps } from './Timeline.types';

export const Timeline: React.FC<TimelineProps> = ({
  data,
  selectedEvent,
  onEventSelect,
  height,
}) => {
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  return (
    <div
      className='flex w-full flex-shrink-0 items-end justify-start gap-4 overflow-x-auto bg-gray-100 px-2.5'
      style={{ height: `${height}px` }}
    >
      {data.map(event => {
        const isSelected = selectedEvent?.event === event.event;
        const isHovered = hoveredEvent === event.event;

        return (
          <div
            key={event.event}
            className={`flex h-5 min-w-[90px] flex-shrink-0 cursor-pointer flex-col items-center bg-blue-300 ${
              isSelected ? 'selected' : ''
            }`}
            onClick={() => onEventSelect(event)}
            onMouseEnter={() => {
              setHoveredEvent(event.event);
              onEventSelect(event);
            }}
            onMouseLeave={() => setHoveredEvent(null)}
          >
            <div
              className={`mb-1.5 h-5 w-2 rounded-sm transition-all duration-200 ${
                isSelected
                  ? 'scale-125 bg-red-500'
                  : isHovered
                    ? 'scale-110 bg-blue-800'
                    : 'bg-blue-300'
              }`}
            />
            <div className='max-w-[90px] text-center text-[10px] leading-tight break-words text-black'>
              {event['Best location PST']}
            </div>
          </div>
        );
      })}
    </div>
  );
};
