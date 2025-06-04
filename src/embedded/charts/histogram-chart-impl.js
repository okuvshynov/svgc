// Histogram chart implementation

function generateHistogram(data, options) {
  log_debug('generateHistogram called with:', { 
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
  
  // Get values for the specified field
  const values = filteredData.rows
    .map(row => row[options.histogramField])
    .filter(v => v !== null && v !== undefined);
  
  // Determine if numeric or categorical
  const numericValues = values.filter(v => typeof v === 'number');
  const stringValues = values.filter(v => typeof v === 'string');
  
  let histogramData;
  if (numericValues.length > 0 && stringValues.length === 0) {
    histogramData = generateNumericHistogram(numericValues, options.binCount || 10);
  } else {
    histogramData = generateCategoricalHistogram(values.map(v => String(v)));
  }
  
  return {
    type: 'histogram',
    histogramData,
    chartBounds: {
      left: controlPanelWidth + padding,
      top: padding,
      width: chartWidth,
      height: chartHeight
    }
  };
}

function generateNumericHistogram(values, numBins) {
  if (values.length === 0) return { bins: [], isNumeric: true };
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  // Handle constant values
  if (range === 0) {
    return {
      bins: [{
        label: formatNumber(min),
        value: min,
        count: values.length,
        range: [min, min]
      }],
      isNumeric: true,
      min,
      max
    };
  }
  
  // Calculate nice bin width
  const rawBinWidth = range / numBins;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawBinWidth)));
  const normalized = rawBinWidth / magnitude;
  
  let niceBinWidth;
  if (normalized <= 1) niceBinWidth = 1 * magnitude;
  else if (normalized <= 2) niceBinWidth = 2 * magnitude;
  else if (normalized <= 2.5) niceBinWidth = 2.5 * magnitude;
  else if (normalized <= 5) niceBinWidth = 5 * magnitude;
  else niceBinWidth = 10 * magnitude;
  
  // Adjust start to be a nice multiple
  const binStart = Math.floor(min / niceBinWidth) * niceBinWidth;
  const binEnd = Math.ceil(max / niceBinWidth) * niceBinWidth;
  const actualNumBins = Math.round((binEnd - binStart) / niceBinWidth);
  
  // Create bins
  const bins = [];
  for (let i = 0; i < actualNumBins; i++) {
    const start = binStart + i * niceBinWidth;
    const end = start + niceBinWidth;
    bins.push({
      label: formatBinLabel(start, end, niceBinWidth),
      value: start + niceBinWidth / 2,
      count: 0,
      range: [start, end]
    });
  }
  
  // Count values in bins
  values.forEach(value => {
    const binIndex = Math.min(
      Math.floor((value - binStart) / niceBinWidth),
      bins.length - 1
    );
    if (binIndex >= 0 && binIndex < bins.length) {
      bins[binIndex].count++;
    }
  });
  
  return {
    bins: bins.filter(bin => bin.count > 0),
    isNumeric: true,
    min,
    max
  };
}

function generateCategoricalHistogram(values) {
  const counts = {};
  values.forEach(value => {
    counts[value] = (counts[value] || 0) + 1;
  });
  
  const bins = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      value: label,
      count
    }));
  
  return {
    bins,
    isNumeric: false
  };
}

function formatBinLabel(start, end, binWidth) {
  // Determine precision based on bin width
  const precision = Math.max(0, -Math.floor(Math.log10(binWidth)) + 1);
  
  if (precision === 0) {
    return `${Math.round(start)}-${Math.round(end)}`;
  } else {
    return `${start.toFixed(precision)}-${end.toFixed(precision)}`;
  }
}

function renderHistogramChart(container, chartData, options) {
  const { histogramField } = options;
  const { histogramData, chartBounds } = chartData;
  
  // Calculate scales
  const maxCount = Math.max(...histogramData.bins.map(b => b.count));
  const yScale = {
    min: 0,
    max: maxCount * 1.1,
    range: maxCount * 1.1
  };
  
  // Render axes
  renderHistogramAxes(container, chartData, histogramField, yScale);
  
  // Render bars
  renderHistogramBars(container, chartData, yScale);
}

function renderHistogramAxes(container, chartData, fieldName, yScale) {
  const { chartBounds, histogramData } = chartData;
  
  // X-axis
  container.appendChild(createSVGElement('line', {
    x1: chartBounds.left,
    y1: chartBounds.top + chartBounds.height,
    x2: chartBounds.left + chartBounds.width,
    y2: chartBounds.top + chartBounds.height,
    class: 'axis-line'
  }));
  
  // Y-axis
  container.appendChild(createSVGElement('line', {
    x1: chartBounds.left,
    y1: chartBounds.top,
    x2: chartBounds.left,
    y2: chartBounds.top + chartBounds.height,
    class: 'axis-line'
  }));
  
  // Y-axis ticks and labels
  const yTicks = generateTicks(0, yScale.max, 5).filter(tick => tick >= 0 && tick <= yScale.max);
  
  yTicks.forEach(tick => {
    const y = chartBounds.top + chartBounds.height - (tick / yScale.range) * chartBounds.height;
    
    // Grid line
    if (tick > 0) {
      container.appendChild(createSVGElement('line', {
        x1: chartBounds.left,
        y1: y,
        x2: chartBounds.left + chartBounds.width,
        y2: y,
        class: 'grid-line'
      }));
    }
    
    // Tick
    container.appendChild(createSVGElement('line', {
      x1: chartBounds.left - 5,
      y1: y,
      x2: chartBounds.left,
      y2: y,
      class: 'axis-tick'
    }));
    
    // Label
    const text = createSVGElement('text', {
      x: chartBounds.left - 10,
      y: y + 4,
      'text-anchor': 'end',
      class: 'axis-text'
    });
    text.textContent = Math.round(tick).toString();
    container.appendChild(text);
  });
  
  // Axis titles
  const xTitle = createSVGElement('text', {
    x: chartBounds.left + chartBounds.width / 2,
    y: chartBounds.top + chartBounds.height + 60,
    'text-anchor': 'middle',
    class: 'axis-text',
    style: 'font-weight: bold;'
  });
  xTitle.textContent = fieldName;
  container.appendChild(xTitle);
  
  const yTitle = createSVGElement('text', {
    x: chartBounds.left - 60,
    y: chartBounds.top + chartBounds.height / 2,
    'text-anchor': 'middle',
    class: 'axis-text',
    style: 'font-weight: bold;',
    transform: `rotate(-90, ${chartBounds.left - 60}, ${chartBounds.top + chartBounds.height / 2})`
  });
  yTitle.textContent = 'Count';
  container.appendChild(yTitle);
}

