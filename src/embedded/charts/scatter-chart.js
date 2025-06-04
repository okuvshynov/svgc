// Scatter chart implementation

function generateScatterChart(data, options) {
  log_debug('generateScatterChart called with:', { 
    dataRows: data.rows.length, 
    options: options,
    filters: currentOptions.filters
  });
  
  const { width, height, padding } = chartDimensions;
  const controlPanelWidth = 240;
  const chartWidth = width - controlPanelWidth - padding - 20;
  const chartHeight = height - 2 * padding;
  
  // Apply filters to data
  const filteredData = { ...data, rows: applyFilters(data.rows) };
  
  log_debug('Data filtering result:', {
    originalRows: data.rows.length,
    filteredRows: filteredData.rows.length,
    filtersApplied: currentOptions.filters ? currentOptions.filters.length : 0
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
    type: 'scatter',
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

function renderScatterChart(container, chartData, options) {
  const { xField, yField } = options;
  
  // Render axes
  renderScatterAxes(container, chartData, xField, yField);
  
  // Render points
  renderScatterPoints(container, chartData);
  
  // Render legend if needed
  if (options.groupField && chartData.groups.length > 1) {
    renderScatterLegend(container, chartData, options.groupField);
  }
}

function renderScatterAxes(container, chartData, xField, yField) {
  const { chartBounds, xScale, yScale } = chartData;
  
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
    transform: `rotate(-90, ${chartBounds.left - 60}, ${chartBounds.top + chartBounds.height/2})`
  });
  yTitle.textContent = yField;
  container.appendChild(yTitle);
}

function renderScatterPoints(container, chartData) {
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

function renderScatterLegend(container, chartData, groupField) {
  const legendX = chartDimensions.width - 160;
  const legendY = 50;
  
  // Legend title
  const title = createSVGElement('text', {
    x: legendX,
    y: legendY,
    class: 'legend-text',
    style: 'font-weight: bold;'
  });
  title.textContent = groupField;
  container.appendChild(title);
  
  // Legend items
  chartData.groups.forEach((group, index) => {
    const y = legendY + 20 + index * 20;
    const color = chartData.groupColorMap[group];
    const groupId = `group-${String(group).replace(/[^a-zA-Z0-9]/g, '-')}`;
    
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

function renderScatterControls(container, x, y, width) {
  let currentY = y;
  
  // Get available numeric fields for axis selection
  const numericFields = Object.keys(embeddedData.rows[0]).filter(field => {
    return embeddedData.rows.some(row => typeof row[field] === 'number');
  });
  
  // X-axis dropdown
  const xAxisGroup = createUIGroup(x, currentY, 'X Axis:', currentOptions.xField, numericFields, (field) => {
    currentOptions.xField = field;
    renderChartContent();
  });
  container.appendChild(xAxisGroup);
  currentY += 50;
  
  // Y-axis dropdown  
  const yAxisGroup = createUIGroup(x, currentY, 'Y Axis:', currentOptions.yField, numericFields, (field) => {
    currentOptions.yField = field;
    renderChartContent();
  });
  container.appendChild(yAxisGroup);
  currentY += 50;
  
  // All fields for grouping (including string fields)
  const allFields = Object.keys(embeddedData.rows[0]);
  const groupFields = ['None', ...allFields];
  const currentGroupField = currentOptions.groupField || 'None';
  
  // Group field dropdown
  const groupAxisGroup = createUIGroup(x, currentY, 'Group By:', currentGroupField, groupFields, (field) => {
    if (field === 'None') {
      delete currentOptions.groupField;
    } else {
      currentOptions.groupField = field;
    }
    renderChartContent();
  });
  container.appendChild(groupAxisGroup);
  currentY += 50;
  
  // Filters section
  renderFiltersSection(container, x, currentY, width);
  
  // Save button at the bottom
  const saveButton = createSaveButton(x, chartDimensions.height - 60, width, saveCurrentState);
  container.appendChild(saveButton);
}