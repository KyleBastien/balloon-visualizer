import { fireEvent, render, screen } from '@testing-library/react';
import { mockEventData } from '../test/mockData';
import { Timeline } from './Timeline';

const mockProps = {
  data: mockEventData,
  selectedEvent: null,
  onEventSelect: vi.fn(),
  height: 100,
};

describe('Timeline', () => {
  it('renders without crashing', () => {
    render(<Timeline {...mockProps} />);
    const timeline = document.querySelector('.timeline');
    expect(timeline).toBeInTheDocument();
  });

  it('renders all timeline items', () => {
    render(<Timeline {...mockProps} />);
    const timelineItems = document.querySelectorAll('.timeline-item');
    expect(timelineItems).toHaveLength(mockEventData.length);
  });

  it('calls onEventSelect when timeline item is clicked', () => {
    const onEventSelect = vi.fn();
    render(<Timeline {...mockProps} onEventSelect={onEventSelect} />);

    const firstItem = document.querySelector('.timeline-item');
    if (firstItem) {
      fireEvent.click(firstItem);
    }

    expect(onEventSelect).toHaveBeenCalledWith(mockEventData[0]);
  });

  it('calls onEventSelect when timeline item is hovered', () => {
    const onEventSelect = vi.fn();
    render(<Timeline {...mockProps} onEventSelect={onEventSelect} />);

    const firstItem = document.querySelector('.timeline-item');
    if (firstItem) {
      fireEvent.mouseEnter(firstItem);
    }

    expect(onEventSelect).toHaveBeenCalledWith(mockEventData[0]);
  });

  it('highlights selected event', () => {
    const propsWithSelected = {
      ...mockProps,
      selectedEvent: mockEventData[1],
    };
    render(<Timeline {...propsWithSelected} />);

    const timelineItems = document.querySelectorAll('.timeline-item');
    // Second item should have selected class
    expect(timelineItems[1]).toHaveClass('selected');
  });

  it('displays event times for each event', () => {
    render(<Timeline {...mockProps} />);

    // Should display the full timestamp strings from mockData
    expect(screen.getByText('8/9/2025 2:37 PM')).toBeInTheDocument();
    expect(screen.getByText('8/9/2025 2:38 PM')).toBeInTheDocument();
    expect(screen.getByText('8/9/2025 2:39 PM')).toBeInTheDocument();
  });

  it('handles empty data array', () => {
    const emptyProps = { ...mockProps, data: [] };
    render(<Timeline {...emptyProps} />);

    const timelineItems = document.querySelectorAll('.timeline-item');
    expect(timelineItems).toHaveLength(0);
  });
});
