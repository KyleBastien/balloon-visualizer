import { fireEvent, render } from '@testing-library/react';
import { ResizeHandle } from './ResizeHandle';

const mockProps = {
  onResize: vi.fn(),
  minMapHeight: 200,
  maxMapHeight: 800,
  currentMapHeight: 400,
};

describe('ResizeHandle', () => {
  it('renders without crashing', () => {
    const { container } = render(<ResizeHandle {...mockProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has correct CSS class', () => {
    const { container } = render(<ResizeHandle {...mockProps} />);
    const handle = container.firstChild as HTMLElement;
    expect(handle).toHaveClass('resize-handle');
  });

  it('calls onResize when mouse down and move events occur', () => {
    const onResize = vi.fn();
    const { container } = render(<ResizeHandle {...mockProps} onResize={onResize} />);
    const handle = container.firstChild as HTMLElement;

    // Simulate mouse down
    fireEvent.mouseDown(handle, { clientY: 100 });

    // Simulate mouse move
    fireEvent.mouseMove(document, { clientY: 150 });

    expect(onResize).toHaveBeenCalled();
  });

  it('handles mouse up event to stop dragging', () => {
    const onResize = vi.fn();
    const { container } = render(<ResizeHandle {...mockProps} onResize={onResize} />);
    const handle = container.firstChild as HTMLElement;

    // Start dragging
    fireEvent.mouseDown(handle, { clientY: 100 });
    fireEvent.mouseMove(document, { clientY: 150 });

    // Stop dragging
    fireEvent.mouseUp(document);

    // Move again - should not call onResize
    fireEvent.mouseMove(document, { clientY: 200 });

    expect(onResize).toHaveBeenCalledTimes(1);
  });

  it('prevents text selection during drag', () => {
    const { container } = render(<ResizeHandle {...mockProps} />);
    const handle = container.firstChild as HTMLElement;

    // Start dragging
    fireEvent.mouseDown(handle, { clientY: 100 });

    // Check that document.body has userSelect none during drag
    expect(document.body.style.userSelect).toBe('none');

    // Stop dragging
    fireEvent.mouseUp(document);

    // Check that userSelect is restored after drag
    expect(document.body.style.userSelect).toBe('');
  });

  it('handles edge case with rapid mouse movements', () => {
    const onResize = vi.fn();
    const { container } = render(<ResizeHandle {...mockProps} onResize={onResize} />);
    const handle = container.firstChild as HTMLElement;

    fireEvent.mouseDown(handle, { clientY: 100 });

    // Rapid movements
    fireEvent.mouseMove(document, { clientY: 110 });
    fireEvent.mouseMove(document, { clientY: 120 });
    fireEvent.mouseMove(document, { clientY: 130 });

    expect(onResize).toHaveBeenCalledTimes(3);
  });
});
