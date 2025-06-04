// Embedded chart utilities that get loaded as strings
// This file is loaded by chart-utils.js and embedded into SVG

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function generateEmbeddedChartUtils() {
  // Read the chart-utils.js file and return its contents as a string
  const utilsPath = join(__dirname, 'chart-utils.js');
  const utilsContent = readFileSync(utilsPath, 'utf8');
  
  // Remove export statements and module syntax for embedding
  return utilsContent
    .replace(/export function/g, 'function')
    .replace(/export \{[^}]+\};?/g, '')
    .replace(/import \{[^}]+\} from .+;/g, '');
}