import React from 'react';
import { TimelineProps } from './Timeline.types';

export const Timeline: React.FC<TimelineProps> = ({
  data,
  selectedEvent,
  onEventSelect,
  height,
}) => {
  return (
    <div className='timeline' style={{ height: `${height}px`, minHeight: '40px' }}>
      {data.map(event => (
        <div
          key={event.event}
          className={`timeline-item ${selectedEvent?.event === event.event ? 'selected' : ''}`}
          onClick={() => onEventSelect(event)}
          onMouseEnter={() => onEventSelect(event)}
        >
          <div className='timeline-dot' />
          <div className='timeline-label'>{event['Best location PST']}</div>
        </div>
      ))}
    </div>
  );
};