function renderHistogramBars(container, chartData, yScale) {
  const { chartBounds, histogramData } = chartData;
  const bins = histogramData.bins;
  
  if (bins.length === 0) return;
  
  const barWidth = chartBounds.width / bins.length;
  const barPadding = Math.min(barWidth * 0.1, 5);
  
  bins.forEach((bin, index) => {
    const x = chartBounds.left + index * barWidth + barPadding / 2;
    const width = barWidth - barPadding;
    const height = (bin.count / yScale.range) * chartBounds.height;
    const y = chartBounds.top + chartBounds.height - height;
    
    // Bar
    const rect = createSVGElement('rect', {
      x: x,
      y: y,
      width: width,
      height: height,
      fill: '#4285f4',
      class: 'histogram-bar',
      'data-count': bin.count,
      'data-label': bin.label
    });
    
    // Tooltip
    const title = createSVGElement('title');
    title.textContent = `${bin.label}: ${bin.count}`;
    rect.appendChild(title);
    
    container.appendChild(rect);
    
    // X-axis label
    const text = createSVGElement('text', {
      x: x + width / 2,
      y: chartBounds.top + chartBounds.height + 20,
      'text-anchor': 'middle',
      class: 'axis-text',
      transform: bins.length > 20 ? 
        `rotate(-45, ${x + width / 2}, ${chartBounds.top + chartBounds.height + 20})` : ''
    });
    
    // Truncate long labels
    const maxLabelLength = bins.length > 10 ? 10 : 15;
    const label = bin.label.length > maxLabelLength ? 
      bin.label.substring(0, maxLabelLength - 3) + '...' : bin.label;
    text.textContent = label;
    
    container.appendChild(text);
  });
}

function renderHistogramControls(container, x, y, width) {
  let currentY = y;
  
  // Get all fields for histogram selection
  const allFields = Object.keys(embeddedData.rows[0]);
  
  // Field dropdown
  const fieldGroup = createUIGroup(x, currentY, 'Field:', currentOptions.histogramField, allFields, (field) => {
    currentOptions.histogramField = field;
    // Reset bin count when changing fields
    const values = embeddedData.rows
      .map(row => row[field])
      .filter(v => v !== null && v !== undefined && typeof v === 'number');
    if (values.length > 0) {
      currentOptions.binCount = Math.min(Math.max(5, Math.round(Math.sqrt(values.length))), 50);
    }
    renderChartContent();
  });
  container.appendChild(fieldGroup);
  currentY += 50;
  
  // Check if current field is numeric
  const values = embeddedData.rows
    .map(row => row[currentOptions.histogramField])
    .filter(v => v !== null && v !== undefined);
  
  const numericValues = values.filter(v => typeof v === 'number');
  const isNumeric = numericValues.length > 0 && values.filter(v => typeof v === 'string').length === 0;
  
  // Show bin count control only for numeric fields
  if (isNumeric) {
    const binGroup = createNumberInputGroup(
      x, currentY, 'Bins:', 
      currentOptions.binCount || 10,
      3, 100,
      (value) => {
        currentOptions.binCount = value;
        renderChartContent();
      }
    );
    container.appendChild(binGroup);
    currentY += 50;
  }
  
  // Filters section
  renderFiltersSection(container, x, currentY, width);
  
  // Save button at the bottom
  const saveButton = createSaveButton(x, chartDimensions.height - 60, width);
  container.appendChild(saveButton);
}

function createNumberInputGroup(x, y, label, value, min, max, onChange) {
  const group = createSVGElement('g');
  
  // Label
  const labelText = createSVGElement('text', {
    x: x,
    y: y,
    class: 'control-label'
  });
  labelText.textContent = label;
  group.appendChild(labelText);
  
  // Foreign object for HTML input
  const foreignObject = createSVGElement('foreignObject', {
    x: x + 60,
    y: y - 15,
    width: 60,
    height: 25
  });
  
  const inputElement = document.createElementNS('http://www.w3.org/1999/xhtml', 'input');
  inputElement.setAttribute('type', 'number');
  inputElement.setAttribute('value', value);
  inputElement.setAttribute('min', min);
  inputElement.setAttribute('max', max);
  inputElement.setAttribute('style', 
    'width: 60px; height: 20px; font-family: Arial, sans-serif; ' +
    'border: 1px solid #ccc; padding: 2px; background: white;'
  );
  
  inputElement.addEventListener('change', (e) => {
    const newValue = parseInt(e.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    } else {
      e.target.value = value;
    }
  });
  
  foreignObject.appendChild(inputElement);
  group.appendChild(foreignObject);
  
  return group;
}