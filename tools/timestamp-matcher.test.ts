import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimestampMatcher } from './timestamp-matcher.js';

// Mock data for testing
const mockCsvData = `Timestamp,Temperature (C),Humidity (%),Pressure (hPa),Baro Alt (m),GPS Alt (m),Ascent Rate (m/s),Max Ascent (m/s),Speed (m/s),Max Speed (m/s),Max Alt (m),Burst Detected,Falling,Temp at Burst,TimeSrc,Fix,Sats
8/9/2025 21:36:15,25.5,65.2,1015.3,100,105,0.5,1.2,2.3,5.1,200,NO,NO,NA,GPS,FIX_OK,8
8/9/2025 21:36:20,25.3,65.4,1015.1,105,110,0.6,1.2,2.1,5.1,205,NO,NO,NA,GPS,FIX_OK,8
8/9/2025 21:37:10,24.8,66.1,1014.8,120,125,0.7,1.2,1.9,5.1,225,NO,NO,NA,GPS,FIX_OK,8
8/9/2025 21:37:15,24.6,66.3,1014.6,125,130,0.8,1.2,1.8,5.1,230,NO,NO,NA,GPS,FIX_OK,8`;

const mockEventsData = [
  {
    event: 'test-event-1',
    file: '_track.qo',
    best_location_when: 1754775430,
    'Best location ISO8601': '2025-08-09T21:37:10',
    'Best location PST': '8/9/2025 2:37 PM',
    best_lat: 46.3847275,
    best_lon: -123.1622773,
    best_location: 'Vader WA',
    best_country: 'US',
    best_timezone: 'America/Los_Angeles',
    'body.temperature': 3.3125,
    'Body temperature (F)': 38,
    'body.bearing': 334.03732,
    'body.distance': 7.0083313,
    'body.dop': 1.0302734,
    'body.velocity': 0.14911343,
  },
  {
    event: 'test-event-2',
    file: '_track.qo',
    best_location_when: 1754775383,
    'Best location ISO8601': '2025-08-09T21:36:18',
    'Best location PST': '8/9/2025 2:36 PM',
    best_lat: 46.3846725,
    best_lon: -123.1622383,
    best_location: 'Vader WA',
    best_country: 'US',
    best_timezone: 'America/Los_Angeles',
    'body.temperature': 3.3125,
    'Body temperature (F)': 38,
    'body.bearing': 242.64433,
    'body.distance': 40.73381,
    'body.dop': 0.8300781,
    'body.velocity': 8.146762,
  },
];

