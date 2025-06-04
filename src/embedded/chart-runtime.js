// This file contains JavaScript code that gets embedded into SVG files
// and runs in the browser to provide interactivity

import { generateEmbeddedScatterChart } from './charts/scatter-chart.js';
import { generateEmbeddedHistogramChart } from './charts/histogram-chart.js';
import { generateEmbeddedChartUtils } from './chart-utils-embedded.js';
import { generateEmbeddedFilterUtils } from './filter-utils-embedded.js';
import { generateEmbeddedUIComponents } from './ui-components-embedded.js';

export function generateEmbeddedChartFunctions() {
  return `
    // Chart generation functions embedded in SVG
    
    ${generateEmbeddedChartUtils()}
    
    ${generateEmbeddedFilterUtils()}
    
    ${generateEmbeddedUIComponents()}
    
    // Filter management
    let pendingFilters = [...(currentOptions.filters || [])];
    
    function applyFilters(rows) {
      if (!currentOptions.filters || currentOptions.filters.length === 0) {
        return rows;
      }
      
      return rows.filter(row => {
        return currentOptions.filters.every(filter => evaluateFilter(row, filter));
      });
    }
    
    function addFilter() {
      const allFields = Object.keys(embeddedData.rows[0]);
      const newFilter = createNewFilter(allFields);
      pendingFilters.push(newFilter);
      renderUIControls();
    }
    
    function removeFilter(filterId) {
      // Remove from pending filters
      pendingFilters = pendingFilters.filter(f => f.id !== filterId);
      
      // Also remove from applied filters if it exists there
      const wasApplied = currentOptions.filters && 
        currentOptions.filters.some(f => f.id === filterId);
      
      if (wasApplied) {
        // Update applied filters
        currentOptions.filters = currentOptions.filters.filter(f => f.id !== filterId);
        // Re-render chart with updated filters
        renderChartContent();
      }
      
      // Always re-render UI controls
      renderUIControls();
    }
    
    function updateFilter(filterId, property, value) {
      const filter = pendingFilters.find(f => f.id === filterId);
      if (filter) {
        filter[property] = value;
        // Don't re-render UI controls to avoid losing focus
      }
    }
    
    function applyPendingFilters() {
      log_debug('Applying filters:', pendingFilters);
      // Save pending filters to current options (deep copy to preserve IDs)
      currentOptions.filters = pendingFilters.map(f => ({ ...f }));
      renderChartContent();
      renderUIControls();
    }
    
    function clearAllFilters() {
      pendingFilters = [];
      currentOptions.filters = [];
      renderChartContent();
      renderUIControls();
    }
    
    ${generateEmbeddedScatterChart()}
    
    ${generateEmbeddedHistogramChart()}
    
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
  return `
    function renderUIControls() {
      const controlsContainer = document.getElementById('ui-controls');
      controlsContainer.innerHTML = '';
      
      // Control panel dimensions - made wider for filtering
      const panelWidth = 220;
      const panelX = 10;
      const panelY = 50;
      
      // Draw control panel background
      const panelBg = createSVGElement('rect', {
        x: panelX,
        y: panelY,
        width: panelWidth,
        height: chartDimensions.height - panelY - 20,
        fill: '#f8f9fa',
        stroke: '#dee2e6',
        'stroke-width': 1,
        rx: 6
      });
      controlsContainer.appendChild(panelBg);
      
      // Panel title
      const panelTitle = createSVGElement('text', {
        x: panelX + panelWidth / 2,
        y: panelY + 20,
        class: 'ui-label',
        'text-anchor': 'middle',
        style: 'font-weight: bold; font-size: 14px;'
      });
      panelTitle.textContent = 'Chart Controls';
      controlsContainer.appendChild(panelTitle);
      
      let currentY = panelY + 50;
      
      // Chart type selector
      const chartTypeOptions = ['scatter', 'histogram'];
      const chartTypeGroup = createUIGroup(panelX + 10, currentY, 'Chart Type:', 
        currentOptions.chartType || 'scatter', chartTypeOptions, (type) => {
        currentOptions.chartType = type;
        renderChart(); // This will re-render both UI controls and chart content
      });
      controlsContainer.appendChild(chartTypeGroup);
      currentY += 50;
      
      // Render chart-specific controls
      const chartType = currentOptions.chartType || 'scatter';
      const chartHandler = chartTypes[chartType];
      
      if (chartHandler && chartHandler.renderControls) {
        chartHandler.renderControls(controlsContainer, panelX + 10, currentY, panelWidth - 20);
      }
    }
    
    
    function renderFiltersSection(container, x, y, width) {
      // Filters header
      const filtersHeader = createSVGElement('text', {
        x: x,
        y: y,
        class: 'ui-label',
        style: 'font-weight: bold; font-size: 14px;'
      });
      filtersHeader.textContent = 'Filters';
      container.appendChild(filtersHeader);
      
      let currentY = y + 25;
      
      // Render existing filters
      pendingFilters.forEach((filter, index) => {
        const filterGroup = createFilterRow(x, currentY, width, filter);
        container.appendChild(filterGroup);
        currentY += 30;
      });
      
      // Filter action buttons row
      let buttonY = currentY + 5;
      
      // Add Filter button
      const addFilterButton = createAddFilterButton(x, buttonY, 80, addFilter);
      container.appendChild(addFilterButton);
      
      // Apply Filters button (if there are pending filters)
      if (pendingFilters.length > 0) {
        const applyButton = createApplyFiltersButton(x + 85, buttonY, 90, applyPendingFilters);
        container.appendChild(applyButton);
      }
      
      // Clear All button (if there are any filters)
      if (pendingFilters.length > 0 || (currentOptions.filters && currentOptions.filters.length > 0)) {
        const clearAllButton = createClearAllButton(x + 180, buttonY, 70, clearAllFilters);
        container.appendChild(clearAllButton);
      }
    }
    
    function createFilterRow(x, y, width, filter) {
      const group = createSVGElement('g');
      
      // Get all fields for dropdown
      const allFields = Object.keys(embeddedData.rows[0]);
      
      // Field dropdown (80px width)
      const fieldGroup = createUIGroup(x, y, '', filter.field, allFields, (value) => {
        updateFilter(filter.id, 'field', value);
      }, 80);
      group.appendChild(fieldGroup);
      
      // Operator dropdown (50px width)  
      const operators = ['=', '!=', '>', '<', '>=', '<=', 'contains'];
      const operatorGroup = createUIGroup(x + 85, y, '', filter.operator, operators, (value) => {
        updateFilter(filter.id, 'operator', value);
      }, 50);
      group.appendChild(operatorGroup);
      
      // Value input (60px width)
      const valueInput = createValueInput(x + 140, y, 50, filter.value, (value) => {
        updateFilter(filter.id, 'value', value);
      });
      group.appendChild(valueInput);
      
      // Remove button (15px width)
      const removeButton = createRemoveButton(x + 195, y, filter.id, removeFilter);
      group.appendChild(removeButton);
      
      return group;
    }
    
    function saveCurrentState() {
      log_debug('Saving current state:', currentOptions);
      
      // Create a copy of the current SVG
      const svgElement = document.documentElement.cloneNode(true);
      
      // Find the script element in the cloned SVG
      const scriptElement = svgElement.querySelector('script');
      if (scriptElement) {
        // Get the current script content
        let scriptContent = scriptElement.textContent;
        
        // Replace the initial state with current state
        const stateRegex = /const initialState = [^;]+;/;
        scriptContent = scriptContent.replace(
          stateRegex,
          \`const initialState = \${JSON.stringify(currentOptions)};\`
        );
        
        scriptElement.textContent = scriptContent;
      }
      
      // Serialize the modified SVG
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      
      // Create a blob and download link
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      // Generate filename with current settings
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = \`chart_\${currentOptions.xField}_vs_\${currentOptions.yField}_\${timestamp}.svg\`;
      
      // Create a download link using a different approach that works in SVG context
      // We'll create a temporary anchor element in a way that works across browsers
      const tempLink = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
      tempLink.href = url;
      tempLink.download = filename;
      
      // Create a click event
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: false
      });
      
      tempLink.dispatchEvent(clickEvent);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      log_debug('Chart saved as:', filename);
    }

    function renderChart() {
      log_debug('renderChart called');
      // Render UI controls first
      renderUIControls();
      
      // Then render chart content
      renderChartContent();
    }
    
    function renderChartContent() {
      log_debug('renderChartContent called with options:', currentOptions);
      
      // Clear existing chart
      const chartArea = document.getElementById('chart-area');
      chartArea.innerHTML = '';
      
      // Get chart type handler
      const chartType = currentOptions.chartType || 'scatter';
      const chartHandler = chartTypes[chartType];
      
      if (!chartHandler) {
        console.error('Unknown chart type:', chartType);
        return;
      }
      
      // Generate chart data
      currentChartData = chartHandler.generate(embeddedData, currentOptions);
      
      // Update title based on chart type
      const title = document.getElementById('chart-title');
      if (chartType === 'histogram') {
        title.textContent = \`Distribution of \${currentOptions.histogramField || 'data'}\`;
      } else if (chartType === 'scatter') {
        title.textContent = \`\${currentOptions.xField} vs \${currentOptions.yField}\`;
      }
      
      // Render chart
      chartHandler.render(chartArea, currentChartData, currentOptions);
      
      // Initialize interactivity
      initializeInteractivity();
    }
  `;
}
