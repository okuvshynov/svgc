import { generateCSS } from './generators/svg-elements.js';
import { generateEmbeddedChartFunctions, generateRenderingFunctions } from './embedded/chart-runtime.js';
import { generateInteractiveScript } from './embedded/interactivity.js';

export function generateSVG(data, options) {
  const { width, height } = options;
  
  // Embed the original data and chart functions as JavaScript
  const embeddedData = JSON.stringify(data);
  const embeddedOptions = JSON.stringify(options);
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  
  <defs>
    ${generateCSS()}
  </defs>
  
  <!-- Chart Title -->
  <text id="chart-title" x="${width/2}" y="25" text-anchor="middle" class="chart-title">
    ${options.xField} vs ${options.yField}
  </text>
  
  <!-- Chart Area (will be populated by JavaScript) -->
  <g id="chart-area"></g>
  
  <!-- Interactive UI Controls -->
  <g id="ui-controls"></g>
  
  <!-- Embedded Data and Chart Functions -->
  <script type="text/javascript"><![CDATA[
    // Embedded data and options
    const embeddedData = ${embeddedData};
    
    // Initialize chart state with defaults if not present
    const initialState = ${embeddedOptions};
    if (!initialState.filters) initialState.filters = [];
    if (!initialState.visibleGroups) initialState.visibleGroups = null; // null means all visible
    
    let currentOptions = initialState;
    
    // Chart state
    let currentChartData = null;
    let visibleGroups = new Set(currentOptions.visibleGroups);
    
    // Debug logging function
    function log_debug(...args) {
      if (currentOptions.debug) {
        console.log('[DEBUG]', ...args);
      }
    }
    
    // Chart dimensions (account for left control panel)
    const chartDimensions = {
      width: ${width},
      height: ${height},
      padding: 60  // Standard padding, control panel handled separately
    };
    
    ${generateEmbeddedChartFunctions()}
    
    ${generateRenderingFunctions()}
    
    ${generateInteractiveScript()}
  ]]></script>
</svg>`;

  return svg;
}