describe('TimestampMatcher', () => {
  let tempDir: string;
  let mockEventsFile: string;
  let mockCsvFile: string;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'timestamp-matcher-test-'));
    mockEventsFile = path.join(tempDir, 'events.ts');
    mockCsvFile = path.join(tempDir, 'sava1-logger-real-all-copy.csv');

    // Mock console methods to reduce noise during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up temporary files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('should exist as a module', () => {
      expect(TimestampMatcher).toBeDefined();
      expect(typeof TimestampMatcher).toBe('function');
    });

    it('should create an instance', () => {
      const matcher = new TimestampMatcher();
      expect(matcher).toBeInstanceOf(TimestampMatcher);
      expect(typeof matcher.execute).toBe('function');
    });
  });

  describe('Error handling', () => {
    it('should throw error when CSV file does not exist', async () => {
      // Create only events file, no CSV file
      const eventsContent = `export const events = ${JSON.stringify(mockEventsData, null, 2)};`;
      fs.writeFileSync(mockEventsFile, eventsContent);

      const matcher = new TimestampMatcher();

      // Pass absolute path directly with non-existent CSV file
      const nonExistentCsv = path.join(tempDir, 'non-existent.csv');
      await expect(matcher.execute(mockEventsFile, nonExistentCsv)).rejects.toThrow(
        'CSV file not found'
      );
    });

    it('should throw error when events file does not exist', async () => {
      // Create CSV file but not events file
      fs.writeFileSync(mockCsvFile, mockCsvData);

      const matcher = new TimestampMatcher();
      const nonExistentFile = 'nonexistent.ts';

      await expect(matcher.execute(nonExistentFile)).rejects.toThrow('Events file not found');
    });

    it('should handle malformed CSV data gracefully', async () => {
      const malformedCsv = `Timestamp,Temperature (C)
invalid-timestamp,25.5`;

      // Create files
      const eventsContent = `export const events = ${JSON.stringify(mockEventsData, null, 2)};`;
      fs.writeFileSync(mockEventsFile, eventsContent);
      fs.writeFileSync(mockCsvFile, malformedCsv);

      const matcher = new TimestampMatcher();

      await expect(matcher.execute(mockEventsFile, mockCsvFile)).rejects.toThrow(
        'No valid CSV data rows found'
      );
    });

    it('should handle missing events data', async () => {
      // Create empty events file
      const eventsContent = `export const events = [];`;
      fs.writeFileSync(mockEventsFile, eventsContent);
      fs.writeFileSync(mockCsvFile, mockCsvData);

      const matcher = new TimestampMatcher();

      await expect(matcher.execute(mockEventsFile, mockCsvFile)).rejects.toThrow(
        'Events file must export a non-empty array'
      );
    });
  });

  describe('Data processing and validation', () => {
    it('should execute successfully with valid data and preserve original properties', async () => {
      // Create test files
      const eventsContent = `export const events = ${JSON.stringify(mockEventsData, null, 2)};`;
      fs.writeFileSync(mockEventsFile, eventsContent);
      fs.writeFileSync(mockCsvFile, mockCsvData);

      const matcher = new TimestampMatcher();

      // Should execute without throwing
      await expect(matcher.execute(mockEventsFile, mockCsvFile)).resolves.not.toThrow();

      // Verify backup was created
      const backupFile = mockEventsFile + '.backup';
      expect(fs.existsSync(backupFile)).toBe(true);

      // Read the modified events file
      const modifiedContent = fs.readFileSync(mockEventsFile, 'utf-8');
      expect(modifiedContent).toContain('export const events =');
      expect(modifiedContent).toContain('test-event-1');
      expect(modifiedContent).toContain('test-event-2');

      // Parse the written content to verify structure
      const exportMatch = modifiedContent.match(/export const events = (.*);/s);
      expect(exportMatch).toBeTruthy();

      if (exportMatch) {
        const eventsData = JSON.parse(exportMatch[1]);
        expect(Array.isArray(eventsData)).toBe(true);
        expect(eventsData).toHaveLength(2);

        // Verify original properties are preserved
        expect(eventsData[0]).toHaveProperty('event', 'test-event-1');
        expect(eventsData[0]).toHaveProperty('Best location ISO8601', '2025-08-09T21:37:10');

        // Verify CSV data was added (exact match for first event timestamp: 21:37:10)
        expect(eventsData[0]).toHaveProperty('Temperature (C)', 24.8);
        expect(eventsData[0]).toHaveProperty('Humidity (%)', 66.1);
        expect(eventsData[0]).toHaveProperty('Pressure (hPa)', 1014.8);

        // Verify second event got closest match (21:36:18 should match closest to 21:36:20)
        expect(eventsData[1]).toHaveProperty('event', 'test-event-2');
        expect(eventsData[1]).toHaveProperty('Temperature (C)', 25.3);
        expect(eventsData[1]).toHaveProperty('Humidity (%)', 65.4);
      }
    });

    it('should preserve original event properties and not overwrite them', async () => {
      // Create CSV with property names that conflict with event properties
      const conflictingCsv = `Timestamp,event,best_lat,Temperature (C)
8/9/2025 21:37:10,csv-event-override,999.999,25.5`;

      const eventsContent = `export const events = ${JSON.stringify(mockEventsData, null, 2)};`;
      fs.writeFileSync(mockEventsFile, eventsContent);
      fs.writeFileSync(mockCsvFile, conflictingCsv);

      const matcher = new TimestampMatcher();
      await matcher.execute(mockEventsFile, mockCsvFile);

      const modifiedContent = fs.readFileSync(mockEventsFile, 'utf-8');
      const exportMatch = modifiedContent.match(/export const events = (.*);/s);
      expect(exportMatch).toBeTruthy();

      if (exportMatch) {
        const eventsData = JSON.parse(exportMatch[1]);

        // Original properties should be preserved, not overwritten
        expect(eventsData[0].event).toBe('test-event-1'); // Not 'csv-event-override'
        expect(eventsData[0].best_lat).toBe(46.3847275); // Not 999.999

        // Non-conflicting CSV data should be added
        expect(eventsData[0]).toHaveProperty('Temperature (C)', 25.5);
      }
    });

    it('should handle backup restoration on write failure', async () => {
      const eventsContent = `export const events = ${JSON.stringify(mockEventsData, null, 2)};`;
      fs.writeFileSync(mockEventsFile, eventsContent);
      fs.writeFileSync(mockCsvFile, mockCsvData);

      // Make the events file read-only to cause write failure
      fs.chmodSync(mockEventsFile, 0o444);

      const matcher = new TimestampMatcher();

      await expect(matcher.execute(mockEventsFile, mockCsvFile)).rejects.toThrow(
        /Failed to write events file|EPERM.*operation not permitted|EACCES.*permission denied/
      );

      // Verify backup file was created
      const backupFile = mockEventsFile + '.backup';
      expect(fs.existsSync(backupFile)).toBe(true);

      // Restore write permissions for cleanup
      fs.chmodSync(mockEventsFile, 0o666);
    });

    it('should handle different timestamp formats and find closest matches', async () => {
      const csvWithDifferentTimes = `Timestamp,Temperature (C),Notes
8/9/2025 21:35:00,20.0,Early reading
8/9/2025 21:36:30,22.5,Mid reading
8/9/2025 21:38:00,26.0,Late reading`;

      const eventsContent = `export const events = ${JSON.stringify(mockEventsData, null, 2)};`;
      fs.writeFileSync(mockEventsFile, eventsContent);
      fs.writeFileSync(mockCsvFile, csvWithDifferentTimes);

      const matcher = new TimestampMatcher();
      await matcher.execute(mockEventsFile, mockCsvFile);

      const modifiedContent = fs.readFileSync(mockEventsFile, 'utf-8');
      const exportMatch = modifiedContent.match(/export const events = (.*);/s);
      expect(exportMatch).toBeTruthy();

      if (exportMatch) {
        const eventsData = JSON.parse(exportMatch[1]);

        // First event (21:37:10) should match closest CSV entry (21:36:30) - 40s diff vs 50s diff to 21:38:00
        expect(eventsData[0]).toHaveProperty('Temperature (C)', 22.5);
        expect(eventsData[0]).toHaveProperty('Notes', 'Mid reading');

        // Second event (21:36:18) should match closest CSV entry (21:36:30) - 12s diff
        expect(eventsData[1]).toHaveProperty('Temperature (C)', 22.5);
        expect(eventsData[1]).toHaveProperty('Notes', 'Mid reading');
      }
    });

    it('should handle events with no matching CSV data gracefully', async () => {
      // CSV data that doesn't match any event timestamps
      const nonMatchingCsv = `Timestamp,Temperature (C)
8/9/2025 10:00:00,15.0
8/9/2025 11:00:00,16.0`;

      const eventsContent = `export const events = ${JSON.stringify(mockEventsData, null, 2)};`;
      fs.writeFileSync(mockEventsFile, eventsContent);
      fs.writeFileSync(mockCsvFile, nonMatchingCsv);

      const matcher = new TimestampMatcher();
      await matcher.execute(mockEventsFile, mockCsvFile);

      const modifiedContent = fs.readFileSync(mockEventsFile, 'utf-8');
      const exportMatch = modifiedContent.match(/export const events = (.*);/s);
      expect(exportMatch).toBeTruthy();

      if (exportMatch) {
        const eventsData = JSON.parse(exportMatch[1]);

        // Should still find closest matches even if they're far apart
        expect(eventsData[0]).toHaveProperty('Temperature (C)');
        expect(eventsData[1]).toHaveProperty('Temperature (C)');

        // Both should get one of the available readings (closest match)
        const temps = [eventsData[0]['Temperature (C)'], eventsData[1]['Temperature (C)']];
        expect(temps.every(temp => [15.0, 16.0].includes(temp))).toBe(true);
      }
    });
  });
});
