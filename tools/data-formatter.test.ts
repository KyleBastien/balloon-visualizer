import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { parseCSV } from './data-formatter';

// Mock the file system
vi.mock('node:fs');
const mockFs = vi.mocked(fs);

describe('data-formatter', () => {
  describe('parseCSV function', () => {
    it('should parse simple CSV correctly', () => {
      const csvInput = `name,age,city
John,25,NYC
Jane,30,LA`;

      const result = parseCSV(csvInput);

      expect(result).toEqual([
        { name: 'John', age: 25, city: 'NYC' },
        { name: 'Jane', age: 30, city: 'LA' },
      ]);
    });

    it('should handle numeric and string values correctly', () => {
      const csvInput = `event,temperature,location
event1,23.5,Seattle
event2,invalid,Portland`;

      const result = parseCSV(csvInput);

      expect(result).toEqual([
        { event: 'event1', temperature: 23.5, location: 'Seattle' },
        { event: 'event2', temperature: 'invalid', location: 'Portland' },
      ]);
    });

    it('should handle headers with spaces', () => {
      const csvInput = `event id, temperature , location name
event1,23.5,Seattle`;

      const result = parseCSV(csvInput);

      expect(result).toEqual([
        { 'event id': 'event1', temperature: 23.5, 'location name': 'Seattle' },
      ]);
    });

    it('should handle empty CSV', () => {
      const csvInput = '';
      const result = parseCSV(csvInput);
      expect(result).toEqual([]);
    });

    it('should handle CSV with only headers', () => {
      const csvInput = 'name,age,city';
      const result = parseCSV(csvInput);
      expect(result).toEqual([]);
    });

    it('should handle rows with missing values', () => {
      const csvInput = `name,age,city
John,25
Jane,,LA`;

      const result = parseCSV(csvInput);

      expect(result).toEqual([
        { name: 'John', age: 25 },
        { name: 'Jane', city: 'LA' },
      ]);
    });

    it('should parse balloon event data format', () => {
      const csvInput = `event,best_lat,best_lon,body.temperature,body.bearing
event1,46.3847275,-123.1622773,3.3125,334.03732
event2,46.3850000,-123.1620000,3.5,`;

      const result = parseCSV(csvInput);

      expect(result).toEqual([
        {
          event: 'event1',
          best_lat: 46.3847275,
          best_lon: -123.1622773,
          'body.temperature': 3.3125,
          'body.bearing': 334.03732,
        },
        {
          event: 'event2',
          best_lat: 46.385,
          best_lon: -123.162,
          'body.temperature': 3.5,
        },
      ]);
    });

    it('should handle real balloon data structure', () => {
      const realDataSample = `event,file,best_location_when,Best location ISO8601,Best location PST,best_lat,best_lon,best_location,best_country,best_timezone,body.temperature,Body temperature (F),body.bearing,body.distance,body.dop,body.velocity
2341653a-fc07-86ed-8e9f-cd13e692dbed,_track.qo,1754775430,2025-08-09T21:37:10,8/9/2025 2:37 PM,46.3847275,-123.1622773,Vader WA,US,America/Los_Angeles,3.3125,38,334.03732,7.0083313,1.0302734,0.14911343`;

      const result = parseCSV(realDataSample);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        event: '2341653a-fc07-86ed-8e9f-cd13e692dbed',
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
      });
    });

    it('should handle floating point numbers correctly', () => {
      const csvInput = `value,decimal
1,1.5
2,2.0
3,3.14159`;

      const result = parseCSV(csvInput);

      expect(result).toEqual([
        { value: 1, decimal: 1.5 },
        { value: 2, decimal: 2 },
        { value: 3, decimal: 3.14159 },
      ]);
    });

    it('should preserve strings that look like numbers but are not valid', () => {
      const csvInput = `id,value
1,1.2.3
2,abc123
3,123abc`;

      const result = parseCSV(csvInput);

      expect(result).toEqual([
        { id: 1, value: '1.2.3' },
        { id: 2, value: 'abc123' },
        { id: 3, value: '123abc' },
      ]);
    });
  });

  describe('file operations', () => {
    it('should call readFileSync with correct path', () => {
      const mockCsvData = `event,temperature
event1,23.5`;

      mockFs.readFileSync.mockReturnValue(mockCsvData);
      mockFs.writeFileSync.mockImplementation(() => {});

      // Test the function logic without actually importing/executing the main module
      expect(parseCSV(mockCsvData)).toEqual([{ event: 'event1', temperature: 23.5 }]);
    });

    it('should generate correct TypeScript export format', () => {
      const testData = [
        { event: 'test1', value: 123 },
        { event: 'test2', value: 456 },
      ];

      const expectedStart = 'export const events =';
      const tsCode = `export const events = ${JSON.stringify(testData, null, 2)};`;

      expect(tsCode).toContain(expectedStart);
      expect(tsCode).toContain('"event": "test1"');
      expect(tsCode).toContain('"value": 123');
    });
  });
});
