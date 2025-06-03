// Helper to test embedded JavaScript functions by evaluating them in a simulated environment
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock browser environment globals and functions that embedded code expects
export function createEmbeddedEnvironment() {
  const environment = {
    // Mock chart dimensions
    chartDimensions: {
      width: 800,
      height: 600,
      padding: 60
    },
    
    // Mock embedded data
    embeddedData: {
      headers: [],
      rows: []
    },
    
    // Mock current options
    currentOptions: {
      filters: []
    },
    
    // Mock console for log_debug
    log_debug: () => {},
    
    // Mock filter function
    applyFilters: (rows) => rows,
    
    // Mock color generation
    generateColors: (count) => {
      const colors = ['#4285f4', '#ea4335', '#fbbc04', '#34a853', '#ff6d00'];
      return Array(count).fill(0).map((_, i) => colors[i % colors.length]);
    },
    
    // Mock SVG element creation
    createSVGElement: (type, attrs) => {
      return { type, attrs, children: [], appendChild: function(child) { this.children.push(child); } };
    },
    
    // Mock formatting functions
    formatNumber: (num) => {
      if (Math.abs(num) >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      } else if (Math.abs(num) >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
      } else if (Math.abs(num) < 0.01 && num !== 0) {
        return num.toExponential(2);
      } else {
        return num.toFixed(2).replace(/\.00$/, '');
      }
    },
    
    // Mock tick generation
    generateTicks: (min, max, targetCount) => {
      const range = max - min;
      if (range === 0) return [min];
      
      const rawStep = range / targetCount;
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const normalized = rawStep / magnitude;
      
      let niceStep;
      if (normalized <= 1) niceStep = 1 * magnitude;
      else if (normalized <= 2) niceStep = 2 * magnitude;
      else if (normalized <= 2.5) niceStep = 2.5 * magnitude;
      else if (normalized <= 5) niceStep = 5 * magnitude;
      else niceStep = 10 * magnitude;
      
      const niceMin = Math.floor(min / niceStep) * niceStep;
      const niceMax = Math.ceil(max / niceStep) * niceStep;
      
      const ticks = [];
      for (let tick = niceMin; tick <= niceMax; tick += niceStep) {
        if (Math.abs(tick) < niceStep * 0.0001) tick = 0;
        ticks.push(tick);
      }
      
      return ticks;
    }
  };
  
  return environment;
}

// Load and execute embedded code in the mock environment
export function loadEmbeddedFunction(filename, functionName) {
  const filePath = join(__dirname, '..', 'src', 'embedded', 'charts', filename);
  const code = readFileSync(filePath, 'utf8');
  
  const environment = createEmbeddedEnvironment();
  
  // Create a function that executes the embedded code with our mock environment
  const executeCode = new Function(...Object.keys(environment), code + `\nreturn ${functionName};`);
  
  // Execute and return the requested function
  return executeCode(...Object.values(environment));
}