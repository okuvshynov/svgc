#!/usr/bin/env node

import { parseCSV, getNumericFields } from './csv.js';
import { generateScatterChart } from './charts/scatter.js';
import { generateSVG } from './svg.js';
import { writeFileSync } from 'fs';
import { basename } from 'path';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    width: 800,
    height: 600,
    output: null,
    xField: null,
    yField: null,
    weightField: null,
    groupField: null
  };
  
  let inputFile = null;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-w' || arg === '--width') {
      options.width = parseInt(args[++i]);
    } else if (arg === '-h' || arg === '--height') {
      options.height = parseInt(args[++i]);
    } else if (arg === '-o' || arg === '--output') {
      options.output = args[++i];
    } else if (arg === '-x' || arg === '--x-field') {
      options.xField = args[++i];
    } else if (arg === '-y' || arg === '--y-field') {
      options.yField = args[++i];
    } else if (arg === '-s' || arg === '--size-field') {
      options.weightField = args[++i];
    } else if (arg === '-g' || arg === '--group-field') {
      options.groupField = args[++i];
    } else if (arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (!inputFile && !arg.startsWith('-')) {
      inputFile = arg;
    }
  }
  
  if (!inputFile) {
    console.error('Error: Input CSV file is required');
    printHelp();
    process.exit(1);
  }
  
  return { options, inputFile };
}

function printHelp() {
  console.log(`
Usage: svgc [options] <csv-file>

Generate interactive SVG charts from CSV data.

Options:
  -w, --width <pixels>      Chart width (default: 800)
  -h, --height <pixels>     Chart height (default: 600)
  -o, --output <file>       Output SVG file (default: stdout)
  -x, --x-field <field>     Field to use for X axis
  -y, --y-field <field>     Field to use for Y axis
  -s, --size-field <field>  Field to use for point sizes (optional)
  -g, --group-field <field> Field to use for grouping/colors (optional)
  --help                    Show this help message

Examples:
  svgc data.csv > chart.svg
  svgc -w 1024 -h 768 data.csv -o chart.svg
  svgc -x time -y value -g category data.csv
`);
}

function main() {
  try {
    const { options, inputFile } = parseArgs();
    
    // Parse CSV data
    console.error(`Reading CSV file: ${inputFile}`);
    const data = parseCSV(inputFile);
    console.error(`Loaded ${data.rows.length} rows with ${data.headers.length} columns`);
    
    // Get numeric fields for default axis selection
    const numericFields = getNumericFields(data);
    console.error(`Numeric fields: ${numericFields.join(', ')}`);
    
    // Auto-select fields if not specified
    if (!options.xField && numericFields.length > 0) {
      options.xField = numericFields[0];
      console.error(`Auto-selected X field: ${options.xField}`);
    }
    
    if (!options.yField && numericFields.length > 1) {
      options.yField = numericFields[1];
      console.error(`Auto-selected Y field: ${options.yField}`);
    }
    
    if (!options.xField || !options.yField) {
      console.error('Error: Need at least 2 numeric fields for scatter plot');
      console.error('Available fields:', data.headers.join(', '));
      process.exit(1);
    }
    
    // Generate chart data
    console.error(`Generating scatter plot: ${options.xField} vs ${options.yField}`);
    const chartData = generateScatterChart(data, options);
    
    // Generate SVG
    const svg = generateSVG(chartData, data, options);
    
    // Output
    if (options.output) {
      writeFileSync(options.output, svg);
      console.error(`Chart saved to: ${options.output}`);
    } else {
      console.log(svg);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();