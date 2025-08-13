export interface ResizeHandleProps {
  onResize: (newHeight: number) => void;
  minMapHeight: number;
  maxMapHeight: number;
  currentMapHeight: number;
}
