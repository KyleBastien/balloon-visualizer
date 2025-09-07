export interface EventData {
  event: string;
  file: string;
  best_location_when: number;
  'Best location ISO8601': string;
  'Best location PST': string;
  best_lat: number;
  best_lon: number;
  best_location: string;
  best_country: string;
  best_timezone: string;
  'body.temperature': number;
  'Body temperature (F)': number;
  'body.bearing': number | null;
  'body.distance': number | null;
  'body.dop': number | null;
  'body.velocity': number | null;
  // Sava1 logger data
  'Temperature (C)': number;
  'Humidity (%)': number;
  'Pressure (hPa)': number;
  'Baro Alt (m)': number;
  'GPS Alt (m)': number;
  'Ascent Rate (m/s)': number;
  'Max Ascent (m/s)': number;
  'Speed (m/s)': number;
  'Max Speed (m/s)': number;
  'Max Alt (m)': number;
  'Burst Detected': 'YES' | 'NO';
  Falling: 'YES' | 'NO';
  'Temp at Burst': number;
  TimeSrc: 'GPS';
  Fix: 'FIX_OK';
  Sats: number;
}
