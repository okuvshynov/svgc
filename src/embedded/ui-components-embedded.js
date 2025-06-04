// Embedded UI components that get loaded as strings
// This file is loaded by chart-runtime.js and embedded into SVG

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function generateEmbeddedUIComponents() {
  // Read the ui-components.js file and return its contents as a string
  const uiPath = join(__dirname, 'ui-components.js');
  const uiContent = readFileSync(uiPath, 'utf8');
  
  // Remove export statements and module syntax for embedding
  return uiContent
    .replace(/export function/g, 'function')
    .replace(/export \{[^}]+\};?/g, '')
    .replace(/import \{[^}]+\} from .+;/g, '');
}