import { EventData } from '../types/EventData';

export interface MapComponentProps {
  data: EventData[];
  selectedEvent: EventData | null;
  onEventSelect: (event: EventData) => void;
  height: number;
}
