import * as fs from 'fs';
import * as path from 'path';

interface ParsedTimestamp {
  month: string;
  day: string;
  year: string;
  hour: string;
  minute: string;
}

function parseTimestamp(timestamp: string): ParsedTimestamp | null {
  // Parse "MM/DD/YYYY HH:MM" format
  const match = timestamp.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  // Basic validation of date/time ranges
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return {
    month: match[1],
    day: match[2],
    year: match[3],
    hour: match[4],
    minute: match[5],
  };
}

function formatTimestamp(parsed: ParsedTimestamp, seconds: number): string {
  const paddedSeconds = seconds.toString().padStart(2, '0');
  return `${parsed.month}/${parsed.day}/${parsed.year} ${parsed.hour}:${parsed.minute}:${paddedSeconds}`;
}

function transformTimestamps(csvFilePath: string): void {
  console.log(`Reading CSV file: ${csvFilePath}`);

  // Read the entire file
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

  if (fileContent.trim() === '') {
    throw new Error('CSV file is empty');
  }

  const lines = fileContent.split('\n');

  // First pass: Validate all timestamps before making any changes
  console.log('Validating all timestamps...');
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines during validation
    if (!line) {
      continue;
    }

    // Split CSV line to get timestamp (first column)
    const columns = line.split(',');
    if (columns.length === 0) {
      continue;
    }

    const originalTimestamp = columns[0].trim();
    const parsed = parseTimestamp(originalTimestamp);

    if (!parsed) {
      const errorMessage = `Error: Could not parse timestamp "${originalTimestamp}" on line ${i + 1}. Processing stopped, no changes made to file.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  console.log('All timestamps validated successfully. Processing...');

  // Process header line (first line)
  const headerLine = lines[0];
  const processedLines: string[] = [headerLine];

  let currentSeconds = 5; // Start at 5 seconds for the very first entry
  let lastMinuteHour = '';
  let processedCount = 0;
  let isFirstDataEntry = true; // Track if this is the very first data entry

  // Second pass: Process data lines (skip header) - we know all data is valid now
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      processedLines.push(line);
      continue;
    }

    // Split CSV line to get timestamp (first column)
    const columns = line.split(',');
    if (columns.length === 0) {
      processedLines.push(line);
      continue;
    }

    const originalTimestamp = columns[0].trim();
    const parsed = parseTimestamp(originalTimestamp);

    // We already validated this, so parsed should never be null here
    if (!parsed) {
      throw new Error(
        `Unexpected error: Previously validated timestamp "${originalTimestamp}" on line ${i + 1} failed parsing`
      );
    }

    // Check if minute or hour changed from previous entry
    const currentMinuteHour = `${parsed.hour}:${parsed.minute}`;
    if (currentMinuteHour !== lastMinuteHour) {
      // For the very first entry, start at 5 seconds
      // For all subsequent minute/hour changes, reset to 0
      currentSeconds = isFirstDataEntry ? 5 : 0;
      lastMinuteHour = currentMinuteHour;
    }

    // Mark that we've processed the first entry
    if (isFirstDataEntry) {
      isFirstDataEntry = false;
    }

    // Create new timestamp with seconds
    const newTimestamp = formatTimestamp(parsed, currentSeconds);

    // Replace the timestamp in the first column
    columns[0] = newTimestamp;
    const newLine = columns.join(',');
    processedLines.push(newLine);

    // Increment seconds by 5 for next entry
    currentSeconds += 5;
    if (currentSeconds >= 60) {
      currentSeconds = 0;
    }

    processedCount++;

    // Show progress for large files
    if (processedCount % 1000 === 0) {
      console.log(`Processed ${processedCount} records...`);
    }
  }

  console.log(`Processed ${processedCount} total records`);

  // Write back to the same file
  const newContent = processedLines.join('\n');
  fs.writeFileSync(csvFilePath, newContent, 'utf-8');

  console.log(`Successfully updated timestamps in ${csvFilePath}`);
}

// Main execution
function main(): void {
  const args = process.argv.slice(2);

  // Default to the specific file if no argument provided
  const currentDir = path.dirname(
    decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/([a-zA-Z]:)/, '$1')
  );
  const defaultFile = path.join(currentDir, 'sava1-logger-real-all-copy.csv');
  const csvFilePath = args.length > 0 ? args[0] : defaultFile;

  // Check if file exists
  if (!fs.existsSync(csvFilePath)) {
    console.error(`Error: File not found: ${csvFilePath}`);
    process.exit(1);
  }

  try {
    transformTimestamps(csvFilePath);
  } catch (error) {
    console.error(
      `Error processing file: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}

// Run the script when executed directly
if (process.argv[1]?.endsWith('timestamp-transformer.ts')) {
  main();
}

export { formatTimestamp, parseTimestamp, transformTimestamps };
