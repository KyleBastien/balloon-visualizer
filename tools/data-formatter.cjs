/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// Path to the CSV file
const csvFilePath = path.join(__dirname, 'remote_balloon_data.csv');

// Read the CSV file
const csvData = fs.readFileSync(csvFilePath, 'utf8');

// Convert CSV to an array of objects
function parseCSV(csv) {
  const rows = csv.trim().split('\n');
  const headers = rows.shift().split(',');

  return rows.map(row => {
    const values = row.split(',');
    const obj = {};

    headers.forEach((header, index) => {
      obj[header.trim()] = isNaN(values[index]) ? values[index].trim() : parseFloat(values[index]);
    });

    return obj;
  });
}

// Convert CSV data to JavaScript array of objects
const events = parseCSV(csvData);

// Generate the TypeScript array code
const tsArrayCode = `export const events = ${JSON.stringify(events, null, 2)};`;

// Output the TypeScript array to a file
const filePath = path.join(__dirname, '..', 'src', 'events.ts');
fs.writeFileSync(filePath, tsArrayCode, 'utf8');

console.log(`TypeScript array has been written to ${filePath}`);
