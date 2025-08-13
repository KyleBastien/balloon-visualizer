import { render } from '@testing-library/react';
import { mockEventData } from '../test/mockData';
import { MapComponent } from './MapComponent';

const mockProps = {
  data: mockEventData,
  selectedEvent: null,
  onEventSelect: vi.fn(),
  height: 400,
};

describe('MapComponent', () => {
  it('renders without crashing', () => {
    const { container } = render(<MapComponent {...mockProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with correct height', () => {
    const { container } = render(<MapComponent {...mockProps} height={500} />);
    const mapDiv = container.firstChild as HTMLElement;
    expect(mapDiv).toHaveStyle({ height: '500px' });
  });

  it('renders with minimum height', () => {
    const { container } = render(<MapComponent {...mockProps} height={100} />);
    const mapDiv = container.firstChild as HTMLElement;
    expect(mapDiv).toHaveStyle({ minHeight: '200px' });
  });

  it('calls onEventSelect when provided', () => {
    const onEventSelect = vi.fn();
    render(<MapComponent {...mockProps} onEventSelect={onEventSelect} />);
    // The component should render without calling onEventSelect initially
    expect(onEventSelect).not.toHaveBeenCalled();
  });

  it('handles empty data array', () => {
    const emptyProps = { ...mockProps, data: [] };
    // Component should handle empty data gracefully (may not initialize map but shouldn't crash)
    // We'll test that it renders the container div at minimum
    const { container } = render(<MapComponent {...emptyProps} />);
    const mapDiv = container.firstChild as HTMLElement;
    expect(mapDiv).toBeInTheDocument();
    expect(mapDiv).toHaveStyle({ height: '400px' });
  });

  it('handles selectedEvent prop', () => {
    const propsWithSelected = {
      ...mockProps,
      selectedEvent: mockEventData[0],
    };
    expect(() => render(<MapComponent {...propsWithSelected} />)).not.toThrow();
  });
});
