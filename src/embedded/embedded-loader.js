// Generalized loader for embedded JavaScript files
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Loads an embedded JavaScript file and returns its contents as a string
 * with module syntax removed for embedding into SVG
 * 
 * @param {string} moduleName - Name of the module to load (without .js extension)
 * @param {string} subdirectory - Optional subdirectory (e.g., 'charts')
 * @returns {string} The file contents with export/import statements removed
 */
export function loadEmbedded(moduleName, subdirectory = '') {
  const basePath = subdirectory ? join(__dirname, subdirectory) : __dirname;
  const filePath = join(basePath, `${moduleName}-impl.js`);
  
  try {
    const fileContent = readFileSync(filePath, 'utf8');
    
    // Remove export statements and module syntax for embedding
    return fileContent
      .replace(/export function/g, 'function')
      .replace(/export \{[^}]+\};?/g, '')
      .replace(/import \{[^}]+\} from .+;/g, '');
  } catch (error) {
    throw new Error(`Failed to load embedded module '${moduleName}' from '${filePath}': ${error.message}`);
  }
}

/**
 * Loads a chart module from the charts subdirectory
 * @param {string} chartName - Name of the chart (e.g., 'histogram-chart')
 * @returns {string} The chart implementation code
 */
export function loadEmbeddedChart(chartName) {
  return loadEmbedded(chartName, 'charts');
}

/**
 * Loads a utility module from the embedded directory
 * @param {string} utilName - Name of the utility module (e.g., 'chart-utils')
 * @returns {string} The utility implementation code
 */
export function loadEmbeddedUtil(utilName) {
  return loadEmbedded(utilName);
}