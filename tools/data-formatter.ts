import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the CSV file
const csvFilePath = path.join(__dirname, 'remote_balloon_data.csv');

// Read the CSV file
const csvData = fs.readFileSync(csvFilePath, 'utf8');

// Type for parsed CSV row
interface CsvRow {
  [key: string]: string | number;
}

// Convert CSV to an array of objects
export function parseCSV(csv: string): CsvRow[] {
  const rows = csv.trim().split('\n');
  const headers = rows.shift()?.split(',') || [];

  return rows.map(row => {
    const values = row.split(',');
    const obj: CsvRow = {};

    headers.forEach((header, index) => {
      const value = values[index];
      if (value !== undefined && value.trim() !== '') {
        const trimmedValue = value.trim();
        obj[header.trim()] = isNaN(Number(trimmedValue)) ? trimmedValue : parseFloat(trimmedValue);
      }
    });

    return obj;
  });
}

// Main execution function
export function main() {
  // Convert CSV data to JavaScript array of objects
  const events = parseCSV(csvData);

  // Generate the TypeScript array code
  const tsArrayCode = `export const events = ${JSON.stringify(events, null, 2)};`;

  // Output the TypeScript array to a file
  const filePath = path.join(__dirname, '..', 'src', 'events.ts');
  fs.writeFileSync(filePath, tsArrayCode, 'utf8');

  console.log(`TypeScript array has been written to ${filePath}`);
  console.log(`Processed ${events.length} events`);
}

// Only run if this file is being executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
