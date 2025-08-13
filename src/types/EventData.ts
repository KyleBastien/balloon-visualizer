export interface EventData {
  event: string;
  file: string;
  best_location_when: number;
  "Best location ISO8601": string;
  "Best location PST": string;
  best_lat: number;
  best_lon: number;
  best_location: string;
  best_country: string;
  best_timezone: string;
  "body.temperature": number;
  "Body temperature (F)": number;
  "body.bearing": number | null;
  "body.distance": number | null;
  "body.dop": number | null;
  "body.velocity": number | null;
}
