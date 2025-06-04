// Embedded filter utilities that get loaded as strings
// This file is loaded by chart-runtime.js and embedded into SVG

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function generateEmbeddedFilterUtils() {
  // Read the filter-utils.js file and return its contents as a string
  const filterPath = join(__dirname, 'filter-utils.js');
  const filterContent = readFileSync(filterPath, 'utf8');
  
  // Remove export statements and module syntax for embedding
  return filterContent
    .replace(/export function/g, 'function')
    .replace(/export \{[^}]+\};?/g, '')
    .replace(/import \{[^}]+\} from .+;/g, '');
}