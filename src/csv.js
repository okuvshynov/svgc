import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

export function parseCSV(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: true,
    cast_date: false
  });
  
  if (records.length === 0) {
    throw new Error('CSV file contains no data rows');
  }
  
  const headers = Object.keys(records[0]);
  return { headers, rows: records };
}

export function inferFieldTypes(data) {
  const types = {};
  
  data.headers.forEach(header => {
    const values = data.rows.map(row => row[header]).filter(v => v !== null && v !== undefined && v !== '');
    
    if (values.length === 0) {
      types[header] = 'string';
      return;
    }
    
    // Check if all values are numbers
    const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (numericValues.length === values.length) {
      types[header] = 'number';
    } else {
      types[header] = 'string';
    }
  });
  
  return types;
}

export function getNumericFields(data) {
  const types = inferFieldTypes(data);
  return data.headers.filter(header => types[header] === 'number');
}

export function getStringFields(data) {
  const types = inferFieldTypes(data);
  return data.headers.filter(header => types[header] === 'string');
}