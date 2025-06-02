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
      const { width, height, padding } = chartDimensions;
      const controlPanelWidth = 180; // Account for control panel
      const chartWidth = width - controlPanelWidth - padding - 20;
      const chartHeight = height - 2 * padding;
      
      // Calculate scales
      const xValues = data.rows.map(row => row[options.xField]).filter(v => typeof v === 'number');
      const yValues = data.rows.map(row => row[options.yField]).filter(v => typeof v === 'number');
      
      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      const yMin = Math.min(...yValues);
      const yMax = Math.max(...yValues);
      
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
      
      // Get unique groups for coloring
      const groups = options.groupField ? 
        [...new Set(data.rows.map(row => row[options.groupField]))] : 
        ['default'];
      
      const colors = generateColors(groups.length);
      const groupColorMap = {};
      groups.forEach((group, index) => {
        groupColorMap[group] = colors[index];
      });
      
      // Generate chart elements
      const points = data.rows.map((row, index) => {
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
      
      // Control panel dimensions
      const panelWidth = 160;
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
    }
    
    function createUIGroup(x, y, label, currentValue, options, onChange) {
      const group = createSVGElement('g');
      
      // Label
      const labelText = createSVGElement('text', {
        x: x,
        y: y - 5,
        class: 'ui-label'
      });
      labelText.textContent = label;
      group.appendChild(labelText);
      
      // Create foreignObject for HTML select
      const foreignObject = createSVGElement('foreignObject', {
        x: x,
        y: y,
        width: 130,
        height: 22
      });
      
      // Create HTML select element in XHTML namespace
      const selectElement = document.createElementNS('http://www.w3.org/1999/xhtml', 'select');
      
      // Set style attribute as string since we're in XML context
      selectElement.setAttribute('style', 
        'width: 130px; height: 20px; font-family: Arial, sans-serif; font-size: 11px; ' +
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
      // Render UI controls first
      renderUIControls();
      
      // Then render chart content
      renderChartContent();
    }
    
    function renderChartContent() {
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