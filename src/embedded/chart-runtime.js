// This file contains JavaScript code that gets embedded into SVG files
// and runs in the browser to provide interactivity

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
      
      if (absNum >= 1e9) {
        const billions = num / 1e9;
        return billions % 1 === 0 ? billions.toString() + 'B' : billions.toFixed(1) + 'B';
      } else if (absNum >= 1e6) {
        const millions = num / 1e6;
        return millions % 1 === 0 ? millions.toString() + 'M' : millions.toFixed(1) + 'M';
      } else if (absNum >= 1e3) {
        const thousands = num / 1e3;
        return thousands % 1 === 0 ? thousands.toString() + 'K' : thousands.toFixed(1) + 'K';
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
    
    function generateScatterChart(data, options) {
      log_debug('generateScatterChart called with:', { 
        dataRows: data.rows.length, 
        options: options,
        appliedFilters: appliedFilters
      });
      
      const { width, height, padding } = chartDimensions;
      const controlPanelWidth = 240; // Account for wider control panel
      const chartWidth = width - controlPanelWidth - padding - 20;
      const chartHeight = height - 2 * padding;
      
      // Apply filters to data
      const filteredData = { ...data, rows: applyFilters(data.rows) };
      
      log_debug('Data filtering result:', {
        originalRows: data.rows.length,
        filteredRows: filteredData.rows.length,
        filtersApplied: appliedFilters.length
      });
      
      // Calculate scales using filtered data
      const xValues = filteredData.rows.map(row => row[options.xField]).filter(v => typeof v === 'number');
      const yValues = filteredData.rows.map(row => row[options.yField]).filter(v => typeof v === 'number');
      
      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      const yMin = Math.min(...yValues);
      const yMax = Math.max(...yValues);
      
      log_debug('Scale calculation:', {
        xField: options.xField,
        yField: options.yField,
        xValues: xValues.length,
        yValues: yValues.length,
        xRange: [xMin, xMax],
        yRange: [yMin, yMax]
      });
      
      // Handle case where all values are the same (range = 0)
      const xRange = xMax - xMin;
      const yRange = yMax - yMin;
      const xPadding = xRange > 0 ? xRange * 0.05 : Math.abs(xMin) * 0.1 || 1;
      const yPadding = yRange > 0 ? yRange * 0.05 : Math.abs(yMin) * 0.1 || 1;
      
      const xScale = {
        min: xMin - xPadding,
        max: xMax + xPadding,
        range: Math.max(xRange + 2 * xPadding, 2 * xPadding)
      };
      
      const yScale = {
        min: yMin - yPadding,
        max: yMax + yPadding,
        range: Math.max(yRange + 2 * yPadding, 2 * yPadding)
      };
      
      // Get unique groups for coloring using filtered data
      const groups = options.groupField ? 
        [...new Set(filteredData.rows.map(row => row[options.groupField]))] : 
        ['default'];
      
      const colors = generateColors(groups.length);
      const groupColorMap = {};
      groups.forEach((group, index) => {
        groupColorMap[group] = colors[index];
      });
      
      // Generate chart elements using filtered data
      const points = filteredData.rows.map((row, index) => {
        const x = row[options.xField];
        const y = row[options.yField];
        
        if (typeof x !== 'number' || typeof y !== 'number') {
          return null;
        }
        
        const svgX = controlPanelWidth + padding + ((x - xScale.min) / xScale.range) * chartWidth;
        const svgY = padding + chartHeight - ((y - yScale.min) / yScale.range) * chartHeight;
        
        const group = options.groupField ? row[options.groupField] : 'default';
        const weight = options.weightField ? row[options.weightField] : 1;
        const radius = Math.max(2, Math.min(10, 3 + Math.sqrt(weight) * 2));
        
        return {
          x: svgX,
          y: svgY,
          radius,
          color: groupColorMap[group],
          group,
          data: row,
          index
        };
      }).filter(p => p !== null);
      
      return {
        points,
        xScale,
        yScale,
        groupColorMap,
        groups,
        chartBounds: {
          left: controlPanelWidth + padding,
          top: padding,
          width: chartWidth,
          height: chartHeight
        }
      };
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
    let pendingFilters = [];
    let appliedFilters = [];
    
    function applyFilters(rows) {
      if (appliedFilters.length === 0) {
        return rows;
      }
      
      return rows.filter(row => {
        return appliedFilters.every(filter => evaluateFilter(row, filter));
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
      pendingFilters = pendingFilters.filter(f => f.id !== filterId);
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
      // Copy pending filters to applied filters
      appliedFilters = [...pendingFilters];
      renderChartContent();
      renderUIControls();
    }
    
    function clearAllFilters() {
      pendingFilters = [];
      appliedFilters = [];
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
      
      // Get available numeric fields for axis selection
      const numericFields = Object.keys(embeddedData.rows[0]).filter(field => {
        return embeddedData.rows.some(row => typeof row[field] === 'number');
      });
      
      // X-axis dropdown
      const xAxisGroup = createUIGroup(panelX + 10, panelY + 50, 'X Axis:', currentOptions.xField, numericFields, (field) => {
        currentOptions.xField = field;
        renderChartContent();
      });
      controlsContainer.appendChild(xAxisGroup);
      
      // Y-axis dropdown  
      const yAxisGroup = createUIGroup(panelX + 10, panelY + 100, 'Y Axis:', currentOptions.yField, numericFields, (field) => {
        currentOptions.yField = field;
        renderChartContent();
      });
      controlsContainer.appendChild(yAxisGroup);
      
      // All fields for grouping (including string fields)
      const allFields = Object.keys(embeddedData.rows[0]);
      const groupFields = ['None', ...allFields];
      const currentGroupField = currentOptions.groupField || 'None';
      
      // Group field dropdown
      const groupAxisGroup = createUIGroup(panelX + 10, panelY + 150, 'Group By:', currentGroupField, groupFields, (field) => {
        if (field === 'None') {
          delete currentOptions.groupField;
        } else {
          currentOptions.groupField = field;
        }
        renderChartContent();
      });
      controlsContainer.appendChild(groupAxisGroup);
      
      // Filters section
      renderFiltersSection(controlsContainer, panelX + 10, panelY + 200, panelWidth - 20);
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
      if (pendingFilters.length > 0 || appliedFilters.length > 0) {
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
      // Generate chart data
      currentChartData = generateScatterChart(embeddedData, currentOptions);
      
      // Clear existing chart
      const chartArea = document.getElementById('chart-area');
      chartArea.innerHTML = '';
      
      // Update title
      const title = document.getElementById('chart-title');
      title.textContent = \`\${currentOptions.xField} vs \${currentOptions.yField}\`;
      
      // Render axes
      renderAxes(chartArea, currentChartData, currentOptions);
      
      // Render points
      renderPoints(chartArea, currentChartData);
      
      // Render legend
      renderLegend(chartArea, currentChartData, currentOptions);
      
      // Initialize interactivity
      initializeInteractivity();
    }
    
    function renderAxes(container, chartData, options) {
      const { chartBounds, xScale, yScale } = chartData;
      const { xField, yField } = options;
      
      // Main axes
      container.appendChild(createSVGElement('line', {
        x1: chartBounds.left,
        y1: chartBounds.top + chartBounds.height,
        x2: chartBounds.left + chartBounds.width,
        y2: chartBounds.top + chartBounds.height,
        class: 'axis-line'
      }));
      
      container.appendChild(createSVGElement('line', {
        x1: chartBounds.left,
        y1: chartBounds.top,
        x2: chartBounds.left,
        y2: chartBounds.top + chartBounds.height,
        class: 'axis-line'
      }));
      
      // Generate ticks
      const xTicks = generateTicks(xScale.min, xScale.max, 5).filter(tick => tick >= xScale.min && tick <= xScale.max);
      const yTicks = generateTicks(yScale.min, yScale.max, 5).filter(tick => tick >= yScale.min && tick <= yScale.max);
      
      // Grid lines and tick marks
      xTicks.forEach(tick => {
        const x = chartBounds.left + ((tick - xScale.min) / xScale.range) * chartBounds.width;
        
        // Grid line
        if (Math.abs(x - chartBounds.left) > 1) {
          container.appendChild(createSVGElement('line', {
            x1: x, y1: chartBounds.top,
            x2: x, y2: chartBounds.top + chartBounds.height,
            class: 'grid-line'
          }));
        }
        
        // Tick mark
        container.appendChild(createSVGElement('line', {
          x1: x, y1: chartBounds.top + chartBounds.height,
          x2: x, y2: chartBounds.top + chartBounds.height + 5,
          class: 'axis-tick'
        }));
        
        // Label
        const text = createSVGElement('text', {
          x: x,
          y: chartBounds.top + chartBounds.height + 18,
          'text-anchor': 'middle',
          class: 'axis-text'
        });
        text.textContent = formatNumber(tick);
        container.appendChild(text);
      });
      
      yTicks.forEach(tick => {
        const y = chartBounds.top + chartBounds.height - ((tick - yScale.min) / yScale.range) * chartBounds.height;
        
        // Grid line
        if (Math.abs(y - (chartBounds.top + chartBounds.height)) > 1) {
          container.appendChild(createSVGElement('line', {
            x1: chartBounds.left, y1: y,
            x2: chartBounds.left + chartBounds.width, y2: y,
            class: 'grid-line'
          }));
        }
        
        // Tick mark
        container.appendChild(createSVGElement('line', {
          x1: chartBounds.left - 5, y1: y,
          x2: chartBounds.left, y2: y,
          class: 'axis-tick'
        }));
        
        // Label
        const text = createSVGElement('text', {
          x: chartBounds.left - 10,
          y: y + 4,
          'text-anchor': 'end',
          class: 'axis-text'
        });
        text.textContent = formatNumber(tick);
        container.appendChild(text);
      });
      
      // Axis titles
      const xTitle = createSVGElement('text', {
        x: chartBounds.left + chartBounds.width/2,
        y: chartBounds.top + chartBounds.height + 45,
        'text-anchor': 'middle',
        class: 'axis-text',
        style: 'font-weight: bold;'
      });
      xTitle.textContent = xField;
      container.appendChild(xTitle);
      
      const yTitle = createSVGElement('text', {
        x: chartBounds.left - 60,
        y: chartBounds.top + chartBounds.height/2,
        'text-anchor': 'middle',
        class: 'axis-text',
        style: 'font-weight: bold;',
        transform: \`rotate(-90, \${chartBounds.left - 60}, \${chartBounds.top + chartBounds.height/2})\`
      });
      yTitle.textContent = yField;
      container.appendChild(yTitle);
    }
    
    function renderPoints(container, chartData) {
      chartData.points.forEach(point => {
        const circle = createSVGElement('circle', {
          cx: point.x,
          cy: point.y,
          r: point.radius,
          fill: point.color,
          class: 'chart-point',
          'data-group': point.group,
          'data-index': point.index
        });
        
        const title = createSVGElement('title');
        title.textContent = JSON.stringify(point.data);
        circle.appendChild(title);
        
        container.appendChild(circle);
      });
    }
    
    function renderLegend(container, chartData, options) {
      if (!options.groupField || chartData.groups.length <= 1) {
        return;
      }
      
      const legendX = chartDimensions.width - 160;
      const legendY = 50;
      
      // Legend title
      const title = createSVGElement('text', {
        x: legendX,
        y: legendY,
        class: 'legend-text',
        style: 'font-weight: bold;'
      });
      title.textContent = options.groupField;
      container.appendChild(title);
      
      // Legend items
      chartData.groups.forEach((group, index) => {
        const y = legendY + 20 + index * 20;
        const color = chartData.groupColorMap[group];
        const groupId = \`group-\${String(group).replace(/[^a-zA-Z0-9]/g, '-')}\`;
        
        const legendGroup = createSVGElement('g', {
          class: 'legend-item',
          'data-group': group,
          id: groupId
        });
        
        // Clickable background
        legendGroup.appendChild(createSVGElement('rect', {
          x: legendX - 5, y: y - 12,
          width: 160, height: 18,
          fill: 'transparent', stroke: 'none'
        }));
        
        // Checkbox
        legendGroup.appendChild(createSVGElement('rect', {
          x: legendX, y: y - 8,
          width: 8, height: 8,
          class: 'legend-checkbox checked',
          'data-group': group
        }));
        
        // Color indicator
        legendGroup.appendChild(createSVGElement('circle', {
          cx: legendX + 18, cy: y - 4,
          r: 5, fill: color,
          class: 'legend-indicator',
          'data-group': group
        }));
        
        // Label
        const text = createSVGElement('text', {
          x: legendX + 28, y: y,
          class: 'legend-text',
          'data-group': group
        });
        text.textContent = group;
        legendGroup.appendChild(text);
        
        container.appendChild(legendGroup);
      });
    }
  `;
}