import { render } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    const container = document.querySelector('.container');
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
    // Timeline should be rendered with timeline class
    const timeline = document.querySelector('.timeline');
    expect(timeline).toBeInTheDocument();
  });

  it('renders timeline items', () => {
    render(<App />);
    // Timeline items should be present
    const timelineItems = document.querySelectorAll('.timeline-item');
    expect(timelineItems.length).toBeGreaterThan(0);
  });

  it('renders the resize handle', () => {
    render(<App />);
    // Resize handle should be present with resize-handle class
    const resizeHandle = document.querySelector('.resize-handle');
    expect(resizeHandle).toBeInTheDocument();
  });
});
