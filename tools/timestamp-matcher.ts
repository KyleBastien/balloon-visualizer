import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types
interface CsvRow {
  timestamp: Date;
  [key: string]: string | number | Date;
}

interface Event {
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
  [key: string]: string | number | Date;
}

interface MatchResult {
  event: Event;
  csvRow: CsvRow | null;
  timeDelta: number; // milliseconds
}

class TimestampMatcher {
  private csvData: CsvRow[] = [];
  private events: Event[] = [];
  private eventsFilePath: string = '';

  /**
   * Parse CSV timestamp from "MM/DD/YYYY HH:MM:SS" format to UTC Date
   */
  private parseCsvTimestamp(timestamp: string): Date {
    // Handle format like "8/9/2025 17:16:05"
    const [datePart, timePart] = timestamp.trim().split(' ');
    if (!datePart || !timePart) {
      throw new Error(`Invalid timestamp format: ${timestamp}`);
    }

    const [month, day, year] = datePart.split('/').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);

    if (
      isNaN(month) ||
      isNaN(day) ||
      isNaN(year) ||
      isNaN(hour) ||
      isNaN(minute) ||
      isNaN(second)
    ) {
      throw new Error(`Invalid timestamp components: ${timestamp}`);
    }

    // Create UTC date
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date created from: ${timestamp}`);
    }

    return date;
  }

  /**
   * Parse ISO8601 timestamp to UTC Date
   */
  private parseIso8601Timestamp(timestamp: string): Date {
    // Handle format like "2025-08-09T21:37:10"
    // Ensure it's treated as UTC by appending Z if not present
    const utcTimestamp =
      timestamp.includes('Z') || timestamp.includes('+') || timestamp.includes('-', 10)
        ? timestamp
        : timestamp + 'Z';

    const date = new Date(utcTimestamp);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid ISO8601 timestamp: ${timestamp}`);
    }

    return date;
  }

  /**
   * Load and parse CSV data
   */
  private loadCsvData(mockCsvFile?: string): void {
    const csvFilePath = mockCsvFile || path.join(__dirname, 'sava1-logger-real-all-copy.csv');

    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }

    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const timestampIndex = headers.findIndex(h => h.toLowerCase().includes('timestamp'));

    if (timestampIndex === -1) {
      throw new Error('CSV file must have a timestamp column');
    }

    this.csvData = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',');
        if (values.length !== headers.length) {
          console.warn(`Skipping malformed CSV row ${i + 1}: incorrect column count`);
          continue;
        }

        const row: CsvRow = {
          timestamp: this.parseCsvTimestamp(values[timestampIndex].trim()),
        };

        // Add all other columns
        headers.forEach((header, index) => {
          if (index !== timestampIndex) {
            const value = values[index].trim();
            // Try to parse as number, otherwise keep as string
            const numValue = Number(value);
            row[header] = value !== '' && !isNaN(numValue) ? numValue : value;
          }
        });

        this.csvData.push(row);
      } catch (error) {
        console.warn(`Skipping malformed CSV row ${i + 1}: ${error.message}`);
      }
    }

    if (this.csvData.length === 0) {
      throw new Error('No valid CSV data rows found');
    }

    console.log(`Loaded ${this.csvData.length} CSV rows`);
  }

  /**
   * Load events data
   */
  private async loadEventsData(fileToRead: string): Promise<Event[]> {
    // Handle both absolute and relative paths
    const eventsFilePath = path.isAbsolute(fileToRead)
      ? fileToRead
      : path.join(__dirname, fileToRead);

    if (!fs.existsSync(eventsFilePath)) {
      throw new Error(`Events file not found: ${eventsFilePath}`);
    }

    try {
      if (path.isAbsolute(fileToRead)) {
        // For absolute paths (used in tests), read file and parse ES module syntax
        const fileContent = fs.readFileSync(eventsFilePath, 'utf-8');

        // Extract the events array using regex
        const exportMatch = fileContent.match(/export\s+const\s+events\s*=\s*(\[[\s\S]*?\]);?/);
        if (!exportMatch) {
          throw new Error('Events file must export a const events array');
        }

        try {
          const events = JSON.parse(exportMatch[1]);

          if (!Array.isArray(events) || events.length === 0) {
            throw new Error('Events file must export a non-empty array named "events"');
          }

          return events;
        } catch (parseError) {
          throw new Error(
            `Failed to parse events array: ${parseError instanceof Error ? parseError.message : String(parseError)}`
          );
        }
      } else {
        // For relative paths, use dynamic import
        const fileUrl = pathToFileURL(eventsFilePath).href;
        const module = await import(fileUrl);

        if (!module.events || !Array.isArray(module.events) || module.events.length === 0) {
          throw new Error('Events file must export a non-empty array named "events"');
        }

        return module.events;
      }
    } catch (importError) {
      throw new Error(
        `Failed to load events data: ${importError instanceof Error ? importError.message : String(importError)}`
      );
    }
  }

  /**
   * Find the closest CSV row for a given event timestamp
   */
  private findClosestCsvRow(eventTimestamp: Date): { csvRow: CsvRow | null; timeDelta: number } {
    if (this.csvData.length === 0) {
      return { csvRow: null, timeDelta: Infinity };
    }

    let closestRow: CsvRow | null = null;
    let minDelta = Infinity;

    for (const csvRow of this.csvData) {
      const delta = Math.abs(csvRow.timestamp.getTime() - eventTimestamp.getTime());
      if (delta < minDelta) {
        minDelta = delta;
        closestRow = csvRow;
      }
    }

    return { csvRow: closestRow, timeDelta: minDelta };
  }

  /**
   * Match events with CSV data
   */
  private matchEventsWithCsv(): MatchResult[] {
    const results: MatchResult[] = [];

    for (const event of this.events) {
      const eventTimestamp = this.parseIso8601Timestamp(event['Best location ISO8601']);
      const { csvRow, timeDelta } = this.findClosestCsvRow(eventTimestamp);

      results.push({
        event,
        csvRow,
        timeDelta,
      });
    }

    return results;
  }

  /**
   * Merge CSV data into events
   */
  private mergeData(matchResults: MatchResult[]): Event[] {
    const enrichedEvents: Event[] = [];

    for (const result of matchResults) {
      const enrichedEvent = { ...result.event };

      if (result.csvRow) {
        // Add all CSV columns except timestamp
        Object.keys(result.csvRow).forEach(key => {
          if (key !== 'timestamp' && result.csvRow) {
            // Avoid overwriting existing event properties
            if (!(key in enrichedEvent)) {
              enrichedEvent[key] = result.csvRow[key];
            } else {
              console.warn(`Skipping CSV column "${key}" - already exists in event`);
            }
          }
        });
      } else {
        console.warn(`No CSV match found for event ${enrichedEvent.event}`);
      }

      enrichedEvents.push(enrichedEvent);
    }

    return enrichedEvents;
  }

  /**
   * Generate statistics report
   */
  private generateReport(matchResults: MatchResult[]): void {
    const matched = matchResults.filter(r => r.csvRow !== null);
    const unmatched = matchResults.filter(r => r.csvRow === null);

    console.log('\n=== Timestamp Matching Report ===');
    console.log(`Total events: ${matchResults.length}`);
    console.log(`Matched events: ${matched.length}`);
    console.log(`Unmatched events: ${unmatched.length}`);

    if (matched.length > 0) {
      const deltas = matched.map(r => r.timeDelta);
      const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      const maxDelta = Math.max(...deltas);
      const minDelta = Math.min(...deltas);

      console.log(`\nTime Delta Statistics (milliseconds):`);
      console.log(`  Average: ${avgDelta.toFixed(2)}`);
      console.log(`  Minimum: ${minDelta}`);
      console.log(`  Maximum: ${maxDelta}`);
      console.log(`  Average (seconds): ${(avgDelta / 1000).toFixed(2)}`);
    }

    if (unmatched.length > 0) {
      console.log(`\nUnmatched events:`);
      unmatched.forEach(r => {
        console.log(`  - ${r.event.event} (${r.event['Best location ISO8601']})`);
      });
    }
  }

  /**
   * Write enriched events back to the events.ts file
   */
  private writeEventsFile(enrichedEvents: Event[]): void {
    // Create backup
    const backupPath = this.eventsFilePath + '.backup';
    fs.copyFileSync(this.eventsFilePath, backupPath);
    console.log(`Created backup: ${backupPath}`);

    // Generate new events.ts content
    const eventsContent = `export const events = ${JSON.stringify(enrichedEvents, null, 2)};
`;

    try {
      fs.writeFileSync(this.eventsFilePath, eventsContent, 'utf8');
      console.log(`Successfully updated ${this.eventsFilePath}`);
    } catch (error) {
      // Restore from backup if write fails
      fs.copyFileSync(backupPath, this.eventsFilePath);
      throw new Error(
        `Failed to write events file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Main execution function
   */
  async execute(mockFile?: string, mockCsvFile?: string): Promise<void> {
    const fileToRead = mockFile || '../src/events.ts';

    // Store the resolved file path for later use
    this.eventsFilePath = path.isAbsolute(fileToRead)
      ? fileToRead
      : path.join(__dirname, fileToRead);

    try {
      console.log('Starting timestamp matching process...');

      // Load data
      this.loadCsvData(mockCsvFile);
      this.events = await this.loadEventsData(fileToRead);

      // Perform matching
      console.log('Matching timestamps...');
      const matchResults = this.matchEventsWithCsv();

      // Merge data
      console.log('Merging data...');
      const enrichedEvents = this.mergeData(matchResults);

      // Validate enriched data
      if (enrichedEvents.length !== this.events.length) {
        throw new Error('Enriched events count does not match original events count');
      }

      // Generate report
      this.generateReport(matchResults);

      // Write to file
      console.log('\nWriting enriched events to file...');
      this.writeEventsFile(enrichedEvents);

      console.log('Timestamp matching completed successfully!');
    } catch (error) {
      console.error('Error during timestamp matching:', error.message);
      throw error;
    }
  }
}

// Export for testing
export { TimestampMatcher };

// Run the script when executed directly
if (process.argv[1]?.endsWith('timestamp-matcher.ts')) {
  const matcher = new TimestampMatcher();
  matcher.execute().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}
