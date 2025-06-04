// This file contains JavaScript code that gets embedded into SVG files
// and runs in the browser to provide interactivity

import { loadEmbeddedChart, loadEmbeddedUtil } from './embedded-loader.js';

export function generateEmbeddedChartFunctions() {
  return `
    // Chart generation functions embedded in SVG
    
    ${loadEmbeddedUtil('chart-utils')}
    
    ${loadEmbeddedUtil('filter-utils')}
    
    ${loadEmbeddedUtil('ui-components')}
    
    ${loadEmbeddedUtil('filters')}
    
    ${loadEmbeddedUtil('render-ui')}
    
    // Filter management
    let pendingFilters = [...(currentOptions.filters || [])];
    
    ${loadEmbeddedChart('scatter-chart')}
    
    ${loadEmbeddedChart('histogram-chart')}
    
    // Chart registry - defined after the chart functions are available
    const chartTypes = {
      scatter: {
        generate: generateScatterChart,
        render: renderScatterChart,
        renderControls: renderScatterControls
      },
      histogram: {
        generate: generateHistogram,
        render: renderHistogramChart,
        renderControls: renderHistogramControls
      }
    };
  `;
}

export function generateRenderingFunctions() {
  return ``;
}
