import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatTimestamp, parseTimestamp, transformTimestamps } from './timestamp-transformer';

describe('Timestamp Transformer', () => {
  describe('parseTimestamp', () => {
    it('should parse valid MM/DD/YYYY HH:MM format', () => {
      const result = parseTimestamp('8/9/2025 17:16');
      expect(result).toEqual({
        month: '8',
        day: '9',
        year: '2025',
        hour: '17',
        minute: '16',
      });
    });

    it('should parse valid MM/DD/YYYY HH:MM format with leading zeros', () => {
      const result = parseTimestamp('08/09/2025 07:06');
      expect(result).toEqual({
        month: '08',
        day: '09',
        year: '2025',
        hour: '07',
        minute: '06',
      });
    });

    it('should parse single digit month and day', () => {
      const result = parseTimestamp('1/5/2025 23:59');
      expect(result).toEqual({
        month: '1',
        day: '5',
        year: '2025',
        hour: '23',
        minute: '59',
      });
    });

    it('should return null for invalid formats', () => {
      expect(parseTimestamp('invalid')).toBeNull();
      expect(parseTimestamp('2025-08-09 17:16')).toBeNull();
      expect(parseTimestamp('8/9/2025')).toBeNull();
      expect(parseTimestamp('8/9/2025 17:16:30')).toBeNull();
      expect(parseTimestamp('')).toBeNull();
    });

    it('should return null for malformed dates', () => {
      expect(parseTimestamp('13/40/2025 25:70')).toBeNull();
      expect(parseTimestamp('abc/def/ghij kl:mn')).toBeNull();
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp with seconds', () => {
      const parsed = {
        month: '8',
        day: '9',
        year: '2025',
        hour: '17',
        minute: '16',
      };

      expect(formatTimestamp(parsed, 0)).toBe('8/9/2025 17:16:00');
      expect(formatTimestamp(parsed, 5)).toBe('8/9/2025 17:16:05');
      expect(formatTimestamp(parsed, 30)).toBe('8/9/2025 17:16:30');
      expect(formatTimestamp(parsed, 55)).toBe('8/9/2025 17:16:55');
    });

    it('should pad single digit seconds with zero', () => {
      const parsed = {
        month: '1',
        day: '1',
        year: '2025',
        hour: '0',
        minute: '00',
      };

      expect(formatTimestamp(parsed, 5)).toBe('1/1/2025 0:00:05');
      expect(formatTimestamp(parsed, 0)).toBe('1/1/2025 0:00:00');
    });
  });

  describe('transformTimestamps integration', () => {
    let tempDir: string;
    let testFilePath: string;

    beforeEach(() => {
      // Create a temporary directory for test files
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'timestamp-test-'));
      testFilePath = path.join(tempDir, 'test.csv');
    });

    afterEach(() => {
      // Clean up temporary files
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should transform timestamps within the same minute', () => {
      const csvContent = `Timestamp,Temperature (C),Humidity (%)
8/9/2025 17:16,21.39,69.71
8/9/2025 17:16,21.58,69.77
8/9/2025 17:16,21.64,69.94
8/9/2025 17:16,21.70,69.41`;

      fs.writeFileSync(testFilePath, csvContent);
      transformTimestamps(testFilePath);

      const result = fs.readFileSync(testFilePath, 'utf-8');
      const lines = result.split('\n');

      expect(lines[0]).toBe('Timestamp,Temperature (C),Humidity (%)');
      expect(lines[1]).toBe('8/9/2025 17:16:05,21.39,69.71'); // First entry starts at :05
      expect(lines[2]).toBe('8/9/2025 17:16:10,21.58,69.77');
      expect(lines[3]).toBe('8/9/2025 17:16:15,21.64,69.94');
      expect(lines[4]).toBe('8/9/2025 17:16:20,21.70,69.41');
    });

    it('should reset seconds when minute changes', () => {
      const csvContent = `Timestamp,Temperature (C)
8/9/2025 17:16,21.95
8/9/2025 17:16,21.98
8/9/2025 17:17,22.00
8/9/2025 17:17,22.03`;

      fs.writeFileSync(testFilePath, csvContent);
      transformTimestamps(testFilePath);

      const result = fs.readFileSync(testFilePath, 'utf-8');
      const lines = result.split('\n');

      expect(lines[1]).toBe('8/9/2025 17:16:05,21.95'); // First entry starts at :05
      expect(lines[2]).toBe('8/9/2025 17:16:10,21.98');
      expect(lines[3]).toBe('8/9/2025 17:17:00,22.00'); // Reset to :00 when minute changes
      expect(lines[4]).toBe('8/9/2025 17:17:05,22.03');
    });

    it('should handle seconds rollover within the same minute', () => {
      const csvContent = `Timestamp,Data
8/9/2025 17:16,1
8/9/2025 17:16,2
8/9/2025 17:16,3
8/9/2025 17:16,4
8/9/2025 17:16,5
8/9/2025 17:16,6
8/9/2025 17:16,7
8/9/2025 17:16,8
8/9/2025 17:16,9
8/9/2025 17:16,10
8/9/2025 17:16,11
8/9/2025 17:16,12
8/9/2025 17:16,13`;

      fs.writeFileSync(testFilePath, csvContent);
      transformTimestamps(testFilePath);

      const result = fs.readFileSync(testFilePath, 'utf-8');
      const lines = result.split('\n');

      // Check that seconds go: 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 00 (rollover)
      expect(lines[1]).toBe('8/9/2025 17:16:05,1'); // First entry starts at :05
      expect(lines[11]).toBe('8/9/2025 17:16:55,11');
      expect(lines[12]).toBe('8/9/2025 17:16:00,12'); // Should rollover to 00
      expect(lines[13]).toBe('8/9/2025 17:16:05,13'); // Should rollover to 05
    });

    it('should handle hour changes', () => {
      const csvContent = `Timestamp,Data
8/9/2025 17:59,1
8/9/2025 17:59,2
8/9/2025 18:00,3
8/9/2025 18:00,4`;

      fs.writeFileSync(testFilePath, csvContent);
      transformTimestamps(testFilePath);

      const result = fs.readFileSync(testFilePath, 'utf-8');
      const lines = result.split('\n');

      expect(lines[1]).toBe('8/9/2025 17:59:05,1'); // First entry starts at :05
      expect(lines[2]).toBe('8/9/2025 17:59:10,2');
      expect(lines[3]).toBe('8/9/2025 18:00:00,3'); // Reset to :00 when hour changes
      expect(lines[4]).toBe('8/9/2025 18:00:05,4');
    });

    it('should skip empty lines and preserve them', () => {
      const csvContent = `Timestamp,Data
8/9/2025 17:16,1

8/9/2025 17:16,2
`;

      fs.writeFileSync(testFilePath, csvContent);
      transformTimestamps(testFilePath);

      const result = fs.readFileSync(testFilePath, 'utf-8');
      const lines = result.split('\n');

      expect(lines[0]).toBe('Timestamp,Data');
      expect(lines[1]).toBe('8/9/2025 17:16:05,1'); // First entry starts at :05
      expect(lines[2]).toBe(''); // Empty line preserved
      expect(lines[3]).toBe('8/9/2025 17:16:10,2');
      expect(lines[4]).toBe(''); // Trailing empty line preserved
    });

    it('should throw error and make no changes when malformed timestamps are found', () => {
      const csvContent = `Timestamp,Data
8/9/2025 17:16,1
invalid-timestamp,2
8/9/2025 17:16,3`;

      fs.writeFileSync(testFilePath, csvContent);

      // Capture console.error to verify error is logged
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Expect the function to throw an error
      expect(() => transformTimestamps(testFilePath)).toThrow(
        'Error: Could not parse timestamp "invalid-timestamp" on line 3. Processing stopped, no changes made to file.'
      );

      // Verify the file was not modified (original content preserved)
      const result = fs.readFileSync(testFilePath, 'utf-8');
      expect(result).toBe(csvContent);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error: Could not parse timestamp "invalid-timestamp" on line 3. Processing stopped, no changes made to file.'
      );

      consoleSpy.mockRestore();
    });

    it('should validate all data before making any changes', () => {
      const csvContent = `Timestamp,Data
8/9/2025 17:16,1
8/9/2025 17:16,2
invalid-timestamp,3
8/9/2025 17:16,4`;

      fs.writeFileSync(testFilePath, csvContent);

      // Store original content to verify it's unchanged
      const originalContent = fs.readFileSync(testFilePath, 'utf-8');

      // Expect the function to throw an error during validation
      expect(() => transformTimestamps(testFilePath)).toThrow();

      // Verify the file was not modified at all (even the valid entries weren't processed)
      const resultContent = fs.readFileSync(testFilePath, 'utf-8');
      expect(resultContent).toBe(originalContent);
    });

    it('should handle files with only headers', () => {
      const csvContent = 'Timestamp,Data';
      fs.writeFileSync(testFilePath, csvContent);

      transformTimestamps(testFilePath);

      const result = fs.readFileSync(testFilePath, 'utf-8');
      expect(result).toBe('Timestamp,Data');
    });

    it('should throw error for empty files', () => {
      fs.writeFileSync(testFilePath, '');

      expect(() => transformTimestamps(testFilePath)).toThrow('CSV file is empty');
    });

    it('should preserve CSV structure with multiple columns', () => {
      const csvContent = `Timestamp,Temperature (C),Humidity (%),Pressure (hPa),Notes
8/9/2025 17:16,21.39,69.71,1022.55,"First reading"
8/9/2025 17:16,21.58,69.77,1022.60,"Second reading, with comma"`;

      fs.writeFileSync(testFilePath, csvContent);
      transformTimestamps(testFilePath);

      const result = fs.readFileSync(testFilePath, 'utf-8');
      const lines = result.split('\n');

      expect(lines[1]).toBe('8/9/2025 17:16:05,21.39,69.71,1022.55,"First reading"'); // First entry starts at :05
      expect(lines[2]).toBe('8/9/2025 17:16:10,21.58,69.77,1022.60,"Second reading, with comma"');
    });
  });
});
