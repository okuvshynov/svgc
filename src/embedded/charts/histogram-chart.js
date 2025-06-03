// Embedded histogram chart functions that run in the browser
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function generateEmbeddedHistogramChart() {
  const embeddedCode = readFileSync(join(__dirname, 'histogram-chart-embedded.js'), 'utf8');
  return embeddedCode;
}