import { render } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    const container = document.querySelector('.flex.h-screen.flex-col.overflow-hidden');
    expect(container).toBeInTheDocument();
  });

  it('renders the map component', () => {
    render(<App />);
    // Map component should be rendered (we'll identify it by its container div)
    const mapContainer = document.querySelector('div[style*="height"]');
    expect(mapContainer).toBeInTheDocument();
  });

  it('renders the timeline component', () => {
    render(<App />);
    // Timeline should be rendered with new Tailwind classes
    const timeline = document.querySelector('.bg-gray-100');
    expect(timeline).toBeInTheDocument();
  });

  it('renders timeline items', () => {
    render(<App />);
    // Timeline items should be present with new classes
    const timelineItems = document.querySelectorAll('.bg-blue-300.min-w-\\[90px\\]');
    expect(timelineItems.length).toBeGreaterThan(0);
  });

  it('renders the resize handle', () => {
    render(<App />);
    // Resize handle should be present with new Tailwind classes
    const resizeHandle = document.querySelector('.relative.h-2\\.5.cursor-row-resize');
    expect(resizeHandle).toBeInTheDocument();
  });
});
