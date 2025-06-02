// Embedded histogram chart functions that run in the browser

export function generateEmbeddedHistogramChart() {
  return `
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
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      
      if (range === 0) {
        return {
          type: 'numeric',
          bins: [{
            min: min,
            max: max,
            count: values.length,
            label: String(min)
          }],
          min: min,
          max: max,
          maxCount: values.length
        };
      }
      
      const binWidth = range / numBins;
      const bins = [];
      
      for (let i = 0; i < numBins; i++) {
        const binMin = min + i * binWidth;
        const binMax = i === numBins - 1 ? max : min + (i + 1) * binWidth;
        bins.push({
          min: binMin,
          max: binMax,
          count: 0,
          label: formatBinLabel(binMin, binMax, binWidth)
        });
      }
      
      values.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binWidth), numBins - 1);
        bins[binIndex].count++;
      });
      
      const maxCount = Math.max(...bins.map(b => b.count));
      
      return {
        type: 'numeric',
        bins: bins,
        min: min,
        max: max,
        maxCount: maxCount
      };
    }
    
    function generateCategoricalHistogram(values) {
      const counts = {};
      values.forEach(value => {
        counts[value] = (counts[value] || 0) + 1;
      });
      
      const bins = Object.entries(counts)
        .map(([label, count]) => ({
          label: label,
          count: count
        }))
        .sort((a, b) => b.count - a.count);
      
      const maxCount = Math.max(...bins.map(b => b.count));
      
      return {
        type: 'categorical',
        bins: bins,
        maxCount: maxCount
      };
    }
    
    function formatBinLabel(min, max, binWidth) {
      const formatNum = (num) => {
        if (binWidth >= 1) {
          return num.toFixed(0);
        } else if (binWidth >= 0.1) {
          return num.toFixed(1);
        } else if (binWidth >= 0.01) {
          return num.toFixed(2);
        } else {
          return num.toFixed(3);
        }
      };
      
      return \`\${formatNum(min)}-\${formatNum(max)}\`;
    }
    
    function suggestBinCount(values) {
      const n = values.length;
      if (n === 0) return 10;
      
      const sturges = Math.ceil(1 + 3.322 * Math.log10(n));
      return Math.max(5, Math.min(50, sturges));
    }
    
    function renderHistogramChart(container, chartData, options) {
      const { histogramField } = options;
      
      // Render axes
      renderHistogramAxes(container, chartData, histogramField);
      
      // Render bars
      renderHistogramBars(container, chartData);
    }
    
    function renderHistogramAxes(container, chartData, fieldName) {
      const { chartBounds, histogramData } = chartData;
      
      // X-axis line
      container.appendChild(createSVGElement('line', {
        x1: chartBounds.left,
        y1: chartBounds.top + chartBounds.height,
        x2: chartBounds.left + chartBounds.width,
        y2: chartBounds.top + chartBounds.height,
        class: 'axis-line'
      }));
      
      // Y-axis line
      container.appendChild(createSVGElement('line', {
        x1: chartBounds.left,
        y1: chartBounds.top,
        x2: chartBounds.left,
        y2: chartBounds.top + chartBounds.height,
        class: 'axis-line'
      }));
      
      // Y-axis ticks and labels (count)
      const yTicks = generateTicks(0, histogramData.maxCount, 5);
      yTicks.forEach(tick => {
        const y = chartBounds.top + chartBounds.height - (tick / histogramData.maxCount) * chartBounds.height;
        
        // Grid line
        if (tick > 0) {
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
      
      // Y-axis title
      const yTitle = createSVGElement('text', {
        x: chartBounds.left - 40,
        y: chartBounds.top + chartBounds.height/2,
        'text-anchor': 'middle',
        class: 'axis-text',
        style: 'font-weight: bold;',
        transform: \`rotate(-90, \${chartBounds.left - 40}, \${chartBounds.top + chartBounds.height/2})\`
      });
      yTitle.textContent = 'Count';
      container.appendChild(yTitle);
      
      // X-axis title
      const xTitle = createSVGElement('text', {
        x: chartBounds.left + chartBounds.width/2,
        y: chartBounds.top + chartBounds.height + 45,
        'text-anchor': 'middle',
        class: 'axis-text',
        style: 'font-weight: bold;'
      });
      xTitle.textContent = fieldName || 'Value';
      container.appendChild(xTitle);
    }
    
    function renderHistogramBars(container, chartData) {
      const { chartBounds, histogramData } = chartData;
      const bins = histogramData.bins;
      const barWidth = chartBounds.width / bins.length;
      const barPadding = Math.min(4, barWidth * 0.1);
      
      bins.forEach((bin, index) => {
        const x = chartBounds.left + index * barWidth + barPadding;
        const width = barWidth - 2 * barPadding;
        const height = (bin.count / histogramData.maxCount) * chartBounds.height;
        const y = chartBounds.top + chartBounds.height - height;
        
        // Bar
        const bar = createSVGElement('rect', {
          x: x,
          y: y,
          width: width,
          height: height,
          fill: '#1f77b4',
          class: 'histogram-bar',
          'data-bin': index
        });
        
        // Tooltip
        const title = createSVGElement('title');
        title.textContent = \`\${bin.label}: \${bin.count}\`;
        bar.appendChild(title);
        
        container.appendChild(bar);
        
        // X-axis label (rotated for better fit)
        const labelX = x + width/2;
        const labelY = chartBounds.top + chartBounds.height + 15;
        
        const label = createSVGElement('text', {
          x: labelX,
          y: labelY,
          'text-anchor': 'middle',
          class: 'axis-text',
          style: 'font-size: 9px;',
          transform: \`rotate(-45, \${labelX}, \${labelY})\`
        });
        
        // Truncate label if too long
        const maxLength = 15;
        const labelText = bin.label.length > maxLength ? 
          bin.label.substring(0, maxLength) + '...' : bin.label;
        label.textContent = labelText;
        
        container.appendChild(label);
      });
    }
    
    function renderHistogramControls(container, x, y, width) {
      let currentY = y;
      
      // All fields for histogram
      const allFields = Object.keys(embeddedData.rows[0]);
      
      // Initialize histogram field if not set
      if (!currentOptions.histogramField) {
        // Try to find a numeric field first
        const numericFields = allFields.filter(field => {
          return embeddedData.rows.some(row => typeof row[field] === 'number');
        });
        
        // Use first numeric field if available, otherwise first field
        currentOptions.histogramField = numericFields.length > 0 ? numericFields[0] : allFields[0];
        
        // Auto-suggest bin count for numeric fields
        const values = embeddedData.rows
          .map(row => row[currentOptions.histogramField])
          .filter(v => typeof v === 'number');
        if (values.length > 0 && !currentOptions.binCount) {
          currentOptions.binCount = suggestBinCount(values);
        }
      }
      
      // Field selection dropdown
      const fieldGroup = createUIGroup(x, currentY, 'Field:', 
        currentOptions.histogramField, allFields, (field) => {
        currentOptions.histogramField = field;
        
        // Auto-suggest bin count for numeric fields
        const values = embeddedData.rows
          .map(row => row[field])
          .filter(v => typeof v === 'number');
        if (values.length > 0) {
          currentOptions.binCount = suggestBinCount(values);
        }
        
        renderChart(); // Re-render to update bin count control visibility
      });
      container.appendChild(fieldGroup);
      currentY += 50;
      
      // Check if current field is numeric to show bin count control
      const values = embeddedData.rows
        .map(row => row[currentOptions.histogramField])
        .filter(v => v !== null && v !== undefined);
      const numericValues = values.filter(v => typeof v === 'number');
      const stringValues = values.filter(v => typeof v === 'string');
      const isNumeric = numericValues.length > 0 && stringValues.length === 0;
      
      if (isNumeric) {
        // Initialize bin count if not set
        if (!currentOptions.binCount) {
          currentOptions.binCount = suggestBinCount(numericValues);
        }
        
        // Bin count input
        const binCountGroup = createBinCountInput(x, currentY, 'Bins:', 
          currentOptions.binCount, (count) => {
          currentOptions.binCount = parseInt(count);
          renderChartContent();
        });
        container.appendChild(binCountGroup);
        currentY += 50;
      }
      
      // Filters section
      renderFiltersSection(container, x, currentY, width);
      
      // Save button at the bottom
      const saveButton = createSaveButton(x, chartDimensions.height - 60, width);
      container.appendChild(saveButton);
    }
    
    function createBinCountInput(x, y, label, currentValue, onChange) {
      const group = createSVGElement('g');
      
      // Label
      const labelText = createSVGElement('text', {
        x: x,
        y: y - 5,
        class: 'ui-label'
      });
      labelText.textContent = label;
      group.appendChild(labelText);
      
      // Create foreignObject for HTML input
      const foreignObject = createSVGElement('foreignObject', {
        x: x,
        y: y,
        width: 60,
        height: 22
      });
      
      // Create HTML input element
      const inputElement = document.createElementNS('http://www.w3.org/1999/xhtml', 'input');
      inputElement.setAttribute('type', 'number');
      inputElement.setAttribute('value', currentValue);
      inputElement.setAttribute('min', '3');
      inputElement.setAttribute('max', '100');
      inputElement.setAttribute('style', 
        'width: 56px; height: 20px; font-family: Arial, sans-serif; font-size: 11px; ' +
        'border: 1px solid #ccc; border-radius: 3px; background: white; padding: 2px; outline: none;'
      );
      
      inputElement.addEventListener('change', (e) => {
        const value = parseInt(e.target.value);
        if (value >= 3 && value <= 100) {
          onChange(value);
        }
      });
      
      foreignObject.appendChild(inputElement);
      group.appendChild(foreignObject);
      
      return group;
    }
  `;
}