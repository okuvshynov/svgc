// This file contains JavaScript code that gets embedded into SVG files
// and runs in the browser to provide interactivity

import { generateEmbeddedScatterChart } from './charts/scatter-chart.js';
import { generateEmbeddedHistogramChart } from './charts/histogram-chart.js';

export function generateEmbeddedChartFunctions() {
  return `
    // Chart generation functions embedded in SVG
    
    function generateTicks(min, max, targetCount) {
      if (min === max) {
        return [min];
      }
      
      const range = max - min;
      const roughStep = range / (targetCount - 1);
      
      // Find nice step size (1, 2, 2.5, 5) * 10^k
      const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
      const normalized = roughStep / magnitude;
      
      let niceStep;
      if (normalized <= 1) {
        niceStep = 1 * magnitude;
      } else if (normalized <= 2) {
        niceStep = 2 * magnitude;
      } else if (normalized <= 2.5) {
        niceStep = 2.5 * magnitude;
      } else if (normalized <= 5) {
        niceStep = 5 * magnitude;
      } else {
        niceStep = 10 * magnitude;
      }
      
      const niceMin = Math.floor(min / niceStep) * niceStep;
      const niceMax = Math.ceil(max / niceStep) * niceStep;
      
      const ticks = [];
      for (let tick = niceMin; tick <= niceMax + niceStep * 0.001; tick += niceStep) {
        const roundedTick = Math.round(tick / niceStep) * niceStep;
        ticks.push(roundedTick);
      }
      
      return ticks;
    }
    
    function formatNumber(num) {
      if (num === 0) return '0';
      
      const absNum = Math.abs(num);
      
      // Use scientific notation for very large or very small numbers
      if (absNum >= 1e6 || (absNum < 1e-3 && absNum > 0)) {
        const exponent = Math.floor(Math.log10(absNum));
        const mantissa = num / Math.pow(10, exponent);
        
        // Format mantissa to avoid unnecessary decimals
        const formattedMantissa = mantissa % 1 === 0 ? 
          mantissa.toString() : 
          mantissa.toFixed(1);
        
        return \`\${formattedMantissa}×10^\${exponent}\`;
      } else if (absNum >= 1) {
        if (num % 1 === 0) {
          return num.toString();
        } else if (num % 0.1 === 0) {
          return num.toFixed(1);
        } else {
          return num.toFixed(2);
        }
      } else {
        if (num % 0.01 === 0) {
          return num.toFixed(2);
        } else if (num % 0.001 === 0) {
          return num.toFixed(3);
        } else {
          return num.toFixed(4);
        }
      }
    }
    
    
    function generateColors(count) {
      const colors = [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
      ];
      
      if (count <= colors.length) {
        return colors.slice(0, count);
      }
      
      const result = [...colors];
      for (let i = colors.length; i < count; i++) {
        const hue = (i * 137.508) % 360;
        result.push(\`hsl(\${hue}, 70%, 50%)\`);
      }
      
      return result;
    }
    
    
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
    
    function evaluateFilter(row, filter) {
      const value = row[filter.field];
      const filterValue = filter.value;
      
      // Convert filter value to appropriate type
      let typedFilterValue = filterValue;
      if (typeof value === 'number' && !isNaN(Number(filterValue))) {
        typedFilterValue = Number(filterValue);
      }
      
      switch (filter.operator) {
        case '=': return value == typedFilterValue;
        case '!=': return value != typedFilterValue;
        case '>': return value > typedFilterValue;
        case '<': return value < typedFilterValue;
        case '>=': return value >= typedFilterValue;
        case '<=': return value <= typedFilterValue;
        case 'contains': return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
        case 'starts_with': return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
        case 'ends_with': return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
        default: return true;
      }
    }
    
    function addFilter() {
      const allFields = Object.keys(embeddedData.rows[0]);
      const newFilter = {
        id: Date.now(),
        field: allFields[0],
        operator: '=',
        value: ''
      };
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
    
    
    function createSVGElement(tag, attributes = {}) {
      const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
      }
      return element;
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
      const addFilterButton = createAddFilterButton(x, buttonY, 80);
      container.appendChild(addFilterButton);
      
      // Apply Filters button (if there are pending filters)
      if (pendingFilters.length > 0) {
        const applyButton = createApplyFiltersButton(x + 85, buttonY, 90);
        container.appendChild(applyButton);
      }
      
      // Clear All button (if there are any filters)
      if (pendingFilters.length > 0 || (currentOptions.filters && currentOptions.filters.length > 0)) {
        const clearAllButton = createClearAllButton(x + 180, buttonY, 70);
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
      const removeButton = createRemoveButton(x + 195, y, filter.id);
      group.appendChild(removeButton);
      
      return group;
    }
    
    function createValueInput(x, y, width, currentValue, onChange) {
      const foreignObject = createSVGElement('foreignObject', {
        x: x,
        y: y,
        width: width,
        height: 22
      });
      
      const input = document.createElementNS('http://www.w3.org/1999/xhtml', 'input');
      input.setAttribute('type', 'text');
      input.setAttribute('value', currentValue);
      input.setAttribute('style', 
        \`width: \${width-4}px; height: 18px; font-family: Arial, sans-serif; font-size: 10px; \` +
        'border: 1px solid #ccc; border-radius: 3px; padding: 1px;'
      );
      
      input.addEventListener('input', (e) => {
        onChange(e.target.value);
      });
      
      foreignObject.appendChild(input);
      return foreignObject;
    }
    
    function createRemoveButton(x, y, filterId) {
      const group = createSVGElement('g', { class: 'remove-filter-btn', style: 'cursor: pointer;' });
      
      // Background
      const bg = createSVGElement('rect', {
        x: x,
        y: y + 2,
        width: 16,
        height: 16,
        fill: '#ff6b6b',
        stroke: '#ff5252',
        'stroke-width': 1,
        rx: 3
      });
      group.appendChild(bg);
      
      // X symbol
      const xText = createSVGElement('text', {
        x: x + 8,
        y: y + 13,
        'text-anchor': 'middle',
        style: 'font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; fill: white; pointer-events: none;'
      });
      xText.textContent = '×';
      group.appendChild(xText);
      
      group.addEventListener('click', () => {
        removeFilter(filterId);
      });
      
      return group;
    }
    
    function createAddFilterButton(x, y, width) {
      const group = createSVGElement('g', { class: 'add-filter-btn', style: 'cursor: pointer;' });
      
      // Background
      const bg = createSVGElement('rect', {
        x: x,
        y: y,
        width: width,
        height: 20,
        fill: '#4CAF50',
        stroke: '#45a049',
        'stroke-width': 1,
        rx: 3
      });
      group.appendChild(bg);
      
      // Text
      const text = createSVGElement('text', {
        x: x + width/2,
        y: y + 14,
        'text-anchor': 'middle',
        style: 'font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; fill: white; pointer-events: none;'
      });
      text.textContent = '+ Add';
      group.appendChild(text);
      
      group.addEventListener('click', addFilter);
      
      return group;
    }
    
    function createApplyFiltersButton(x, y, width) {
      const group = createSVGElement('g', { class: 'apply-filters-btn', style: 'cursor: pointer;' });
      
      // Background - always active blue
      const bg = createSVGElement('rect', {
        x: x,
        y: y,
        width: width,
        height: 20,
        fill: '#2196F3',
        stroke: '#1976D2',
        'stroke-width': 1,
        rx: 3
      });
      group.appendChild(bg);
      
      // Text
      const text = createSVGElement('text', {
        x: x + width/2,
        y: y + 14,
        'text-anchor': 'middle',
        style: 'font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; fill: white; pointer-events: none;'
      });
      text.textContent = 'Apply Filters';
      group.appendChild(text);
      
      group.addEventListener('click', applyPendingFilters);
      
      return group;
    }
    
    function createClearAllButton(x, y, width) {
      const group = createSVGElement('g', { class: 'clear-all-btn', style: 'cursor: pointer;' });
      
      // Background
      const bg = createSVGElement('rect', {
        x: x,
        y: y,
        width: width,
        height: 20,
        fill: '#f44336',
        stroke: '#d32f2f',
        'stroke-width': 1,
        rx: 3
      });
      group.appendChild(bg);
      
      // Text
      const text = createSVGElement('text', {
        x: x + width/2,
        y: y + 14,
        'text-anchor': 'middle',
        style: 'font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; fill: white; pointer-events: none;'
      });
      text.textContent = 'Clear All';
      group.appendChild(text);
      
      group.addEventListener('click', clearAllFilters);
      
      return group;
    }
    
    function createSaveButton(x, y, width) {
      const group = createSVGElement('g', { class: 'save-btn', style: 'cursor: pointer;' });
      
      // Background
      const bg = createSVGElement('rect', {
        x: x,
        y: y,
        width: width,
        height: 30,
        fill: '#673AB7',
        stroke: '#512DA8',
        'stroke-width': 1,
        rx: 4
      });
      group.appendChild(bg);
      
      // Icon - simple floppy disk shape
      const iconGroup = createSVGElement('g', {
        transform: \`translate(\${x + 15}, \${y + 7})\`
      });
      
      // Floppy disk body
      iconGroup.appendChild(createSVGElement('rect', {
        x: 0, y: 0, width: 16, height: 16,
        fill: 'white', stroke: 'none'
      }));
      
      // Floppy disk shutter
      iconGroup.appendChild(createSVGElement('rect', {
        x: 3, y: 0, width: 10, height: 6,
        fill: '#673AB7', stroke: 'none'
      }));
      
      // Floppy disk label area
      iconGroup.appendChild(createSVGElement('rect', {
        x: 2, y: 8, width: 12, height: 6,
        fill: '#673AB7', stroke: 'none'
      }));
      
      group.appendChild(iconGroup);
      
      // Text
      const text = createSVGElement('text', {
        x: x + width/2 + 5,
        y: y + 19,
        'text-anchor': 'middle',
        style: 'font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; fill: white; pointer-events: none;'
      });
      text.textContent = 'Save Current View';
      group.appendChild(text);
      
      group.addEventListener('click', saveCurrentState);
      
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
    
    function createUIGroup(x, y, label, currentValue, options, onChange, width = 130) {
      const group = createSVGElement('g');
      
      // Label (only if provided)
      if (label) {
        const labelText = createSVGElement('text', {
          x: x,
          y: y - 5,
          class: 'ui-label'
        });
        labelText.textContent = label;
        group.appendChild(labelText);
      }
      
      // Create foreignObject for HTML select
      const foreignObject = createSVGElement('foreignObject', {
        x: x,
        y: y,
        width: width,
        height: 22
      });
      
      // Create HTML select element in XHTML namespace
      const selectElement = document.createElementNS('http://www.w3.org/1999/xhtml', 'select');
      
      // Set style attribute as string since we're in XML context
      selectElement.setAttribute('style', 
        \`width: \${width}px; height: 20px; font-family: Arial, sans-serif; font-size: 11px; \` +
        'border: 1px solid #ccc; border-radius: 3px; background: white; padding: 2px; outline: none;'
      );
      
      // Add options to select
      options.forEach(option => {
        const optionElement = document.createElementNS('http://www.w3.org/1999/xhtml', 'option');
        optionElement.setAttribute('value', option);
        optionElement.textContent = option;
        if (option === currentValue) {
          optionElement.setAttribute('selected', 'selected');
        }
        selectElement.appendChild(optionElement);
      });
      
      // Add event listener
      selectElement.addEventListener('change', (e) => {
        onChange(e.target.value);
      });
      
      foreignObject.appendChild(selectElement);
      
      group.appendChild(foreignObject);
      return group;
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
